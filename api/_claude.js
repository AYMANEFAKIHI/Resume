// ── AI helpers ────────────────────────────────────────────────────────────────
// Uses Groq (fast/free) for most tasks.
// Uses Anthropic claude-haiku for resume analysis (better structured output).

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

// ── Retry wrapper ─────────────────────────────────────────────────────────────

async function withRetry(fn, maxAttempts = 3) {
  let lastError
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, 800 * Math.pow(2, attempt)))
      }
    }
  }
  throw lastError
}

// ── Groq call ─────────────────────────────────────────────────────────────────

async function groq(prompt, maxTokens = 2000, temperature = 0.1) {
  return withRetry(async () => {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(`Groq ${res.status}: ${err.error?.message ?? JSON.stringify(err)}`)
    }
    const data = await res.json()
    return data.choices[0].message.content
  })
}

// ── Anthropic call (for resume analysis — better at structured JSON) ───────────

async function anthropic(prompt, maxTokens = 1500) {
  return withRetry(async () => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(`Anthropic ${res.status}: ${err.error?.message ?? JSON.stringify(err)}`)
    }
    const data = await res.json()
    return data.content[0].text
  })
}

// ── JSON parser (robust, handles Groq quirks + Arabic/French text) ────────────

export function robustParse(text) {
  let s = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const fb = Math.min(
    s.indexOf('{') >= 0 ? s.indexOf('{') : Infinity,
    s.indexOf('[') >= 0 ? s.indexOf('[') : Infinity
  )
  const lb = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'))
  if (fb < Infinity && lb >= 0) s = s.slice(fb, lb + 1)

  s = s.replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, '')
  s = s.replace(/\\u([0-9a-fA-F]{1,3})(?![0-9a-fA-F])/g, (_, h) => '\\u' + h.padStart(4, '0'))
  s = s.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => {
    const code = parseInt(h, 16)
    return code <= 0xFFFF ? String.fromCharCode(code) : '?'
  })
  s = s.replace(/\\([^"\\\/bfnrtu])/g, '$1')

  try { return JSON.parse(s) } catch (e) {
    const decoded = decodeURIComponent(encodeURIComponent(s))
    try { return JSON.parse(decoded) } catch (e2) {
      throw new Error(`Parse failed: ${e2.message} | snippet: ${s.slice(0, 100)}`)
    }
  }
}

// ── DOCX text extraction ──────────────────────────────────────────────────────

export async function extractDocxText(base64Data) {
  const mammoth = (await import('mammoth')).default
  const buffer = Buffer.from(base64Data, 'base64')
  const result = await mammoth.extractRawText({ buffer })
  if (result.messages?.length) {
    console.log('Mammoth messages:', result.messages.map(m => m.message).join('; '))
  }
  return result.value
}

// ── Resume analysis ───────────────────────────────────────────────────────────
// Uses Anthropic claude-haiku for more reliable structured output

export async function analyzeResume(rawText) {
  const safeText = rawText
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, ' ')
    .slice(0, 5000)

  const useAnthropic = !!process.env.ANTHROPIC_API_KEY

  const prompt = `Parse this resume and return ONLY a JSON object. No markdown. No backticks. No explanation.
Use simple ASCII text only in all string values.

Required JSON structure:
{"full_name":"","email":"","phone":"","location":"","title":"","summary":"","skills":[],"experience_years":0,"education":{"degree":"","institution":"","year":0,"field":""},"experience":[],"preferred_roles":[],"preferred_locations":["Remote"],"linkedin_url":"","github_url":"","portfolio_url":""}

RESUME TEXT:
${safeText}`

  const text = useAnthropic ? await anthropic(prompt, 1500) : await groq(prompt, 1500)
  return robustParse(text)
}

// ── Job match scoring ─────────────────────────────────────────────────────────

export async function scoreJobMatches(profile, jobs) {
  const jobsList = jobs.map((j, i) =>
    `${i}: "${j.title}" at ${j.company} — ${(j.description ?? '').slice(0, 150)}`
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

// ── Cover letter ──────────────────────────────────────────────────────────────

export async function generateCoverLetter(profile, job) {
  return groq(`Write a 3-paragraph cover letter for this internship. Professional but human tone.
Do not start with "I am writing". No fluff.

Applicant: ${profile.full_name}
Skills: ${profile.skills.slice(0, 8).join(', ')}
Education: ${profile.education?.degree} at ${profile.education?.institution}

Job: ${job.title} at ${job.company}
Description: ${(job.description ?? '').slice(0, 400)}

Write the letter body only.`, 600, 0.3)
}

// ── Resume improvement suggestions ───────────────────────────────────────────
// Compares profile against their applied/matched jobs to give specific rewrites

export async function getResumeTips(profile, role) {
  const text = await groq(`List 4 specific, actionable tips to improve this resume for "${role}" internships in Morocco.
Return ONLY: ["tip1","tip2","tip3","tip4"]
No markdown. No explanation.
Skills: ${profile.skills.join(', ')}
Experience: ${profile.experience_years} years
Education: ${profile.education?.degree} in ${profile.education?.field}`, 400)
  return robustParse(text)
}

export async function getResumeImprovement(profile, topJobs) {
  const jobReqs = topJobs.slice(0, 5).map(j =>
    `- ${j.job?.title ?? j.title} at ${j.job?.company ?? j.company}: ${(j.job?.description ?? j.description ?? '').slice(0, 200)}`
  ).join('\n')

  const text = await groq(`You are a Moroccan career counselor. Analyze this candidate's resume vs the jobs they are applying to.

CANDIDATE PROFILE:
Name: ${profile.full_name}
Title: ${profile.title}
Skills: ${profile.skills.join(', ')}
Experience: ${profile.experience_years} years
Education: ${profile.education?.degree} in ${profile.education?.field} at ${profile.education?.institution}
Summary: ${(profile.summary ?? '').slice(0, 300)}

TOP JOBS THEY'RE APPLYING TO:
${jobReqs}

Return ONLY a JSON object with this structure:
{
  "missing_keywords": ["keyword1", "keyword2"],
  "rewrites": [
    {"section": "summary", "original": "...", "improved": "..."},
    {"section": "skills", "original": "...", "improved": "..."}
  ],
  "ats_score": 65,
  "ats_tips": ["tip1", "tip2"]
}

Focus on Moroccan job market specifics. Be concrete.`, 1200)
  return robustParse(text)
}

// ── Interview prep ────────────────────────────────────────────────────────────

export async function generateInterviewPrep(profile, job, companyInfo) {
  const text = await groq(`Generate interview preparation for this candidate applying to this role in Morocco.

CANDIDATE:
Name: ${profile.full_name}
Skills: ${profile.skills.join(', ')}
Education: ${profile.education?.degree} in ${profile.education?.field}
Experience: ${(profile.experience ?? []).slice(0, 2).map(e => `${e.title} at ${e.company}`).join(', ')}

JOB:
Title: ${job.title}
Company: ${job.company}
Description: ${(job.description ?? '').slice(0, 500)}
${companyInfo ? `Company info: ${companyInfo.slice(0, 200)}` : ''}

Return ONLY a JSON object:
{
  "technical_questions": [
    {"question": "...", "hint": "..."}
  ],
  "behavioral_questions": [
    {"question": "...", "hint": "..."}
  ],
  "company_questions": [
    {"question": "...", "hint": "..."}
  ],
  "tips": ["tip1", "tip2", "tip3"]
}

5 technical questions, 3 behavioral, 2 company-specific. Hints should be brief guidance, not full answers.`, 1500)
  return robustParse(text)
}

// ── Cold outreach email ───────────────────────────────────────────────────────

export async function generateOutreachEmail(profile, contact, company) {
  return groq(`Write a short, professional cold outreach email in French (or English if company is international).
3 paragraphs max. No fluff. No "I hope this email finds you well."

SENDER:
Name: ${profile.full_name}
Title/Field: ${profile.title || profile.education?.field}
Skills: ${profile.skills.slice(0, 5).join(', ')}
Education: ${profile.education?.degree} at ${profile.education?.institution}

RECIPIENT:
Name: ${contact.name}
Role: ${contact.role}
Company: ${company.name}
City: ${company.city}

Write only the email body. Start directly with the opening line.`, 400, 0.4)
}

// ── Email alert digest ────────────────────────────────────────────────────────

export async function generateAlertDigestHTML(profile, matches) {
  const jobRows = matches.map(m => `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
        <div style="font-weight:600;color:#f0eee8;font-size:14px;">${m.job?.title ?? 'Internship'}</div>
        <div style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:2px;">${m.job?.company ?? ''} · ${m.job?.location ?? ''}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
          <span style="background:rgba(52,211,153,0.15);color:#34d399;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;">${m.match_score}% match</span>
          <span style="background:rgba(108,99,255,0.1);color:#a78bfa;padding:2px 8px;border-radius:6px;font-size:11px;">${m.job?.source ?? ''}</span>
        </div>
        <div style="margin-top:8px;">
          <a href="${m.job?.apply_url ?? '#'}" style="background:linear-gradient(135deg,#6c63ff,#a78bfa);color:white;text-decoration:none;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;">Apply now →</a>
        </div>
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:'Segoe UI',sans-serif;background:#07070f;color:#f0eee8;margin:0;padding:40px 20px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#6c63ff,#a78bfa);border-radius:16px;padding:28px;text-align:center;margin-bottom:24px;">
      <div style="font-size:28px;margin-bottom:6px;">⚡</div>
      <h1 style="color:white;font-size:22px;margin:0 0 6px;">New matches for you, ${profile.full_name.split(' ')[0]}!</h1>
      <p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px;">${matches.length} new high-scoring internships found</p>
    </div>
    <div style="background:#111120;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;">
        ${jobRows}
      </table>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${process.env.VITE_SUPABASE_URL ? 'https://interniq.vercel.app/jobs' : 'https://interniq.vercel.app/jobs'}" style="display:inline-block;background:rgba(255,255,255,0.06);color:#f0eee8;text-decoration:none;padding:12px 28px;border-radius:12px;font-size:14px;border:1px solid rgba(255,255,255,0.1);">View all matches →</a>
    </div>
    <p style="color:rgba(255,255,255,0.2);font-size:11px;text-align:center;">
      Built with ❤️ by <a href="https://www.linkedin.com/in/aymane-fakihi-9a3435335/" style="color:#a78bfa;">Aymane Fakihi</a> · 🇲🇦 Made in Morocco<br/>
      <a href="${process.env.VITE_SUPABASE_URL ? 'https://interniq.vercel.app/dashboard' : '#'}" style="color:rgba(255,255,255,0.2);">Manage alert preferences</a>
    </p>
  </div>
</body>
</html>`
}
