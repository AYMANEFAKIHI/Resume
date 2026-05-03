import { getSupabase } from '../_db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { message, email, type } = req.body ?? {}
  if (!message || message.trim().length < 3)
    return res.status(400).json({ error: 'Message required' })

  try {
    const sb = getSupabase()
    await sb.from('feedback').insert({
      message: message.trim(),
      email: email ?? null,
      type: type ?? 'general',
      created_at: new Date().toISOString(),
    })
    res.json({ success: true })
  } catch (e) {
    // Even if DB fails, don't show error to user
    console.error('Feedback error:', e.message)
    res.json({ success: true })
  }
}
