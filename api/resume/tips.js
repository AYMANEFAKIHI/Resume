import { verifyToken, getProfile } from '../_db.js'
import { getResumeTips } from '../_claude.js'

export default async function handler(req, res) {
  try {
    const user = await verifyToken(req)
    const profile = await getProfile(user.id)
    if (!profile) return res.status(404).json({ error: 'No profile found' })
    const tips = await getResumeTips(profile, profile.preferred_roles[0] ?? 'Software Engineer')
    res.json({ tips })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
