import { useEffect, useState } from 'react'
import { Search, Loader2, Zap, MapPin, ExternalLink, CheckCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { getJobs, searchJobs, generateCoverLetter, applyToJob, getApplications } from '../lib/api'
import type { JobMatch, Application } from '../types'
import CoverLetterModal from '../components/CoverLetterModal'
import toast from 'react-hot-toast'

const FILTERS = [
  { key: 'all',        label: 'All jobs'  },
  { key: 'top',        label: '🔥 90+'    },
  { key: 'good',       label: '✓ 70+'     },
  { key: 'remote',     label: '🌍 Remote' },
  { key: 'remoteok',   label: 'RemoteOK'  },
  { key: 'arbeitnow',  label: 'Arbeitnow' },
  { key: 'indeed',     label: 'Indeed'    },
  { key: 'wellfound',  label: 'Wellfound' },
]

const SOURCE_COLORS: Record<string, string> = {
  indeed:     'bg-blue-400/10 text-blue-400 border-blue-400/20',
  wellfound:  'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  remoteok:   'bg-purple-400/10 text-purple-400 border-purple-400/20',
  arbeitnow:  'bg-amber-400/10 text-amber-400 border-amber-400/20',
  internshala:'bg-rose-400/10 text-rose-400 border-rose-400/20',
}

function ScoreRing({ score }: { score: number }) {
  const r = 18, circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171'
  const textColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`} strokeLinecap="round" />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold font-display ${textColor}`}>
        {score}
      </div>
    </div>
  )
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobMatch[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [clModal, setClModal] = useState<{ job: JobMatch; letter: string } | null>(null)
  const [generatingCL, setGeneratingCL] = useState<string | null>(null)
  const [applying, setApplying] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [jobsRes, appsRes] = await Promise.allSettled([getJobs(), getApplications()])
        if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.jobs)
        if (appsRes.status === 'fulfilled') setApplications(appsRes.value.applications)
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  async function handleSearch() {
    setSearching(true)
    try {
      const res = await searchJobs()
      setJobs(res.jobs)
      toast.success(`Found ${res.total} internships!`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  async function handleGenerateCL(job: JobMatch) {
    setGeneratingCL(job.id)
    try {
      const res = await generateCoverLetter(job.job_id)
      setClModal({ job, letter: res.cover_letter })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate cover letter')
    } finally {
      setGeneratingCL(null)
    }
  }

  async function handleApply(job: JobMatch, coverLetter?: string) {
    setApplying(job.id)
    setClModal(null)
    try {
      const res = await applyToJob(job.job_id, coverLetter)
      setApplications(prev => [...prev, res.application])
      toast.success(`Applying to ${job.job.title} at ${job.job.company}…`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Apply failed')
    } finally {
      setApplying(null)
    }
  }

  const appliedJobIds = new Set(applications.map(a => a.job_id))

  const filtered = jobs.filter(j => {
    if (filter === 'top') return j.match_score >= 90
    if (filter === 'good') return j.match_score >= 70
    if (filter === 'remote') return j.job.location.toLowerCase().includes('remote')
    if (['remoteok','arbeitnow','indeed','wellfound','internshala'].includes(filter))
      return j.job.source === filter
    return true
  })

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 size={28} className="animate-spin text-accent" />
    </div>
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-3xl mb-1">Internship matches</h1>
          <p className="text-white/40 text-sm">{filtered.length} positions · sorted by match score</p>
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="btn btn-primary"
        >
          {searching ? (
            <><Loader2 size={15} className="animate-spin" /> Searching…</>
          ) : (
            <>{jobs.length > 0 ? <><RefreshCw size={15}/> Refresh</> : <><Search size={15}/> Find internships</>}</>
          )}
        </button>
      </div>

      {/* Searching state */}
      {searching && (
        <div className="card text-center py-16 mb-8">
          <div className="flex justify-center gap-2 mb-6">
            {[0,1,2].map(i => (
              <div key={i} className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse-dot"
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <h3 className="font-display font-semibold text-xl mb-2">Searching and scoring internships…</h3>
          <p className="text-white/40 text-sm">This takes 30–60 seconds. Claude is scoring each match.</p>
        </div>
      )}

      {/* Filters */}
      {jobs.length > 0 && !searching && (
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border
                ${filter === f.key
                  ? 'bg-accent/15 border-accent/30 text-accent2'
                  : 'bg-surface border-white/[0.07] text-white/40 hover:text-white hover:border-white/20'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Job list */}
      {!searching && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(match => {
            const isApplied = appliedJobIds.has(match.job_id)
            const isExpanded = expanded === match.id
            const isApplying = applying === match.id
            const isGenerating = generatingCL === match.id

            return (
              <div
                key={match.id}
                className={`card transition-all duration-200
                  ${isApplied ? 'border-emerald-400/20 bg-emerald-400/[0.02]' : 'hover:border-white/15'}`}
              >
                <div className="flex items-start gap-4">
                  {/* Score ring */}
                  <ScoreRing score={match.match_score} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <h3 className="font-semibold text-base leading-tight">{match.job.title}</h3>
                        <div className="text-accent2 text-sm mt-0.5">{match.job.company}</div>
                      </div>
                      {isApplied && (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium shrink-0">
                          <CheckCircle size={13} /> Applied
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-white/30 text-xs mb-3 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin size={11} />{match.job.location}</span>
                      <span className={`tag text-xs border ${SOURCE_COLORS[match.job.source] ?? 'bg-surface2 text-white/40 border-white/10'}`}>
                        {match.job.source}
                      </span>
                    </div>

                    {/* Match reasons */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {match.match_reasons.slice(0, 2).map((r, i) => (
                        <span key={i} className="tag-green text-xs">{r.slice(0, 45)}{r.length > 45 ? '…' : ''}</span>
                      ))}
                    </div>

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-3 animate-fade-up">
                        {match.job.description && (
                          <p className="text-white/50 text-sm leading-relaxed">
                            {match.job.description.slice(0, 500)}{match.job.description.length > 500 ? '…' : ''}
                          </p>
                        )}
                        {match.mismatch_reasons.length > 0 && (
                          <div>
                            <div className="text-xs text-white/30 mb-1.5">Gaps to address:</div>
                            <div className="flex flex-wrap gap-1.5">
                              {match.mismatch_reasons.map((r, i) => (
                                <span key={i} className="tag-red text-xs">{r}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <a
                          href={match.job.apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors"
                        >
                          <ExternalLink size={11} /> View original listing
                        </a>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {!isApplied && (
                        <button
                          onClick={() => handleGenerateCL(match)}
                          disabled={isGenerating || isApplying}
                          className="btn btn-primary btn-sm"
                        >
                          {isGenerating ? <><Loader2 size={12} className="animate-spin" /> Generating…</> : <><Zap size={12} /> Auto-apply</>}
                        </button>
                      )}
                      {isApplying && (
                        <span className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                          <Loader2 size={12} className="animate-spin" /> Submitting…
                        </span>
                      )}
                      <button
                        onClick={() => setExpanded(isExpanded ? null : match.id)}
                        className="btn btn-ghost btn-sm"
                      >
                        {isExpanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> Details</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!searching && filtered.length === 0 && jobs.length === 0 && (
        <div className="text-center py-24">
          <Search size={40} className="mx-auto mb-4 text-white/10" />
          <h3 className="font-display font-semibold text-xl mb-2">No jobs yet</h3>
          <p className="text-white/30 text-sm mb-6">Make sure you've uploaded your resume, then click Find internships</p>
          <button onClick={handleSearch} className="btn btn-primary">
            <Search size={15} /> Find internships
          </button>
        </div>
      )}

      {!searching && filtered.length === 0 && jobs.length > 0 && (
        <div className="text-center py-16 text-white/30">
          <p>No jobs match this filter. Try a different one.</p>
        </div>
      )}

      {/* Cover Letter Modal */}
      {clModal && (
        <CoverLetterModal
          job={clModal.job}
          letter={clModal.letter}
          onClose={() => setClModal(null)}
          onApply={(letter) => handleApply(clModal.job, letter)}
        />
      )}
    </div>
  )
}
