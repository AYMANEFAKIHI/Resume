import { verifyToken, getAlertPrefs, upsertAlertPrefs } from '../_db.js'

// GET  /api/alerts — get current preferences
// PUT  /api/alerts — update preferences
// POST /api/alerts/send — trigger manual digest send (or called by cron)

export default async function handler(req, res) {
  try {
    const user = await verifyToken(req)

    if (req.method === 'GET') {
      const prefs = await getAlertPrefs(user.id)
      return res.json({ prefs })
    }

    if (req.method === 'PUT') {
      const { frequency, min_score, enabled } = req.body ?? {}
      await upsertAlertPrefs(user.id, {
        frequency: frequency ?? 'daily',
        min_score: Math.max(0, Math.min(100, Number(min_score ?? 70))),
        enabled: enabled !== false,
      })
      return res.json({ success: true })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
