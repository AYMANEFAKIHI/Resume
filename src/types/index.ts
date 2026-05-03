export interface CandidateProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone?: string
  location?: string
  title?: string
  summary?: string
  skills: string[]
  experience_years: number
  education: {
    degree: string
    institution: string
    year: number
    field?: string
  }
  experience: {
    title: string
    company: string
    duration: string
    description: string
    technologies?: string[]
  }[]
  preferred_roles: string[]
  preferred_locations: string[]
  resume_url?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  raw_text?: string
  created_at: string
  updated_at: string
}

export interface JobListing {
  id: string
  title: string
  company: string
  location: string
  description: string
  requirements?: string
  apply_url: string
  source: 'indeed' | 'wellfound' | 'internshala' | 'remoteok' | 'arbeitnow'
  salary_range?: string
  tags?: string[]
  company_logo?: string
  scraped_at: string
  is_active: boolean
}

export interface JobMatch {
  id: string
  user_id: string
  job_id: string
  job: JobListing
  match_score: number
  match_reasons: string[]
  mismatch_reasons: string[]
  created_at: string
}

export interface Application {
  id: string
  user_id: string
  job_id: string
  job: JobListing
  cover_letter?: string
  status: ApplicationStatus
  submitted_at?: string
  error_message?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type ApplicationStatus =
  | 'pending'
  | 'submitting'
  | 'submitted'
  | 'failed'
  | 'reviewing'
  | 'interview'
  | 'rejected'
  | 'offer'

export interface DashboardStats {
  total_applications: number
  submitted: number
  interviews: number
  offers: number
  top_match_score: number
  jobs_found: number
}
