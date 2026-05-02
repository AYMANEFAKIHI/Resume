import { useEffect, useState } from 'react'
import { Search, Loader2, Zap, MapPin, ExternalLink, CheckCircle, ChevronDown, ChevronUp, RefreshCw, Globe, Flag } from 'lucide-react'
import { getJobs, searchJobs, generateCoverLetter, applyToJob, getApplications } from '../lib/api'
import type { JobMatch, Application } from '../types'
import CoverLetterModal from '../components/CoverLetterModal'
import toast from 'react-hot-toast'

const FILTERS = [
  { key: 'all',           label: 'All',           icon: '🌐' },
  { key: 'morocco',       label: 'Morocco 🇲🇦',    icon: '🇲🇦' },
  { key: 'rekrute',       label: 'Rekrute',        icon: '🔴' },
  { key: 'emploima',      label: 'Emploi.ma',      icon: '🟠' },
  { key: 'linkedin',      label: 'LinkedIn',       icon: '🔵' },
  { key: 'remote',        label: 'Remote 🌍',      icon: '🌍' },
  { key: 'top',           label: '🔥 Top 90+',     icon: '🔥' },
  { key: 'remoteok',      label: 'RemoteOK',       icon: '⚡' },
  { key: 'arbeitnow',     label: 'Arbeitnow',      icon: '🟢' },
]

const MOROCCAN_SOURCES = ['rekrute', 'emploima', 'marocannonces', 'linkedin']

const SOURCE_CONFIG: Record<string, { color: string; label: string }> = {
  rekrute:       { color: 'bg-red-500/10 text-red-400 border-red-400/20',       label: 'Rekrute.ma' },
  emploima:      { color: 'bg-orange-500/10 text-orange-400 border-orange-400/20', label: 'Emploi.ma' },
  marocannonces: { color: 'bg-amber-500/10 text-amber-400 border-amber-400/20', label: 'MarocAnnonces' },
  linkedin:      { color: 'bg-blue-500/10 text-blue-400 border-blue-400/20',    label: 'LinkedIn' },
  remoteok:      { color: 'bg-purple-500/10 text-purple-400 border-purple-400/20', label: 'RemoteOK' },
  arbeitnow:     { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20', label: 'Arbeitnow' },
  indeed:        { color: 'bg-blue-500/10 text-blue-300 border-blue-300/20',    label: 'Indeed' },
  wellfound:     { color: 'bg-teal-500/10 text-teal-400 border-teal-400/20',    label: 'Wellfound' },
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

function isMoroccan(source: string) {
  return MOROCCAN_SOURCES.includes(source)
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
      toast.success(`Applied to ${job.job.title}! Page opened in new tab.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Apply failed')
    } finally {
      setApplying(null)
    }
  }

  const appliedJobIds = new Set(applications.map(a => a.job_id))

  const filtered = jobs.filter(j => {
    if (filter === 'top') return j.match_score >= 90
    if (filter === 'remote') return j.job.location.toLowerCase().includes('remote')
    if (filter === 'morocco') return isMoroccan(j.job.source)
    if (FILTERS.find(f => f.key === filter && !['all','top','remote','morocco'].includes(f.key)))
      return j.job.source === filter
    return true
  })

  const moroccanCount = jobs.filter(j => isMoroccan(j.job.source)).length
  const remoteCount = jobs.filter(j => j.job.location.toLowerCase().includes('remote')).length

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 size={28} className="animate-spin text-accent" />
    </div>
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-3xl mb-1">Internship matches</h1>
          <div className="flex items-center gap-4 text-sm text-white/40 mt-1">
            <span>{filtered.length} positions</span>
            {moroccanCount > 0 && <span className="text-amber-400">🇲🇦 {moroccanCount} au Maroc</span>}
            {remoteCount > 0 && <span className="text-emerald-400">🌍 {remoteCount} Remote</span>}
          </div>
        </div>
        <button onClick={handleSearch} disabled={searching} className="btn btn-primary">
          {searching
            ? <><Loader2 size={15} className="animate-spin" /> Searching…</>
            : jobs.length > 0
              ? <><RefreshCw size={15} /> Refresh</>
              : <><Search size={15} /> Find internships</>
          }
        </button>
      </div>

      {/* Searching state */}
      {searching && (
        <div className="card text-center py-16 mb-6">
          <div className="flex justify-center gap-2 mb-6">
            {[0,1,2].map(i => (
              <div key={i} className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse-dot"
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <h3 className="font-display font-semibold text-xl mb-3">Searching across all platforms…</h3>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-white/30">
            {['Rekrute.ma 🇲🇦', 'Emploi.ma 🇲🇦', 'LinkedIn 🇲🇦', 'RemoteOK 🌍', 'Arbeitnow 🌍'].map(s => (
              <span key={s} className="px-3 py-1 rounded-full bg-surface2 border border-white/[0.07]">{s}</span>
            ))}
          </div>
          <p className="text-white/30 text-sm mt-4">Scoring each match with AI — takes ~30s</p>
        </div>
      )}

      {/* Filters */}
      {jobs.length > 0 && !searching && (
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border
                ${filter === f.key
                  ? 'bg-accent/15 border-accent/30 text-accent2'
                  : 'bg-surface border-white/[0.07] text-white/40 hover:text-white hover:border-white/20'
                }`}>
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
            const srcCfg = SOURCE_CONFIG[match.job.source] ?? { color: 'bg-surface2 text-white/40 border-white/10', label: match.job.source }
            const moroccan = isMoroccan(match.job.source)

            return (
              <div key={match.id}
                className={`card transition-all duration-200 ${isApplied ? 'border-emerald-400/20 bg-emerald-400/[0.02]' : 'hover:border-white/15'}
                  ${moroccan ? 'border-l-2 border-l-amber-400/40' : ''}`}>
                <div className="flex items-start gap-4">
                  <ScoreRing score={match.match_score} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base leading-tight">{match.job.title}</h3>
                          {moroccan && <span className="text-xs">🇲🇦</span>}
                        </div>
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
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${srcCfg.color}`}>
                        {srcCfg.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {match.match_reasons.slice(0, 2).map((r, i) => (
                        <span key={i} className="tag-green text-xs">{r.slice(0,45)}{r.length>45?'…':''}</span>
                      ))}
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-3 animate-fade-up">
                        {match.job.description && (
                          <p className="text-white/50 text-sm leading-relaxed">
                            {match.job.description.slice(0, 400)}{match.job.description.length > 400 ? '…' : ''}
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
                        <a href={match.job.apply_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors">
                          <ExternalLink size={11} /> View original listing
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {!isApplied && (
                        <button onClick={() => handleGenerateCL(match)} disabled={isGenerating || !!isApplying}
                          className="btn btn-primary btn-sm">
                          {isGenerating
                            ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
                            : <><Zap size={12} /> Apply + Cover Letter</>}
                        </button>
                      )}
                      {isApplying && (
                        <span className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                          <Loader2 size={12} className="animate-spin" /> Opening…
                        </span>
                      )}
                      <button onClick={() => setExpanded(isExpanded ? null : match.id)} className="btn btn-ghost btn-sm">
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

      {/* Empty states */}
      {!searching && filtered.length === 0 && jobs.length === 0 && (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🇲🇦</div>
          <h3 className="font-display font-semibold text-xl mb-2">Find internships in Morocco & worldwide</h3>
          <p className="text-white/30 text-sm mb-6">
            Searches Rekrute.ma, Emploi.ma, LinkedIn Morocco, RemoteOK, and more
          </p>
          <button onClick={handleSearch} className="btn btn-primary btn-lg">
            <Search size={16} /> Find internships
          </button>
        </div>
      )}

      {!searching && filtered.length === 0 && jobs.length > 0 && (
        <div className="text-center py-16 text-white/30">
          <p>No jobs match this filter. Try another one.</p>
        </div>
      )}

      {clModal && (
        <CoverLetterModal job={clModal.job} letter={clModal.letter}
          onClose={() => setClModal(null)}
          onApply={(letter) => handleApply(clModal.job, letter)} />
      )}
    </div>
  )
}
