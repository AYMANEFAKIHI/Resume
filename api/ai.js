// api/ai.js
// POST /api/ai?action=cover-letter   → generate cover letter for a job
// POST /api/ai?action=interview-prep → generate interview questions for a job
// POST /api/ai?action=outreach       → generate cold outreach email for a contact

import { verifyToken, getProfile, getJobById } from './_db.js'
import { generateCoverLetter, generateInterviewPrep, generateOutreachEmail } from './_claude.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const user    = await verifyToken(req)
    const action  = req.query.action
    const profile = await getProfile(user.id)
    if (!profile) return res.status(404).json({ error: 'Upload your resume first' })

    // ── Cover letter ──────────────────────────────────────────────────────────
    if (action === 'cover-letter') {
      const { job_id } = req.body ?? {}
      if (!job_id) return res.status(400).json({ error: 'job_id required' })
      const job = await getJobById(job_id)
      if (!job) return res.status(404).json({ error: 'Job not found' })
      const cover_letter = await generateCoverLetter(profile, job)
      return res.json({ cover_letter })
    }

    // ── Interview prep ────────────────────────────────────────────────────────
    if (action === 'interview-prep') {
      const { job_id } = req.body ?? {}
      if (!job_id) return res.status(400).json({ error: 'job_id required' })
      const job = await getJobById(job_id)
      if (!job) return res.status(404).json({ error: 'Job not found' })
      const prep = await generateInterviewPrep(profile, job, null)
      return res.json({ prep, job })
    }

    // ── Cold outreach email ───────────────────────────────────────────────────
    if (action === 'outreach') {
      const { contact, company } = req.body ?? {}
      if (!contact || !company) return res.status(400).json({ error: 'contact and company required' })
      const email = await generateOutreachEmail(profile, contact, company)
      return res.json({ email })
    }

    res.status(400).json({ error: `Unknown action: ${action}. Use cover-letter, interview-prep, or outreach.` })
  } catch (e) {
    console.error('[AI ERROR]', e.message)
    res.status(500).json({ error: e.message })
  }
}
