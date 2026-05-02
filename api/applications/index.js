import { verifyToken, getApplications, updateApplication, deleteApplication } from '../_db.js'

export default async function handler(req, res) {
  try {
    const user = await verifyToken(req)

    if (req.method === 'GET') {
      const applications = await getApplications(user.id)
      return res.json({ applications })
    }

    // PATCH /api/applications?id=xxx
    if (req.method === 'PATCH') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'id required' })
      const application = await updateApplication(id, user.id, req.body)
      return res.json({ application })
    }

    // DELETE /api/applications?id=xxx
    if (req.method === 'DELETE') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'id required' })
      await deleteApplication(id, user.id)
      return res.json({ success: true })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
