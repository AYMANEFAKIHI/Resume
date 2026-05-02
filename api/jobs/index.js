import { verifyToken, getProfile, upsertJobListings, upsertJobMatches, getJobMatches } from '../_db.js'
import { scoreJobMatches } from '../_claude.js'
import { scrapeAllSources } from '../_scrapers.js'

export default async function handler(req, res) {
  try {
    const user = await verifyToken(req)

    // GET — return saved matches
    if (req.method === 'GET') {
      const jobs = await getJobMatches(user.id)
      return res.json({ jobs, total: jobs.length })
    }

    // POST /api/jobs/search — scrape + score
    if (req.method === 'POST') {
      const profile = await getProfile(user.id)
      if (!profile) return res.status(404).json({ error: 'Upload your resume first' })

      const roles = req.body?.roles ?? profile.preferred_roles
      const locations = req.body?.locations ?? profile.preferred_locations

      const scraped = await scrapeAllSources(roles, locations)
      if (!scraped.length) return res.json({ jobs: [], total: 0, message: 'No jobs found' })

      const saved = await upsertJobListings(scraped)

      // Score in batches of 8
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
        } catch (e) { console.error('Batch score error:', e) }
      }

      await upsertJobMatches(allScores)
      const matches = await getJobMatches(user.id)
      return res.json({ jobs: matches, total: matches.length })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
