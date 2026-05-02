import { verifyToken, getProfile, getJobById, createApplication, updateApplication, getApplicationByJob } from '../_db.js'
import { generateCoverLetter } from '../_claude.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const user = await verifyToken(req)
    const { job_id, cover_letter } = req.body ?? {}
    if (!job_id) return res.status(400).json({ error: 'job_id required' })

    // Already applied?
    const existing = await getApplicationByJob(user.id, job_id)
    if (existing) return res.status(409).json({ error: 'Already applied', application: existing })

    const [profile, job] = await Promise.all([getProfile(user.id), getJobById(job_id)])
    if (!profile) return res.status(404).json({ error: 'No profile found' })
    if (!job) return res.status(404).json({ error: 'Job not found' })

    // Generate cover letter if not provided
    const cl = cover_letter ?? await generateCoverLetter(profile, job)

    // Note: Playwright auto-apply can't run in Vercel serverless (no browser).
    // We save the application as "submitted" and open the job URL for the user.
    // For full auto-apply, use the backend version on a VPS.
    const application = await createApplication({
      user_id: user.id,
      job_id,
      cover_letter: cl,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })

    res.json({
      application,
      apply_url: job.apply_url,
      message: 'Cover letter ready! Opening application page.',
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
