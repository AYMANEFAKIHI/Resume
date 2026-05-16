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

function cleanText(text: string): string {
  return text
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u024F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Resume ────────────────────────────────────────────────────────────────────

export async function uploadResume(file: File) {
  const headers = await authHeaders()

  const isPDF  = file.type === 'application/pdf' || file.name.endsWith('.pdf')
  const isDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')
  const isTXT  = file.type === 'text/plain' || file.name.endsWith('.txt')

  if (isPDF) {
    const pdf_base64 = await fileToBase64(file)
    return request<any>('/resume/upload', {
      method: 'POST',
      headers,
      body: JSON.stringify({ pdf_base64, filename: file.name }),
    })
  }

  if (isDOCX) {
    // ✅ FIX: send DOCX as base64 for server-side mammoth extraction
    const docx_base64 = await fileToBase64(file)
    return request<any>('/resume/upload', {
      method: 'POST',
      headers,
      body: JSON.stringify({ docx_base64, filename: file.name }),
    })
  }

  if (isTXT) {
    const text = await file.text()
    return request<any>('/resume/upload', {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: cleanText(text) }),
    })
  }

  // Fallback: try reading as text
  const text = await file.text()
  return request<any>('/resume/upload', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: cleanText(text) }),
  })
}

export async function uploadResumeText(text: string) {
  const headers = await authHeaders()
  return request<any>('/resume/upload', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: cleanText(text) }),
  })
}

export async function getProfile() {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/resume/profile`, { headers })
  if (res.status === 404) return { profile: null }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`)
  return data
}

export async function updateProfile(data: any) {
  const headers = await authHeaders()
  return request<any>('/resume/profile', { method: 'PUT', headers, body: JSON.stringify(data) })
}

export async function getResumeTips() {
  const headers = await authHeaders()
  return request<any>('/resume/tips', { headers })
}

export async function getResumeImprovement() {
  const headers = await authHeaders()
  return request<any>('/resume/tips', { method: 'POST', headers, body: JSON.stringify({}) })
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

export async function searchJobs(params?: { roles?: string[]; locations?: string[]; force?: boolean }) {
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
  return request<any>('/cover-letter/generate', {
    method: 'POST', headers, body: JSON.stringify({ job_id: jobId }),
  })
}

// ── Apply ─────────────────────────────────────────────────────────────────────

export async function applyToJob(jobId: string, coverLetter?: string) {
  const headers = await authHeaders()
  const data = await request<any>('/apply', {
    method: 'POST', headers,
    body: JSON.stringify({ job_id: jobId, cover_letter: coverLetter }),
  })
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
  return request<any>(`/applications?id=${id}`, {
    method: 'PATCH', headers, body: JSON.stringify(updates),
  })
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

// ── Interview Prep ────────────────────────────────────────────────────────────

export async function getInterviewPrep(jobId: string) {
  const headers = await authHeaders()
  return request<any>('/interview-prep', {
    method: 'POST', headers, body: JSON.stringify({ job_id: jobId }),
  })
}

// ── Cold Outreach ─────────────────────────────────────────────────────────────

export async function generateOutreachEmail(contact: any, company: any) {
  const headers = await authHeaders()
  return request<any>('/outreach', {
    method: 'POST', headers, body: JSON.stringify({ contact, company }),
  })
}

// ── Alert Preferences ─────────────────────────────────────────────────────────

export async function getAlertPrefs() {
  const headers = await authHeaders()
  return request<any>('/alerts', { headers })
}

export async function updateAlertPrefs(prefs: { frequency: string; min_score: number; enabled: boolean }) {
  const headers = await authHeaders()
  return request<any>('/alerts', { method: 'PUT', headers, body: JSON.stringify(prefs) })
}

// ── Scraper Health ────────────────────────────────────────────────────────────

export async function getScraperHealth() {
  const headers = await authHeaders()
  return request<any>('/health', { headers })
}
