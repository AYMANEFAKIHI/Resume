import Anthropic from '@anthropic-ai/sdk'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function analyzeResume(rawText) {
  const client = getClient()
  const res = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are an expert resume parser. Extract all structured information from this resume.
Return ONLY valid JSON with no markdown, no backticks, no explanation. Exactly this shape:
{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "title": "string (infer from experience)",
  "summary": "string (2-sentence professional summary you write)",
  "skills": ["up to 18 skills"],
  "experience_years": number,
  "education": { "degree": "string", "institution": "string", "year": number, "field": "string" },
  "experience": [{ "title": "string", "company": "string", "duration": "string", "description": "string", "technologies": ["array"] }],
  "preferred_roles": ["4-5 internship role types"],
  "preferred_locations": ["locations from resume, or Remote"],
  "linkedin_url": "string",
  "github_url": "string",
  "portfolio_url": "string"
}
RESUME:
${rawText.slice(0, 5000)}`
    }]
  })
  const text = res.content[0].text
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}

export async function scoreJobMatches(profile, jobs) {
  const client = getClient()
  const profileSummary = `
Candidate: ${profile.full_name}
Skills: ${profile.skills.join(', ')}
Experience: ${profile.experience_years} years
Education: ${profile.education?.degree} in ${profile.education?.field} at ${profile.education?.institution}
Preferred roles: ${profile.preferred_roles.join(', ')}
Recent experience: ${(profile.experience ?? []).slice(0, 3).map(e => `${e.title} at ${e.company}`).join(' | ')}`

  const jobsList = jobs.map((j, i) =>
    `${i}: "${j.title}" at ${j.company} (${j.location}) — ${(j.description ?? '').slice(0, 300)}`
  ).join('\n')

  const res = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Score how well this candidate matches each internship. Be realistic.
${profileSummary}
LISTINGS:
${jobsList}
Return ONLY a JSON array, one object per job in same order:
[{"score": 0-100, "match_reasons": ["up to 3 reasons"], "mismatch_reasons": ["up to 2 gaps"]}]`
    }]
  })
  const text = res.content[0].text
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}

export async function generateCoverLetter(profile, job) {
  const client = getClient()
  const res = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Write a professional cover letter for this internship. 3 short paragraphs. Human tone.
DO NOT start with "I am writing to express my interest". No fluff.

CANDIDATE: ${profile.full_name}
SKILLS: ${profile.skills.slice(0, 12).join(', ')}
EDUCATION: ${profile.education?.degree} in ${profile.education?.field} at ${profile.education?.institution}
EXPERIENCE: ${(profile.experience ?? []).slice(0, 2).map(e => `${e.title} at ${e.company}: ${e.description}`).join(' | ')}

ROLE: ${job.title} at ${job.company} (${job.location})
DESCRIPTION: ${(job.description ?? '').slice(0, 800)}

Output letter text only.`
    }]
  })
  return res.content[0].text
}

export async function getResumeTips(profile, role) {
  const client = getClient()
  const res = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Give 4 specific actionable tips to improve this resume for "${role}" internships.
Return ONLY a JSON array of strings. No markdown.
Skills: ${profile.skills.join(', ')}
Experience: ${profile.experience_years} years
Education: ${profile.education?.degree} in ${profile.education?.field}`
    }]
  })
  return JSON.parse(res.content[0].text.replace(/```json|```/g, '').trim())
}
