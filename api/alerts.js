// api/alerts.js
// GET  /api/alerts              → get alert preferences
// PUT  /api/alerts              → update alert preferences
// POST /api/alerts?action=send  → trigger digest send (called by Vercel Cron)

import { verifyToken, getAlertPrefs, upsertAlertPrefs, getSupabase,
         getNewHighMatches, getProfile } from './_db.js'
import { generateAlertDigestHTML } from './_claude.js'

export default async function handler(req, res) {
  // ── Cron: send daily digest ───────────────────────────────────────────────
  if (req.query.action === 'send') {
    if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (!process.env.RESEND_API_KEY) {
      return res.json({ skipped: true, reason: 'No RESEND_API_KEY' })
    }
    const sb = getSupabase()
    const { data: prefs } = await sb.from('alert_prefs').select('*').eq('enabled', true)
    const now = new Date()
    const sent = [], skipped = [], errors = []

    for (const pref of prefs ?? []) {
      try {
        if (pref.last_sent_at) {
          const h = (now - new Date(pref.last_sent_at)) / 3600000
          if (pref.frequency === 'daily' && h < 20) { skipped.push(pref.user_id); continue }
          if (pref.frequency === 'weekly' && h < 144) { skipped.push(pref.user_id); continue }
        }
        const matches = await getNewHighMatches(pref.user_id, pref.min_score, pref.last_sent_at)
        if (!matches.length) { skipped.push(pref.user_id); continue }
        const profile = await getProfile(pref.user_id)
        if (!profile?.email) { skipped.push(pref.user_id); continue }
        const html = await generateAlertDigestHTML(profile, matches)
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'InternIQ <alerts@interniq.ma>',
            to: [profile.email],
            subject: `⚡ ${matches.length} new internship${matches.length > 1 ? 's' : ''} match your profile`,
            html,
          }),
        })
        if (emailRes.ok) {
          await sb.from('alert_prefs').update({ last_sent_at: now.toISOString() }).eq('user_id', pref.user_id)
          sent.push(pref.user_id)
        } else {
          const err = await emailRes.json()
          errors.push({ user_id: pref.user_id, error: err.message })
        }
      } catch (e) {
        errors.push({ user_id: pref.user_id, error: e.message })
      }
    }
    return res.json({ sent: sent.length, skipped: skipped.length, errors })
  }

  // ── User preferences ──────────────────────────────────────────────────────
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
