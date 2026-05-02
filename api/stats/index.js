import { verifyToken, getDashboardStats } from '../_db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const user = await verifyToken(req)
    const stats = await getDashboardStats(user.id)
    res.json({ stats })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
