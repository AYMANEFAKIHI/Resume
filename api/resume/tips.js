import { verifyToken, getProfile, getJobMatches } from '../_db.js'
import { getResumeTips, getResumeImprovement } from '../_claude.js'

export default async function handler(req, res) {
  try {
    const user = await verifyToken(req)
    const profile = await getProfile(user.id)
    if (!profile) return res.status(404).json({ error: 'No profile found' })

    if (req.method === 'GET') {
      // Simple tips (fast)
      const tips = await getResumeTips(profile, profile.preferred_roles[0] ?? 'Software Engineer')
      return res.json({ tips })
    }

    if (req.method === 'POST') {
      // Deep analysis against actual applied jobs (slower, richer)
      const matches = await getJobMatches(user.id)
      const topJobs = matches.slice(0, 5)
      const improvement = await getResumeImprovement(profile, topJobs)
      return res.json({ improvement })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
