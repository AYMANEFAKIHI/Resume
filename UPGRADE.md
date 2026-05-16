# InternIQ — Upgrade Guide

Complete upgrade covering all four areas: critical fixes, growth features, tech improvements, and sustainability foundations.

---

## What's changed

### 🔥 Critical fixes

#### 1. DOCX resume upload (was broken)
**File:** `api/resume/upload.js` + `api/_claude.js` + `src/lib/api.ts`

The original code sent `.docx` files as raw binary text to the AI — producing garbage output. Now:
- Frontend detects DOCX by MIME type **and** extension (both checked)
- DOCX sent as base64 to the API
- Server calls `mammoth.extractRawText()` to get clean text before analysis

**What to test:** Upload a `.docx` CV and verify the profile is extracted correctly.

#### 2. Scraper health monitoring
**Files:** `api/_db.js` (new: `logScraperHealth`, `getScraperHealth`), `api/_scrapers.js`, `api/health/index.js`

Every scraper now logs success/failure to a `scraper_health` Supabase table. The Dashboard shows a live health grid. When a source drops to <30% success rate it's flagged as "down".

#### 3. Job search caching
**Files:** `api/_db.js` (new: `getCachedSearch`, `setCachedSearch`), `api/jobs/index.js`

Results are cached per user+role+date for 6 hours. Repeat searches return instantly. Users can force-refresh with `force: true`. A "last refreshed" indicator is shown in the jobs UI.

#### 4. AI provider upgrade for resume analysis
**File:** `api/_claude.js`

Resume analysis now uses **Anthropic claude-haiku** (already installed, was unused) for better structured JSON output. Groq is kept for faster tasks (cover letter, scoring, tips). Both have 3-attempt exponential backoff retry.

---

### 📈 Growth features

#### 5. Email job alerts with daily digest
**Files:** `api/alerts/index.js`, `api/alerts/send.js`, `vercel.json`

- Users set frequency (daily/weekly) and minimum match score threshold
- Vercel Cron runs at 7:00 AM UTC daily: `0 7 * * *`
- Sends HTML email digest of new high-scoring matches via Resend
- Tracks `last_sent_at` per user to prevent duplicate sends

**Required:** Set `CRON_SECRET` env var in Vercel. The cron endpoint checks `Authorization: Bearer <CRON_SECRET>`.

#### 6. AI resume improvement analysis
**Files:** `api/resume/tips.js` (POST method added), `api/_claude.js` (new: `getResumeImprovement`), `src/pages/ResumePage.tsx`

POST `/api/resume/tips` runs a deep analysis comparing the user's profile against their top 5 job matches:
- ATS score (0–100)
- Missing keywords for target roles
- Side-by-side rewrite suggestions per section

#### 7. Interview prep modal
**Files:** `api/interview-prep/index.js`, `api/_claude.js` (new: `generateInterviewPrep`), `src/components/InterviewPrepModal.tsx`, `src/pages/TrackerPage.tsx`

When a user moves an application to **Interview** status, a prep modal is automatically suggested. Generates:
- 5 technical questions with hints
- 3 behavioral questions
- 2 company-specific questions

#### 8. Cold outreach email generator
**Files:** `api/outreach/index.js`, `api/_claude.js` (new: `generateOutreachEmail`), `src/pages/ContactsPage.tsx`

Every contact in the Contacts Database now has a **"Outreach email"** button. Generates a personalized 3-paragraph cold email in French (or English for international companies). Includes a mailto link to open directly in email client.

---

### ⚙️ Tech upgrades

#### 9. Contacts DB pagination
**File:** `src/pages/ContactsPage.tsx`

The 548KB `contacts_db.json` is still loaded from `/public` but now:
- Paginated in memory (60 companies per page)
- Debounced search (350ms) to reduce re-renders
- "Load more" button instead of rendering all 922 companies at once

**Recommended next step:** Run `supabase-migration.sql` and migrate the JSON to a Supabase table. Then switch `ContactsPage` to call `/api/contacts?search=...&page=...` for true server-side search and a ~40% smaller JS bundle.

#### 10. Dashboard analytics
**File:** `src/pages/DashboardPage.tsx`

Added:
- Application funnel visualization (Applied → Reviewed → Interview → Offer)
- Weekly trend bar chart
- Response rate percentage
- Scraper health grid
- Alert preference controls (all in-page, no modal needed)

---

### 💡 Sustainability

#### 11. Alert preferences in dashboard
Users can configure email alerts without leaving the app. This is your primary re-engagement mechanic — users come back when they see a digest rather than having to manually log in.

---

## Deployment steps

### 1. Run the Supabase migration

Open **Supabase Dashboard → SQL Editor** and run `supabase-migration.sql`. This creates:
- `scraper_health` — scraper monitoring
- `search_cache` — job search cache
- `alert_prefs` — user alert preferences
- `contacts_db` — for future server-side contacts (optional now)

### 2. Add environment variables in Vercel

```bash
# Already have these:
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GROQ_API_KEY=...
RESEND_API_KEY=...

# New — add these:
ANTHROPIC_API_KEY=sk-ant-...    # For resume analysis (haiku is cheap)
CRON_SECRET=your-random-secret  # Protects the /api/alerts/send cron endpoint
```

Get your Anthropic API key at: https://console.anthropic.com

### 3. Deploy

```bash
git add -A
git commit -m "feat: DOCX fix, health monitoring, caching, alerts, interview prep, outreach"
git push
```

Vercel will auto-deploy. The cron job (`0 7 * * *`) activates automatically on Vercel Pro. On the free tier, trigger it manually or use Supabase `pg_cron` instead.

### 4. Verify the fixes

After deploy:
1. Upload a `.docx` CV → profile should extract correctly
2. Run a job search → check Supabase `scraper_health` table has new rows
3. Run a second search → should return instantly (from cache)
4. Move an application to "Interview" → interview prep modal should appear
5. Open a contact and click "Outreach email" → personalized email should generate

---

## Optional: Migrate contacts_db.json to Supabase

Once the `contacts_db` table is created, run this migration script:

```bash
node migrate-contacts.js
```

(The script is commented at the bottom of `supabase-migration.sql`.)

After migration, update `ContactsPage.tsx` to use the API instead of the JSON file — this removes 548KB from your client bundle and adds real server-side search.

---

## File summary

| File | Change |
|------|--------|
| `api/_db.js` | Added: health logging, search cache, alert prefs, contacts search |
| `api/_claude.js` | Added: Anthropic integration, retry logic, DOCX extraction, improvement analysis, interview prep, outreach |
| `api/_scrapers.js` | Added: health logging wrapper on all 13 scrapers |
| `api/resume/upload.js` | Fixed: DOCX support via mammoth |
| `api/resume/tips.js` | Added: POST endpoint for deep improvement analysis |
| `api/jobs/index.js` | Added: 6-hour cache with force-refresh option |
| `api/alerts/index.js` | New: GET/PUT alert preferences |
| `api/alerts/send.js` | New: cron handler for daily email digest |
| `api/interview-prep/index.js` | New: interview question generator |
| `api/outreach/index.js` | New: cold outreach email generator |
| `api/health/index.js` | New: scraper health API |
| `api/stats/index.js` | Added: weekly trend + response rate |
| `src/lib/api.ts` | Added: DOCX upload, improvement, interview prep, outreach, alerts, health |
| `src/pages/DashboardPage.tsx` | Added: analytics, funnel, alert controls, health grid |
| `src/pages/ResumePage.tsx` | Added: DOCX UI, improvement analysis panel |
| `src/pages/ContactsPage.tsx` | Added: pagination, debounced search, outreach generator |
| `src/pages/TrackerPage.tsx` | Added: interview prep trigger on status change |
| `src/components/InterviewPrepModal.tsx` | New: interview prep modal |
| `vercel.json` | Added: daily cron job |
| `supabase-migration.sql` | New: all required table migrations |
