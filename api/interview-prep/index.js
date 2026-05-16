import { verifyToken, getProfile, getJobById } from '../_db.js'
import { generateInterviewPrep } from '../_claude.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const user = await verifyToken(req)
    const { job_id } = req.body ?? {}
    if (!job_id) return res.status(400).json({ error: 'job_id required' })

    const [profile, job] = await Promise.all([
      getProfile(user.id),
      getJobById(job_id),
    ])

    if (!profile) return res.status(404).json({ error: 'Upload your resume first' })
    if (!job) return res.status(404).json({ error: 'Job not found' })

    const prep = await generateInterviewPrep(profile, job, null)
    res.json({ prep, job })
  } catch (e) {
    console.error('[INTERVIEW PREP ERROR]', e.message)
    res.status(500).json({ error: e.message })
  }
}
