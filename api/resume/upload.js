import { verifyToken, upsertProfile } from '../_db.js'
import { analyzeResume } from '../_claude.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const user = await verifyToken(req)
    const { text } = req.body ?? {}
    if (!text || text.trim().length < 50)
      return res.status(400).json({ error: 'Please provide resume text (min 50 characters)' })

    const parsed = await analyzeResume(text)

    // Sanitize — only keep known fields to avoid Supabase 400
    const clean = {
      full_name: String(parsed.full_name ?? ''),
      email: String(parsed.email ?? ''),
      phone: String(parsed.phone ?? ''),
      location: String(parsed.location ?? ''),
      title: String(parsed.title ?? ''),
      summary: String(parsed.summary ?? ''),
      skills: Array.isArray(parsed.skills) ? parsed.skills.map(String) : [],
      experience_years: Number(parsed.experience_years ?? 0),
      education: parsed.education ?? {},
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      preferred_roles: Array.isArray(parsed.preferred_roles) ? parsed.preferred_roles.map(String) : [],
      preferred_locations: Array.isArray(parsed.preferred_locations) ? parsed.preferred_locations.map(String) : ['Remote'],
      linkedin_url: String(parsed.linkedin_url ?? ''),
      github_url: String(parsed.github_url ?? ''),
      portfolio_url: String(parsed.portfolio_url ?? ''),
      raw_text: text,
    }

    console.log('Inserting profile:', JSON.stringify(clean).slice(0, 200))
    const profile = await upsertProfile(user.id, clean)
    res.json({ profile })
  } catch (e) {
    console.error('UPLOAD ERROR:', e.message)
    res.status(500).json({ error: e.message })
  }
}
