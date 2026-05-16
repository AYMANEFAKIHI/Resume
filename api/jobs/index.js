import { verifyToken, getProfile, upsertJobListings, upsertJobMatches, getJobMatches, getCachedSearch, setCachedSearch } from '../_db.js'
import { scoreJobMatches } from '../_claude.js'
import { scrapeAllSources, scrapeTargetedCompanies } from '../_scrapers.js'

const TOP_MOROCCAN_COMPANIES = [
  'OCP', 'Renault', 'Orange', 'ONCF', 'Lafarge', 'STMicroelectronics',
  'Aptiv', 'LEAR', 'Yazaki', 'ALTEN', 'CGI', 'HPS', 'Cosumar',
  'Marsa Maroc', 'Mazars', 'Novec', 'JESA', 'GEP', 'Axians',
]

export default async function handler(req, res) {
  try {
    const user = await verifyToken(req)

    if (req.method === 'GET') {
      const jobs = await getJobMatches(user.id)
      return res.json({ jobs, total: jobs.length })
    }

    if (req.method === 'POST') {
      const profile = await getProfile(user.id)
      if (!profile) return res.status(404).json({ error: 'Upload your resume first' })

      const roles = req.body?.roles ?? profile.preferred_roles
      const locations = req.body?.locations ?? profile.preferred_locations
      const primaryRole = roles[0] ?? 'software engineer'
      const force = req.body?.force === true

      // ── Cache check ──────────────────────────────────────────────────────────
      // Return cached job matches if fresh (< 6h), unless force=true
      if (!force) {
        const cached = await getCachedSearch(user.id, primaryRole)
        if (cached) {
          const jobs = await getJobMatches(user.id)
          return res.json({
            jobs,
            total: jobs.length,
            from_cache: true,
            cached_at: cached.cached_at,
          })
        }
      }

      // ── Live scrape ──────────────────────────────────────────────────────────
      const [scraped, targeted] = await Promise.allSettled([
        scrapeAllSources(roles, locations),
        scrapeTargetedCompanies(primaryRole, TOP_MOROCCAN_COMPANIES),
      ])

      const allJobs = [
        ...(scraped.status === 'fulfilled' ? scraped.value : []),
        ...(targeted.status === 'fulfilled' ? targeted.value : []),
      ]

      // Deduplicate by apply_url
      const seen = new Set()
      const unique = allJobs.filter(j => {
        if (!j.apply_url || seen.has(j.apply_url)) return false
        seen.add(j.apply_url)
        return true
      })

      if (!unique.length) {
        // Even when no new jobs, return existing cached matches
        const existingJobs = await getJobMatches(user.id)
        return res.json({
          jobs: existingJobs,
          total: existingJobs.length,
          message: 'No new jobs found — showing previous results',
          scraped_count: 0,
        })
      }

      const saved = await upsertJobListings(unique)

      // ── Score in batches of 8 ────────────────────────────────────────────────
      const allScores = []
      for (let i = 0; i < saved.length; i += 8) {
        const batch = saved.slice(i, i + 8)
        try {
          const scores = await scoreJobMatches(profile, batch)
          scores.forEach((score, idx) => {
            if (batch[idx]) allScores.push({
              user_id: user.id,
              job_id: batch[idx].id,
              match_score: score.score,
              match_reasons: score.match_reasons,
              mismatch_reasons: score.mismatch_reasons,
            })
          })
        } catch (e) {
          console.error('[SCORE BATCH ERROR]', e.message)
        }
      }

      await upsertJobMatches(allScores)

      // Mark cache as fresh
      await setCachedSearch(user.id, primaryRole)

      const matches = await getJobMatches(user.id)
      return res.json({
        jobs: matches,
        total: matches.length,
        scraped_count: unique.length,
        from_cache: false,
      })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('[JOBS API ERROR]', e.message)
    res.status(500).json({ error: e.message })
  }
}
