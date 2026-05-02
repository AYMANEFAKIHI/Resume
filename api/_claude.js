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
      temperature: 0.2,
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
  // Remove markdown code blocks
  let clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  // Find the first { or [ and last } or ]
  const firstBrace = Math.min(
    clean.indexOf('{') === -1 ? Infinity : clean.indexOf('{'),
    clean.indexOf('[') === -1 ? Infinity : clean.indexOf('[')
  )
  const lastBrace = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'))
  if (firstBrace !== Infinity && lastBrace !== -1) {
    clean = clean.slice(firstBrace, lastBrace + 1)
  }
  // Fix unicode escape sequences that Groq sometimes produces incorrectly
  clean = clean.replace(/\\u(?![0-9a-fA-F]{4})/g, '\\\\u')
  // Remove control characters
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  return clean
}

function safeParseJSON(text) {
  try {
    return JSON.parse(cleanJSON(text))
  } catch (e) {
    // Last resort: use a more lenient approach
    try {
      // Replace any remaining problematic sequences
      const sanitized = cleanJSON(text)
        .replace(/\\'/g, "'")
        .replace(/([^\\])\\([^"\\\/bfnrtu])/g, '$1\\\\$2')
      return JSON.parse(sanitized)
    } catch (e2) {
      throw new Error(`JSON parse failed: ${e2.message}. Raw: ${text.slice(0, 200)}`)
    }
  }
}

export async function analyzeResume(rawText) {
  const text = await groq(`You are an expert resume parser. Extract structured information from this resume.
Return ONLY valid JSON, no markdown, no backticks, no explanation, no unicode escapes.
Use only plain ASCII characters in your response.
{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "title": "string",
  "summary": "string (2 sentences max, ASCII only)",
  "skills": ["array of up to 18 skills"],
  "experience_years": 0,
  "education": { "degree": "string", "institution": "string", "year": 2024, "field": "string" },
  "experience": [{ "title": "string", "company": "string", "duration": "string", "description": "string", "technologies": [] }],
  "preferred_roles": ["4-5 role types"],
  "preferred_locations": ["Remote"],
  "linkedin_url": "",
  "github_url": "",
  "portfolio_url": ""
}

RESUME:
${rawText.slice(0, 4000)}`, 2000)

  return safeParseJSON(text)
}

export async function scoreJobMatches(profile, jobs) {
  const profileSummary = `Candidate: ${profile.full_name}
Skills: ${profile.skills.join(', ')}
Experience: ${profile.experience_years} years
Education: ${profile.education?.degree} in ${profile.education?.field}
Preferred roles: ${profile.preferred_roles.join(', ')}`

  const jobsList = jobs.map((j, i) =>
    `${i}: "${j.title}" at ${j.company} — ${(j.description ?? '').slice(0, 200)}`
  ).join('\n')

  const text = await groq(`Score candidate vs internships. Return ONLY a JSON array, no markdown.
${profileSummary}
JOBS:
${jobsList}
Return: [{"score":0-100,"match_reasons":["reason"],"mismatch_reasons":["gap"]}]`, 3000)

  return safeParseJSON(text)
}

export async function generateCoverLetter(profile, job) {
  return groq(`Write a professional cover letter for this internship. 3 short paragraphs. Human tone.
Do NOT start with "I am writing to express my interest". No fluff. ASCII only.

CANDIDATE: ${profile.full_name}
SKILLS: ${profile.skills.slice(0, 10).join(', ')}
EDUCATION: ${profile.education?.degree} at ${profile.education?.institution}
EXPERIENCE: ${(profile.experience ?? []).slice(0, 2).map(e => `${e.title} at ${e.company}`).join(' | ')}

ROLE: ${job.title} at ${job.company}
DESCRIPTION: ${(job.description ?? '').slice(0, 500)}

Output the letter text only.`, 700)
}

export async function getResumeTips(profile, role) {
  const text = await groq(`Give 4 actionable tips to improve this resume for "${role}" internships.
Return ONLY a JSON array of 4 strings. No markdown.
Skills: ${profile.skills.join(', ')}
Experience: ${profile.experience_years} years`, 400)
  return safeParseJSON(text)
}
