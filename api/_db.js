import { createClient } from '@supabase/supabase-js'

export function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

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

export async function getDashboardStats(userId) {
  const sb = getSupabase()
  const [appsRes, matchRes, countRes] = await Promise.all([
    sb.from('applications').select('status').eq('user_id', userId),
    sb.from('job_matches').select('match_score').eq('user_id', userId).order('match_score', { ascending: false }).limit(1),
    sb.from('job_matches').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])
  const apps = appsRes.data ?? []
  return {
    total_applications: apps.length,
    submitted: apps.filter(a => a.status === 'submitted').length,
    interviews: apps.filter(a => a.status === 'interview').length,
    offers: apps.filter(a => a.status === 'offer').length,
    top_match_score: matchRes.data?.[0]?.match_score ?? 0,
    jobs_found: countRes.count ?? 0,
  }
}

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
