// api/resume.js
// GET  /api/resume?action=profile  → get profile
// PUT  /api/resume?action=profile  → update profile
// GET  /api/resume?action=tips     → quick resume tips
// POST /api/resume?action=tips     → deep improvement analysis
// POST /api/resume?action=upload   → upload + analyze resume (PDF / DOCX / text)

import { verifyToken, getProfile, upsertProfile, getJobMatches } from './_db.js'
import { analyzeResume, extractDocxText, getResumeTips, getResumeImprovement } from './_claude.js'

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
}

function cleanText(text) {
  return text
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u024F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function extractPDFText(base64Data) {
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
  const buffer = Buffer.from(base64Data, 'base64')
  const data = await pdfParse(buffer)
  return data.text
}

export default async function handler(req, res) {
  try {
    const user = await verifyToken(req)
    const action = req.query.action ?? 'profile'

    // ── Profile ───────────────────────────────────────────────────────────────
    if (action === 'profile') {
      if (req.method === 'GET') {
        const profile = await getProfile(user.id)
        if (!profile) return res.status(404).json({ error: 'No profile found. Upload your resume first.' })
        return res.json({ profile })
      }
      if (req.method === 'PUT') {
        const profile = await upsertProfile(user.id, req.body)
        return res.json({ profile })
      }
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // ── Tips / improvement ────────────────────────────────────────────────────
    if (action === 'tips') {
      const profile = await getProfile(user.id)
      if (!profile) return res.status(404).json({ error: 'No profile found' })

      if (req.method === 'GET') {
        // Quick tips (fast)
        const tips = await getResumeTips(profile, profile.preferred_roles?.[0] ?? 'Software Engineer')
        return res.json({ tips })
      }
      if (req.method === 'POST') {
        // Deep improvement analysis vs job matches
        const matches = await getJobMatches(user.id)
        const improvement = await getResumeImprovement(profile, matches.slice(0, 5))
        return res.json({ improvement })
      }
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // ── Upload ────────────────────────────────────────────────────────────────
    if (action === 'upload') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

      const { text, pdf_base64, docx_base64, filename } = req.body ?? {}
      let rawText = ''

      if (pdf_base64) {
        try { rawText = await extractPDFText(pdf_base64) }
        catch (e) { return res.status(400).json({ error: 'Failed to parse PDF: ' + e.message }) }
      } else if (docx_base64) {
        try { rawText = await extractDocxText(docx_base64) }
        catch (e) { return res.status(400).json({ error: 'Failed to parse DOCX: ' + e.message }) }
      } else if (text) {
        rawText = text
      } else {
        return res.status(400).json({ error: 'Provide text, pdf_base64, or docx_base64' })
      }

      const clean = cleanText(rawText)
      if (clean.length < 50) return res.status(400).json({ error: 'Resume text too short' })

      const parsed = await analyzeResume(clean)
      const profile_data = {
        full_name:           String(parsed.full_name ?? ''),
        email:               String(parsed.email ?? ''),
        phone:               String(parsed.phone ?? ''),
        location:            String(parsed.location ?? ''),
        title:               String(parsed.title ?? ''),
        summary:             String(parsed.summary ?? ''),
        skills:              Array.isArray(parsed.skills) ? parsed.skills.map(String) : [],
        experience_years:    Number(parsed.experience_years ?? 0),
        education:           parsed.education ?? {},
        experience:          Array.isArray(parsed.experience) ? parsed.experience : [],
        preferred_roles:     Array.isArray(parsed.preferred_roles) ? parsed.preferred_roles.map(String) : [],
        preferred_locations: Array.isArray(parsed.preferred_locations) ? parsed.preferred_locations.map(String) : ['Remote'],
        linkedin_url:        String(parsed.linkedin_url ?? ''),
        github_url:          String(parsed.github_url ?? ''),
        portfolio_url:       String(parsed.portfolio_url ?? ''),
        raw_text:            clean,
      }

      const profile = await upsertProfile(user.id, profile_data)
      return res.json({ profile })
    }

    res.status(400).json({ error: `Unknown action: ${action}` })
  } catch (e) {
    console.error('[RESUME ERROR]', e.message)
    res.status(500).json({ error: e.message })
  }
}
