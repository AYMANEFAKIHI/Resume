// api/applications.js
// GET    /api/applications               → list all applications
// PATCH  /api/applications?id=xxx        → update status
// DELETE /api/applications?id=xxx        → delete
// POST   /api/applications?action=apply  → apply to a job (creates application + cover letter)

import { verifyToken, getApplications, updateApplication, deleteApplication,
         getProfile, getJobById, createApplication, getApplicationByJob } from './_db.js'
import { generateCoverLetter } from './_claude.js'

export default async function handler(req, res) {
  try {
    const user = await verifyToken(req)
    const action = req.query.action
    const id     = req.query.id

    // ── Apply to a job ────────────────────────────────────────────────────────
    if (action === 'apply' && req.method === 'POST') {
      const { job_id, cover_letter } = req.body ?? {}
      if (!job_id) return res.status(400).json({ error: 'job_id required' })

      const existing = await getApplicationByJob(user.id, job_id)
      if (existing) return res.status(409).json({ error: 'Already applied', application: existing })

      const [profile, job] = await Promise.all([getProfile(user.id), getJobById(job_id)])
      if (!profile) return res.status(404).json({ error: 'No profile found' })
      if (!job) return res.status(404).json({ error: 'Job not found' })

      const cl = cover_letter ?? await generateCoverLetter(profile, job)
      const application = await createApplication({
        user_id: user.id,
        job_id,
        cover_letter: cl,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })

      return res.json({ application, apply_url: job.apply_url, message: 'Cover letter ready! Opening application page.' })
    }

    // ── List ──────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const applications = await getApplications(user.id)
      return res.json({ applications })
    }

    // ── Update ────────────────────────────────────────────────────────────────
    if (req.method === 'PATCH') {
      if (!id) return res.status(400).json({ error: 'id required' })
      const application = await updateApplication(id, user.id, req.body)
      return res.json({ application })
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id required' })
      await deleteApplication(id, user.id)
      return res.json({ success: true })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
