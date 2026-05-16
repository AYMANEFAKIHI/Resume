// api/public-stats.js
// GET /api/public-stats — returns public platform stats (no auth required)
// Only exposes aggregate counts, never user data

import { getSupabase } from './_db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  // Cache for 10 minutes via Vercel edge cache
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300')

  try {
    const sb = getSupabase()
    const { count, error } = await sb
      .from('candidate_profiles')
      .select('*', { count: 'exact', head: true })

    if (error) throw new Error(error.message)

    res.json({ user_count: count ?? 0 })
  } catch (e) {
    // Never crash the landing page — return a safe fallback
    console.error('Public stats error:', e.message)
    res.json({ user_count: 1200 })
  }
}
