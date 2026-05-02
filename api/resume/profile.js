import { verifyToken, getProfile, upsertProfile } from '../_db.js'
import { getResumeTips } from '../_claude.js'

export default async function handler(req, res) {
  try {
    const user = await verifyToken(req)
    if (req.method === 'GET') {
      const profile = await getProfile(user.id)
      if (!profile) return res.status(404).json({ error: 'No profile found. Upload your resume first.' })
      return res.json({ profile })
    }
    if (req.method === 'PUT') {
      const profile = await upsertProfile(user.id, req.body)
      return res.json({ profile })
    }
    res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
