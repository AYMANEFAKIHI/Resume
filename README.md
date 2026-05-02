# InternIQ — Vercel Edition

One repo. One platform. Full stack on Vercel for free.

## Deploy in 3 steps

### 1. Supabase — run schema
Go to supabase.com → SQL Editor → paste and run the schema from the previous backend zip (`supabase-schema.sql`)

### 2. Push to GitHub
```bash
git init && git add . && git commit -m "init" && git push
```

### 3. Deploy to Vercel
1. vercel.com → New Project → import your repo
2. Add these environment variables:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | From Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API |
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `VITE_SUPABASE_URL` | Same as SUPABASE_URL |
| `VITE_SUPABASE_ANON_KEY` | From Supabase → Settings → API (anon key) |

3. Hit Deploy — done!

## Local dev
```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev                  # http://localhost:5173
```

## How apply works
Since Vercel serverless functions can't run a browser (Playwright),
clicking "Apply" will:
1. Save the application + cover letter to your tracker
2. Auto-open the job listing page in a new tab
3. Your cover letter is pre-copied — paste it in the form

Full browser auto-apply requires a VPS/server (not serverless).
