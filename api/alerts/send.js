// api/alerts/send.js
// Called by Vercel Cron: every day at 8:00 AM Morocco time (UTC+1)
// Configure in vercel.json: { "crons": [{ "path": "/api/alerts/send", "schedule": "0 7 * * *" }] }

import { getSupabase, getNewHighMatches, getAlertPrefs, getProfile } from '../_db.js'
import { generateAlertDigestHTML } from '../_claude.js'

export default async function handler(req, res) {
  // Vercel Cron sends GET; protect with a secret so only Vercel can trigger it
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()

  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!process.env.RESEND_API_KEY) {
    return res.json({ skipped: true, reason: 'No RESEND_API_KEY configured' })
  }

  const sb = getSupabase()

  // Get all users with alerts enabled
  const { data: prefs, error } = await sb
    .from('alert_prefs')
    .select('user_id, frequency, min_score, last_sent_at')
    .eq('enabled', true)

  if (error) return res.status(500).json({ error: error.message })

  const now = new Date()
  const sent = []
  const skipped = []
  const errors = []

  for (const pref of prefs ?? []) {
    try {
      // Check frequency: skip if we sent in last 20h (daily) or 6 days (weekly)
      if (pref.last_sent_at) {
        const hoursSinceLast = (now - new Date(pref.last_sent_at)) / 3600000
        if (pref.frequency === 'daily' && hoursSinceLast < 20) { skipped.push(pref.user_id); continue }
        if (pref.frequency === 'weekly' && hoursSinceLast < 144) { skipped.push(pref.user_id); continue }
      }

      const matches = await getNewHighMatches(pref.user_id, pref.min_score, pref.last_sent_at)
      if (!matches.length) { skipped.push(pref.user_id); continue }

      const profile = await getProfile(pref.user_id)
      if (!profile?.email) { skipped.push(pref.user_id); continue }

      const html = await generateAlertDigestHTML(profile, matches)

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'InternIQ <alerts@interniq.ma>',
          to: [profile.email],
          subject: `⚡ ${matches.length} new internship${matches.length > 1 ? 's' : ''} match your profile`,
          html,
        }),
      })

      if (emailRes.ok) {
        // Update last_sent_at
        await sb.from('alert_prefs')
          .update({ last_sent_at: now.toISOString() })
          .eq('user_id', pref.user_id)
        sent.push(pref.user_id)
      } else {
        const err = await emailRes.json()
        errors.push({ user_id: pref.user_id, error: err.message })
      }
    } catch (e) {
      errors.push({ user_id: pref.user_id, error: e.message })
    }
  }

  console.log(`[ALERT DIGEST] sent=${sent.length} skipped=${skipped.length} errors=${errors.length}`)
  res.json({ sent: sent.length, skipped: skipped.length, errors })
}
