export default async function handler(req, res) {
  const results = {}

  results.SUPABASE_URL = process.env.SUPABASE_URL ? 'SET' : 'MISSING'
  results.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'
  results.GROQ_API_KEY = process.env.GROQ_API_KEY ? 'SET' : 'MISSING'
  results.GROQ_KEY_PREFIX = process.env.GROQ_API_KEY?.slice(0, 8) ?? 'MISSING'

  // Test Groq
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say hi' }],
      }),
    })
    const data = await response.json()
    results.groq_status = response.status
    results.groq_ok = response.ok
    results.groq_error = data.error?.message ?? null
  } catch (e) {
    results.groq_exception = e.message
  }

  // Test Supabase
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/candidate_profiles?limit=1`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    })
    results.supabase_status = response.status
    results.supabase_ok = response.ok
    if (!response.ok) {
      const data = await response.json()
      results.supabase_error = data.message ?? JSON.stringify(data)
    }
  } catch (e) {
    results.supabase_exception = e.message
  }

  res.json(results)
}
