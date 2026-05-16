import { createClient } from '@supabase/supabase-js'

export function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function upsertProfile(userId, data) {
  const sb = getSupabase()
  const { data: profile, error } = await sb
    .from('candidate_profiles')
    .upsert({ ...data, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select().single()
  if (error) throw new Error(error.message)
  return profile
}

export async function getProfile(userId) {
  const sb = getSupabase()
  const { data, error } = await sb.from('candidate_profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

// ── Jobs & Matches ────────────────────────────────────────────────────────────

export async function upsertJobListings(jobs) {
  if (!jobs.length) return []
  const sb = getSupabase()
  const { data, error } = await sb.from('job_listings').upsert(jobs, { onConflict: 'apply_url', ignoreDuplicates: false }).select()
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getJobById(jobId) {
  const sb = getSupabase()
  const { data, error } = await sb.from('job_listings').select('*').eq('id', jobId).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertJobMatches(matches) {
  if (!matches.length) return
  const sb = getSupabase()
  const { error } = await sb.from('job_matches').upsert(matches, { onConflict: 'user_id,job_id' })
  if (error) throw new Error(error.message)
}

export async function getJobMatches(userId) {
  const sb = getSupabase()
  const { data, error } = await sb.from('job_matches')
    .select('*, job:job_listings(*)')
    .eq('user_id', userId)
    .order('match_score', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

// ── Job search cache ──────────────────────────────────────────────────────────
// Cache key: user_id + primary role + date (YYYY-MM-DD)
// Returns null when cache is missing or stale (> 6 hours)

export async function getCachedSearch(userId, role) {
  const sb = getSupabase()
  const cacheKey = `${userId}:${role}:${new Date().toISOString().slice(0, 10)}`
  const { data } = await sb
    .from('search_cache')
    .select('cached_at')
    .eq('cache_key', cacheKey)
    .maybeSingle()
  if (!data) return null
  const ageHours = (Date.now() - new Date(data.cached_at).getTime()) / 3600000
  return ageHours < 6 ? data : null
}

export async function setCachedSearch(userId, role) {
  const sb = getSupabase()
  const cacheKey = `${userId}:${role}:${new Date().toISOString().slice(0, 10)}`
  await sb.from('search_cache').upsert(
    { cache_key: cacheKey, user_id: userId, role, cached_at: new Date().toISOString() },
    { onConflict: 'cache_key' }
  )
}

// ── Scraper health ────────────────────────────────────────────────────────────
// Logs success/failure count per source per day for the admin health dashboard

export async function logScraperHealth(source, jobCount, success) {
  try {
    const sb = getSupabase()
    const today = new Date().toISOString().slice(0, 10)
    const { data: existing } = await sb
      .from('scraper_health')
      .select('id, runs, successes, total_jobs')
      .eq('source', source)
      .eq('date', today)
      .maybeSingle()

    if (existing) {
      await sb.from('scraper_health').update({
        runs: existing.runs + 1,
        successes: existing.successes + (success ? 1 : 0),
        total_jobs: existing.total_jobs + jobCount,
        last_run: new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      await sb.from('scraper_health').insert({
        source,
        date: today,
        runs: 1,
        successes: success ? 1 : 0,
        total_jobs: jobCount,
        last_run: new Date().toISOString(),
      })
    }
  } catch (e) {
    // Never let health logging crash the scraper
    console.error('Health log error:', e.message)
  }
}

export async function getScraperHealth() {
  const sb = getSupabase()
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await sb
    .from('scraper_health')
    .select('*')
    .gte('date', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
    .order('date', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

// ── Applications ──────────────────────────────────────────────────────────────

export async function createApplication(app) {
  const sb = getSupabase()
  const now = new Date().toISOString()
  const { data, error } = await sb.from('applications')
    .insert({ ...app, created_at: now, updated_at: now })
    .select('*, job:job_listings(*)').single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateApplication(id, userId, updates) {
  const sb = getSupabase()
  const { data, error } = await sb.from('applications')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id).eq('user_id', userId)
    .select('*, job:job_listings(*)').single()
  if (error) throw new Error(error.message)
  return data
}

export async function getApplications(userId) {
  const sb = getSupabase()
  const { data, error } = await sb.from('applications')
    .select('*, job:job_listings(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function deleteApplication(id, userId) {
  const sb = getSupabase()
  const { error } = await sb.from('applications').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function getApplicationByJob(userId, jobId) {
  const sb = getSupabase()
  const { data, error } = await sb.from('applications').select('*').eq('user_id', userId).eq('job_id', jobId).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

// ── Dashboard stats ───────────────────────────────────────────────────────────

export async function getDashboardStats(userId) {
  const sb = getSupabase()
  const [appsRes, matchRes, countRes] = await Promise.all([
    sb.from('applications').select('status, created_at').eq('user_id', userId),
    sb.from('job_matches').select('match_score').eq('user_id', userId).order('match_score', { ascending: false }).limit(1),
    sb.from('job_matches').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])
  const apps = appsRes.data ?? []

  // Weekly trend: apps in last 7 days grouped by day
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const recentApps = apps.filter(a => a.created_at > weekAgo)
  const byDay = {}
  recentApps.forEach(a => {
    const day = a.created_at.slice(0, 10)
    byDay[day] = (byDay[day] || 0) + 1
  })
  const weeklyTrend = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  return {
    total_applications: apps.length,
    submitted: apps.filter(a => a.status === 'submitted').length,
    interviews: apps.filter(a => a.status === 'interview').length,
    offers: apps.filter(a => a.status === 'offer').length,
    top_match_score: matchRes.data?.[0]?.match_score ?? 0,
    jobs_found: countRes.count ?? 0,
    weekly_trend: weeklyTrend,
    response_rate: apps.length > 0
      ? Math.round((apps.filter(a => ['reviewing', 'interview', 'offer'].includes(a.status)).length / apps.length) * 100)
      : 0,
  }
}

// ── Alert preferences ─────────────────────────────────────────────────────────

export async function getAlertPrefs(userId) {
  const sb = getSupabase()
  const { data } = await sb.from('alert_prefs').select('*').eq('user_id', userId).maybeSingle()
  return data ?? { frequency: 'daily', min_score: 70, enabled: true }
}

export async function upsertAlertPrefs(userId, prefs) {
  const sb = getSupabase()
  const { error } = await sb.from('alert_prefs').upsert(
    { user_id: userId, ...prefs, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
  if (error) throw new Error(error.message)
}

// ── New high-scoring matches for alert digest ─────────────────────────────────
// Returns jobs scored >= minScore added since lastSentAt for a given user

export async function getNewHighMatches(userId, minScore, lastSentAt) {
  const sb = getSupabase()
  const since = lastSentAt ?? new Date(Date.now() - 24 * 3600000).toISOString()
  const { data, error } = await sb.from('job_matches')
    .select('*, job:job_listings(*)')
    .eq('user_id', userId)
    .gte('match_score', minScore)
    .gte('created_at', since)
    .order('match_score', { ascending: false })
    .limit(5)
  if (error) throw new Error(error.message)
  return data ?? []
}

// ── Contacts (server-side, paginated) ────────────────────────────────────────
// Requires contacts_db data to be migrated to a Supabase table (see migration script)

export async function searchContacts({ query, city, emailOnly, hrOnly, page = 0, pageSize = 50 }) {
  const sb = getSupabase()
  let q = sb.from('contacts_db').select('*', { count: 'exact' })

  if (query) q = q.or(`company_name.ilike.%${query}%,contact_name.ilike.%${query}%,role.ilike.%${query}%,email.ilike.%${query}%`)
  if (city) q = q.eq('city', city)
  if (emailOnly) q = q.neq('email', '')
  if (hrOnly) q = q.eq('is_hr', true)

  q = q.range(page * pageSize, (page + 1) * pageSize - 1)
    .order('company_name')

  const { data, error, count } = await q
  if (error) throw new Error(error.message)
  return { contacts: data ?? [], total: count ?? 0 }
}

// ── Storage / token ───────────────────────────────────────────────────────────

export async function uploadResume(userId, filename, buffer, mimeType) {
  const sb = getSupabase()
  const path = `${userId}/${Date.now()}-${filename}`
  const { error } = await sb.storage.from('resumes').upload(path, buffer, { contentType: mimeType, upsert: true })
  if (error) throw new Error(error.message)
  const { data } = sb.storage.from('resumes').getPublicUrl(path)
  return data.publicUrl
}

export async function verifyToken(req) {
  const auth = req.headers['authorization'] ?? ''
  if (!auth.startsWith('Bearer ')) throw new Error('Missing token')
  const token = auth.slice(7)
  const sb = getSupabase()
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) throw new Error('Invalid token')
  return user
}
