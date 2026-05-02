import { supabase } from './supabase'

const BASE = '/api'

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not authenticated')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`)
  return data as T
}

// ── Resume ────────────────────────────────────────────────────────────────────

export async function uploadResumeText(text: string) {
  const headers = await authHeaders()
  return request<any>('/resume/upload', { method: 'POST', headers, body: JSON.stringify({ text }) })
}

export async function uploadResume(file: File) {
  const text = await file.text()
  return uploadResumeText(text)
}

export async function getProfile() {
  const headers = await authHeaders()
  return request<any>('/resume/profile', { headers })
}

export async function updateProfile(data: any) {
  const headers = await authHeaders()
  return request<any>('/resume/profile', { method: 'PUT', headers, body: JSON.stringify(data) })
}

export async function getResumeTips() {
  const headers = await authHeaders()
  return request<any>('/resume/tips', { headers })
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

export async function searchJobs(params?: any) {
  const headers = await authHeaders()
  return request<any>('/jobs', { method: 'POST', headers, body: JSON.stringify(params ?? {}) })
}

export async function getJobs() {
  const headers = await authHeaders()
  return request<any>('/jobs', { headers })
}

// ── Cover Letter ──────────────────────────────────────────────────────────────

export async function generateCoverLetter(jobId: string) {
  const headers = await authHeaders()
  return request<any>('/cover-letter/generate', { method: 'POST', headers, body: JSON.stringify({ job_id: jobId }) })
}

// ── Apply ─────────────────────────────────────────────────────────────────────

export async function applyToJob(jobId: string, coverLetter?: string) {
  const headers = await authHeaders()
  const data = await request<any>('/apply', { method: 'POST', headers, body: JSON.stringify({ job_id: jobId, cover_letter: coverLetter }) })
  if (data.apply_url) window.open(data.apply_url, '_blank')
  return data
}

// ── Applications ──────────────────────────────────────────────────────────────

export async function getApplications() {
  const headers = await authHeaders()
  return request<any>('/applications', { headers })
}

export async function updateApplication(id: string, updates: any) {
  const headers = await authHeaders()
  return request<any>(`/applications?id=${id}`, { method: 'PATCH', headers, body: JSON.stringify(updates) })
}

export async function deleteApplication(id: string) {
  const headers = await authHeaders()
  await request<any>(`/applications?id=${id}`, { method: 'DELETE', headers })
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getStats() {
  const headers = await authHeaders()
  return request<any>('/stats', { headers })
}
