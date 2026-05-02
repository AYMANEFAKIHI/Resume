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
      temperature: 0.1,
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

function robustParse(text) {
  // Step 1: extract JSON block
  let s = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const fb = Math.min(
    s.indexOf('{') >= 0 ? s.indexOf('{') : Infinity,
    s.indexOf('[') >= 0 ? s.indexOf('[') : Infinity
  )
  const lb = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'))
  if (fb < Infinity && lb >= 0) s = s.slice(fb, lb + 1)

  // Step 2: aggressive sanitization
  // Remove all non-printable characters except tab, newline, carriage return
  s = s.replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, '')
  // Fix bad unicode escapes like \u{XXXX} or \uXX (not 4 hex digits)
  s = s.replace(/\\u([0-9a-fA-F]{1,3})(?![0-9a-fA-F])/g, (_, h) => '\\u' + h.padStart(4, '0'))
  s = s.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => {
    const code = parseInt(h, 16)
    return code <= 0xFFFF ? String.fromCharCode(code) : '?'
  })
  // Fix unescaped backslashes (not followed by valid escape chars)
  s = s.replace(/\\([^"\\\/bfnrtu])/g, '$1')

  try {
    return JSON.parse(s)
  } catch(e) {
    // Step 3: last resort — encode to bytes and back to strip problem chars
    const encoded = encodeURIComponent(s)
    const decoded = decodeURIComponent(encoded)
    try {
      return JSON.parse(decoded)
    } catch(e2) {
      throw new Error(`Parse failed: ${e2.message} | snippet: ${s.slice(0, 100)}`)
    }
  }
}

export async function analyzeResume(rawText) {
  // Pre-sanitize input too — remove problematic chars from the CV text
  const safeText = rawText
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, ' ')
    .slice(0, 4000)

  const text = await groq(`Parse this resume and return ONLY a JSON object. No markdown. No backticks. No explanation.
Use simple ASCII text only in all string values.

Required JSON structure:
{"full_name":"","email":"","phone":"","location":"","title":"","summary":"","skills":[],"experience_years":0,"education":{"degree":"","institution":"","year":0,"field":""},"experience":[],"preferred_roles":[],"preferred_locations":["Remote"],"linkedin_url":"","github_url":"","portfolio_url":""}

RESUME TEXT:
${safeText}`, 1500)

  return robustParse(text)
}

export async function scoreJobMatches(profile, jobs) {
  const jobsList = jobs.map((j, i) =>
    `${i}: "${j.title}" at ${j.company} - ${(j.description ?? '').slice(0, 150)}`
  ).join('\n')

  const text = await groq(`Score these internships for this candidate. Return ONLY a JSON array.

Candidate skills: ${profile.skills.join(', ')}
Experience: ${profile.experience_years} years
Education: ${profile.education?.degree} in ${profile.education?.field}

Jobs:
${jobsList}

Return exactly: [{"score":50,"match_reasons":["reason"],"mismatch_reasons":["gap"]}]
One object per job. No markdown.`, 2000)

  return robustParse(text)
}

export async function generateCoverLetter(profile, job) {
  return groq(`Write a 3-paragraph cover letter for this internship. Professional but human tone.
Do not start with "I am writing". No fluff.

Applicant: ${profile.full_name}
Skills: ${profile.skills.slice(0, 8).join(', ')}
Education: ${profile.education?.degree} at ${profile.education?.institution}

Job: ${job.title} at ${job.company}
Description: ${(job.description ?? '').slice(0, 400)}

Write the letter body only.`, 600)
}

export async function getResumeTips(profile, role) {
  const text = await groq(`List 4 tips to improve this resume for "${role}" internships.
Return ONLY: ["tip1","tip2","tip3","tip4"]
No markdown. No explanation.
Skills: ${profile.skills.join(', ')}`, 300)
  return robustParse(text)
}
