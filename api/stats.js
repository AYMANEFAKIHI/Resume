// api/stats.js
// GET /api/stats               → dashboard stats
// GET /api/stats?action=health → scraper health data

import { verifyToken, getDashboardStats, getScraperHealth } from './_db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const user = await verifyToken(req)

    if (req.query.action === 'health') {
      const rows = await getScraperHealth()
      const bySource = {}
      for (const row of rows) {
        if (!bySource[row.source]) bySource[row.source] = []
        bySource[row.source].push(row)
      }
      const sources = Object.entries(bySource).map(([source, days]) => {
        const totalRuns      = days.reduce((s, d) => s + d.runs, 0)
        const totalSuccesses = days.reduce((s, d) => s + d.successes, 0)
        const totalJobs      = days.reduce((s, d) => s + d.total_jobs, 0)
        const latest         = days.sort((a, b) => b.date.localeCompare(a.date))[0]
        return {
          source,
          success_rate:    totalRuns > 0 ? Math.round((totalSuccesses / totalRuns) * 100) : 0,
          avg_jobs_per_run: totalRuns > 0 ? Math.round(totalJobs / totalRuns) : 0,
          last_run:        latest?.last_run ?? null,
          status:          totalRuns === 0 ? 'unknown'
            : (totalSuccesses / totalRuns) >= 0.7 ? 'healthy'
            : (totalSuccesses / totalRuns) >= 0.3 ? 'degraded'
            : 'down',
        }
      })
      return res.json({ sources, raw: rows })
    }

    const stats = await getDashboardStats(user.id)
    res.json({ stats })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
