import { verifyToken, upsertProfile, uploadResume } from '../_db.js'
import { analyzeResume } from '../_claude.js'

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const user = await verifyToken(req)
    const { text } = req.body ?? {}
    if (!text || text.trim().length < 50)
      return res.status(400).json({ error: 'Please provide resume text (min 50 characters)' })

    const parsed = await analyzeResume(text)
    const profile = await upsertProfile(user.id, { ...parsed, raw_text: text })
    res.json({ profile })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
