import { verifyToken, getDashboardStats } from '../_db.js'

export default async function handler(req, res) {
  try {
    const user = await verifyToken(req)
    const stats = await getDashboardStats(user.id)
    res.json({ stats })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
