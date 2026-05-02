import { verifyToken, upsertProfile } from '../_db.js'
import { analyzeResume } from '../_claude.js'

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
}

function cleanText(text) {
  return text
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u024F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function extractPDFText(base64Data) {
  // Dynamically import pdf-parse
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
  const buffer = Buffer.from(base64Data, 'base64')
  const data = await pdfParse(buffer)
  return data.text
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const user = await verifyToken(req)
    const { text, pdf_base64, filename } = req.body ?? {}

    let rawText = ''

    if (pdf_base64) {
      // PDF uploaded as base64
      try {
        rawText = await extractPDFText(pdf_base64)
      } catch (e) {
        return res.status(400).json({ error: 'Failed to parse PDF: ' + e.message })
      }
    } else if (text) {
      rawText = text
    } else {
      return res.status(400).json({ error: 'Provide text or pdf_base64' })
    }

    const clean = cleanText(rawText)
    if (clean.length < 50) {
      return res.status(400).json({ error: 'Resume text too short — please provide more content' })
    }

    const parsed = await analyzeResume(clean)

    const profile_data = {
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
      raw_text: clean,
    }

    const profile = await upsertProfile(user.id, profile_data)
    res.json({ profile })
  } catch (e) {
    console.error('UPLOAD ERROR:', e.message)
    res.status(500).json({ error: e.message })
  }
}
