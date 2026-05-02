// Using Groq API (free) instead of Anthropic

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

async function groq(prompt, maxTokens = 2000) {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Groq error ${res.status}: ${err.error?.message ?? JSON.stringify(err)}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

function cleanJSON(text) {
  // Remove markdown code blocks if present
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
}

// ── Resume Analysis ───────────────────────────────────────────────────────────

export async function analyzeResume(rawText) {
  const text = await groq(`You are an expert resume parser. Extract all structured information from this resume.
Return ONLY valid JSON with no markdown, no backticks, no explanation. Exactly this shape:
{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "title": "string (infer from experience, e.g. 'Frontend Developer' or 'CS Student')",
  "summary": "string (write a compelling 2-sentence professional summary)",
  "skills": ["up to 18 skills — mix technical and soft skills"],
  "experience_years": number,
  "education": { "degree": "string", "institution": "string", "year": number, "field": "string" },
  "experience": [{ "title": "string", "company": "string", "duration": "string", "description": "string", "technologies": ["array"] }],
  "preferred_roles": ["4-5 internship role types they would be good for"],
  "preferred_locations": ["locations from resume, or Remote if none found"],
  "linkedin_url": "string or empty",
  "github_url": "string or empty",
  "portfolio_url": "string or empty"
}

RESUME:
${rawText.slice(0, 5000)}`, 2000)

  return JSON.parse(cleanJSON(text))
}

// ── Job Match Scoring ─────────────────────────────────────────────────────────

export async function scoreJobMatches(profile, jobs) {
  const profileSummary = `
Candidate: ${profile.full_name}
Skills: ${profile.skills.join(', ')}
Experience: ${profile.experience_years} years
Education: ${profile.education?.degree} in ${profile.education?.field} at ${profile.education?.institution}
Preferred roles: ${profile.preferred_roles.join(', ')}
Recent experience: ${(profile.experience ?? []).slice(0, 3).map(e => `${e.title} at ${e.company}`).join(' | ')}`

  const jobsList = jobs.map((j, i) =>
    `${i}: "${j.title}" at ${j.company} (${j.location}) — ${(j.description ?? '').slice(0, 250)}`
  ).join('\n')

  const text = await groq(`Score how well this candidate matches each internship listing. Be realistic and precise.

${profileSummary}

INTERNSHIP LISTINGS:
${jobsList}

Return ONLY a valid JSON array with one object per job in the SAME ORDER:
[{"score": 0-100, "match_reasons": ["up to 3 specific reasons"], "mismatch_reasons": ["up to 2 gaps"]}]

No markdown, no explanation. Just the JSON array.`, 3000)

  return JSON.parse(cleanJSON(text))
}

// ── Cover Letter Generation ───────────────────────────────────────────────────

export async function generateCoverLetter(profile, job) {
  return groq(`Write a professional, tailored cover letter for this internship application.

Rules:
- Exactly 3 short paragraphs
- Human and confident tone — not robotic
- DO NOT start with "I am writing to express my interest"
- Be specific about skills and how they match this role
- End with a confident call to action
- No date, no address block, no subject line

CANDIDATE:
Name: ${profile.full_name}
Skills: ${profile.skills.slice(0, 12).join(', ')}
Education: ${profile.education?.degree} in ${profile.education?.field} at ${profile.education?.institution}
Experience: ${(profile.experience ?? []).slice(0, 2).map(e => `${e.title} at ${e.company}: ${e.description}`).join(' | ')}

ROLE: ${job.title} at ${job.company} (${job.location})
DESCRIPTION: ${(job.description ?? '').slice(0, 600)}

Output the cover letter text only.`, 800)
}

// ── Resume Tips ───────────────────────────────────────────────────────────────

export async function getResumeTips(profile, role) {
  const text = await groq(`Give 4 specific, actionable tips to improve this resume for "${role}" internship roles.
Return ONLY a JSON array of 4 strings. No markdown, no explanation.

Candidate skills: ${profile.skills.join(', ')}
Experience: ${profile.experience_years} years
Education: ${profile.education?.degree} in ${profile.education?.field}`, 500)

  return JSON.parse(cleanJSON(text))
}
