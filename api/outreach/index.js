import { verifyToken, getProfile } from '../_db.js'
import { generateOutreachEmail } from '../_claude.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const user = await verifyToken(req)
    const { contact, company } = req.body ?? {}
    if (!contact || !company) return res.status(400).json({ error: 'contact and company required' })

    const profile = await getProfile(user.id)
    if (!profile) return res.status(404).json({ error: 'Upload your resume first' })

    const email = await generateOutreachEmail(profile, contact, company)
    res.json({ email })
  } catch (e) {
    console.error('[OUTREACH ERROR]', e.message)
    res.status(500).json({ error: e.message })
  }
}
