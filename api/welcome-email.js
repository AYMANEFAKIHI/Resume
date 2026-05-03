export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, name } = req.body ?? {}
  if (!email) return res.status(400).json({ error: 'Email required' })

  // Skip if no Resend key configured
  if (!process.env.RESEND_API_KEY) {
    return res.json({ success: true, skipped: true })
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'InternIQ <onboarding@resend.dev>',
        to: [email],
        subject: '🚀 Welcome to InternIQ — Let\'s find your internship!',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"/></head>
          <body style="font-family: 'Segoe UI', sans-serif; background: #07070f; color: #f0eee8; margin: 0; padding: 40px 20px;">
            <div style="max-width: 520px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #6c63ff, #a78bfa); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
                <div style="font-size: 32px; margin-bottom: 8px;">⚡</div>
                <h1 style="color: white; font-size: 28px; margin: 0 0 8px;">Welcome to InternIQ!</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 15px;">Your AI internship platform is ready</p>
              </div>

              <div style="background: #111120; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 28px; margin-bottom: 20px;">
                <h2 style="color: #f0eee8; font-size: 18px; margin: 0 0 16px;">Get started in 3 steps:</h2>
                <div style="margin-bottom: 14px; display: flex; align-items: flex-start; gap: 12px;">
                  <span style="background: #6c63ff; color: white; border-radius: 8px; padding: 4px 10px; font-size: 13px; font-weight: bold; shrink: 0;">1</span>
                  <div>
                    <strong style="color: #f0eee8;">Upload your CV</strong><br/>
                    <span style="color: rgba(255,255,255,0.4); font-size: 13px;">PDF or DOCX — AI extracts everything automatically</span>
                  </div>
                </div>
                <div style="margin-bottom: 14px; display: flex; align-items: flex-start; gap: 12px;">
                  <span style="background: #6c63ff; color: white; border-radius: 8px; padding: 4px 10px; font-size: 13px; font-weight: bold;">2</span>
                  <div>
                    <strong style="color: #f0eee8;">Find internships</strong><br/>
                    <span style="color: rgba(255,255,255,0.4); font-size: 13px;">Search Rekrute.ma, Emploi.ma, Glassdoor & more</span>
                  </div>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                  <span style="background: #6c63ff; color: white; border-radius: 8px; padding: 4px 10px; font-size: 13px; font-weight: bold;">3</span>
                  <div>
                    <strong style="color: #f0eee8;">Apply with AI cover letter</strong><br/>
                    <span style="color: rgba(255,255,255,0.4); font-size: 13px;">Tailored letter generated in seconds</span>
                  </div>
                </div>
              </div>

              <div style="text-align: center; margin-bottom: 28px;">
                <a href="https://resume-cyan-pi.vercel.app/resume"
                  style="display: inline-block; background: linear-gradient(135deg, #6c63ff, #a78bfa); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
                  Upload my CV now →
                </a>
              </div>

              <p style="color: rgba(255,255,255,0.2); font-size: 12px; text-align: center; margin: 0;">
                Built with ❤️ by <a href="https://www.linkedin.com/in/aymane-fakihi-9a3435335/" style="color: #a78bfa;">Aymane Fakihi</a>
                · 🇲🇦 Made in Morocco
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('Resend error:', err)
      return res.json({ success: false, error: err.message })
    }

    res.json({ success: true })
  } catch (e) {
    console.error('Welcome email error:', e.message)
    res.json({ success: false, error: e.message })
  }
}
