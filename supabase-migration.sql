-- ════════════════════════════════════════════════════════════════════════════
-- InternIQ — Supabase migration
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Scraper health table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scraper_health (
  id         BIGSERIAL PRIMARY KEY,
  source     TEXT NOT NULL,
  date       DATE NOT NULL,
  runs       INT  NOT NULL DEFAULT 0,
  successes  INT  NOT NULL DEFAULT 0,
  total_jobs INT  NOT NULL DEFAULT 0,
  last_run   TIMESTAMPTZ,
  UNIQUE (source, date)
);

-- ── 2. Job search cache table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_cache (
  cache_key TEXT PRIMARY KEY,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-clean cache entries older than 7 days (optional, run as cron or manually)
-- DELETE FROM search_cache WHERE cached_at < NOW() - INTERVAL '7 days';

-- ── 3. Alert preferences table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alert_prefs (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  frequency    TEXT    NOT NULL DEFAULT 'daily',  -- 'daily' | 'weekly' | 'off'
  min_score    INT     NOT NULL DEFAULT 70,
  enabled      BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. Contacts DB table (migrate from contacts_db.json) ─────────────────────
-- After creating this table, run the Node.js migration script below.
CREATE TABLE IF NOT EXISTS contacts_db (
  id           BIGSERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  city         TEXT,
  address      TEXT,
  contact_name TEXT,
  role         TEXT,
  email        TEXT,
  phone        TEXT,
  is_hr        BOOLEAN DEFAULT false
);

-- Full-text search index on contacts_db
CREATE INDEX IF NOT EXISTS idx_contacts_fts ON contacts_db
  USING gin(to_tsvector('french', coalesce(company_name,'') || ' ' || coalesce(contact_name,'') || ' ' || coalesce(role,'') || ' ' || coalesce(email,'')));

-- Regular indexes for filtered queries
CREATE INDEX IF NOT EXISTS idx_contacts_city ON contacts_db(city);
CREATE INDEX IF NOT EXISTS idx_contacts_is_hr ON contacts_db(is_hr) WHERE is_hr = true;
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts_db(email) WHERE email IS NOT NULL AND email != '';

-- ── 5. Add profile email column if missing ────────────────────────────────────
-- (candidate_profiles may not store the auth email — add it for alert digest)
ALTER TABLE candidate_profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- ── 6. Row Level Security ────────────────────────────────────────────────────

-- scraper_health: readable by all authenticated users, writable by service role only
ALTER TABLE scraper_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read scraper health"
  ON scraper_health FOR SELECT TO authenticated USING (true);

-- search_cache: each user sees only their own cache
ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their search cache"
  ON search_cache FOR ALL TO authenticated USING (auth.uid() = user_id);

-- alert_prefs: each user sees/edits only their own prefs
ALTER TABLE alert_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their alert prefs"
  ON alert_prefs FOR ALL TO authenticated USING (auth.uid() = user_id);

-- contacts_db: readable by all authenticated users (public data)
ALTER TABLE contacts_db ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read contacts"
  ON contacts_db FOR SELECT TO authenticated USING (true);


-- ════════════════════════════════════════════════════════════════════════════
-- Node.js script to migrate contacts_db.json → Supabase table
-- Save as migrate-contacts.js and run: node migrate-contacts.js
-- ════════════════════════════════════════════════════════════════════════════
/*

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const companies = JSON.parse(fs.readFileSync('./public/contacts_db.json', 'utf8'))

const rows = []
for (const company of companies) {
  for (const contact of (company.contacts ?? [])) {
    rows.push({
      company_name: company.name,
      city:         company.city  ?? null,
      address:      company.address ?? null,
      contact_name: contact.name  ?? null,
      role:         contact.role  ?? null,
      email:        contact.email ?? null,
      phone:        contact.phone ?? null,
      is_hr:        contact.is_hr ?? false,
    })
  }
}

// Insert in batches of 500
for (let i = 0; i < rows.length; i += 500) {
  const batch = rows.slice(i, i + 500)
  const { error } = await sb.from('contacts_db').insert(batch)
  if (error) { console.error('Batch error:', error.message); break }
  console.log(`Inserted rows ${i}–${i + batch.length}`)
}
console.log('Done! Total rows:', rows.length)

*/
