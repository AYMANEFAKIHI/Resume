import { getScraperHealth, verifyToken } from '../_db.js'

// GET /api/health — returns scraper health data for the last 7 days
// Useful for debugging and the admin dashboard

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    // Optional: require auth. Remove the next 2 lines to make it public.
    await verifyToken(req)

    const rows = await getScraperHealth()

    // Group by source for easier frontend consumption
    const bySource = {}
    for (const row of rows) {
      if (!bySource[row.source]) bySource[row.source] = []
      bySource[row.source].push(row)
    }

    const summary = Object.entries(bySource).map(([source, days]) => {
      const totalRuns = days.reduce((s, d) => s + d.runs, 0)
      const totalSuccesses = days.reduce((s, d) => s + d.successes, 0)
      const totalJobs = days.reduce((s, d) => s + d.total_jobs, 0)
      const latest = days.sort((a, b) => b.date.localeCompare(a.date))[0]
      return {
        source,
        success_rate: totalRuns > 0 ? Math.round((totalSuccesses / totalRuns) * 100) : 0,
        avg_jobs_per_run: totalRuns > 0 ? Math.round(totalJobs / totalRuns) : 0,
        last_run: latest?.last_run ?? null,
        status: totalRuns === 0 ? 'unknown'
          : (totalSuccesses / totalRuns) >= 0.7 ? 'healthy'
          : (totalSuccesses / totalRuns) >= 0.3 ? 'degraded'
          : 'down',
      }
    })

    res.json({ sources: summary, raw: rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
