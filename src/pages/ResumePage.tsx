import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Sparkles, ChevronDown, ChevronUp, ArrowRight, Lightbulb, Target } from 'lucide-react'
import { uploadResume, getProfile, getResumeImprovement } from '../lib/api'
import type { CandidateProfile } from '../types'
import toast from 'react-hot-toast'

interface ResumeImprovement {
  missing_keywords: string[]
  rewrites: { section: string; original: string; improved: string }[]
  ats_score: number
  ats_tips: string[]
}

export default function ResumePage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [improvement, setImprovement] = useState<ResumeImprovement | null>(null)
  const [loadingImprovement, setLoadingImprovement] = useState(false)
  const [showRewrites, setShowRewrites] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load profile on mount
  useState(() => {
    getProfile().then(r => setProfile(r.profile)).catch(() => {})
  })

  async function handleFile(file: File) {
    const SUPPORTED = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    const ext = file.name.split('.').pop()?.toLowerCase()
    const isSupportedExt = ['pdf', 'docx', 'txt'].includes(ext ?? '')

    if (!SUPPORTED.includes(file.type) && !isSupportedExt) {
      toast.error('Please upload a PDF, DOCX, or TXT file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large — max 10MB')
      return
    }

    setUploading(true)
    setImprovement(null)
    try {
      const res = await uploadResume(file)
      setProfile(res.profile)
      toast.success('Resume analyzed successfully!')
    } catch (e: any) {
      toast.error(e.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function loadImprovement() {
    setLoadingImprovement(true)
    try {
      const res = await getResumeImprovement()
      setImprovement(res.improvement)
      setShowRewrites(true)
    } catch {
      toast.error('Failed to analyze resume improvements')
    } finally {
      setLoadingImprovement(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="font-display font-bold text-3xl mb-1">Resume</h1>
        <p className="text-white/40 text-sm">Upload your CV to get AI-powered profile extraction and internship matches</p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-10 text-center mb-8
          ${dragOver ? 'border-accent bg-accent/10' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'}
          ${uploading ? 'pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-accent" />
            <p className="text-white/60 text-sm">Analyzing your resume with AI...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Upload size={24} className="text-accent2" />
            </div>
            <div>
              <p className="text-base font-medium mb-1">Drop your resume here or click to browse</p>
              <p className="text-white/30 text-sm">PDF, DOCX, or TXT · Max 10MB</p>
              {/* ✅ DOCX support note */}
              <p className="text-white/20 text-xs mt-1">Word (.docx) files fully supported ✓</p>
            </div>
          </div>
        )}
      </div>

      {/* Profile extracted */}
      {profile && (
        <div className="space-y-6">
          {/* Success banner */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/15">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-400">Resume analyzed</p>
              <p className="text-xs text-white/40 mt-0.5">Your profile has been extracted and is ready for job matching.</p>
            </div>
          </div>

          {/* Profile card */}
          <div className="card">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center font-display font-bold text-xl text-white shrink-0">
                {profile.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'CV'}
              </div>
              <div>
                <h2 className="font-display font-bold text-xl">{profile.full_name}</h2>
                <p className="text-accent2 text-sm">{profile.title}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
              {profile.email && <div className="text-white/50"><span className="text-white/25 text-xs uppercase tracking-wider block mb-0.5">Email</span>{profile.email}</div>}
              {profile.phone && <div className="text-white/50"><span className="text-white/25 text-xs uppercase tracking-wider block mb-0.5">Phone</span>{profile.phone}</div>}
              {profile.location && <div className="text-white/50"><span className="text-white/25 text-xs uppercase tracking-wider block mb-0.5">Location</span>{profile.location}</div>}
              {profile.experience_years > 0 && <div className="text-white/50"><span className="text-white/25 text-xs uppercase tracking-wider block mb-0.5">Experience</span>{profile.experience_years} year{profile.experience_years !== 1 ? 's' : ''}</div>}
            </div>

            {profile.education?.degree && (
              <div className="mb-6">
                <span className="text-white/25 text-xs uppercase tracking-wider block mb-2">Education</span>
                <p className="text-white/60 text-sm">{profile.education.degree} in {profile.education.field} — {profile.education.institution}</p>
              </div>
            )}

            {profile.summary && (
              <div className="mb-6">
                <span className="text-white/25 text-xs uppercase tracking-wider block mb-2">Summary</span>
                <p className="text-white/60 text-sm leading-relaxed">{profile.summary}</p>
              </div>
            )}

            {profile.skills?.length > 0 && (
              <div className="mb-6">
                <span className="text-white/25 text-xs uppercase tracking-wider block mb-2">Skills</span>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map(s => <span key={s} className="tag">{s}</span>)}
                </div>
              </div>
            )}

            {profile.preferred_roles?.length > 0 && (
              <div>
                <span className="text-white/25 text-xs uppercase tracking-wider block mb-2">Target roles</span>
                <div className="flex flex-wrap gap-2">
                  {profile.preferred_roles.map(r => <span key={r} className="tag-accent">{r}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* AI improvement analysis */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-accent2" />
                  <h3 className="font-display font-semibold text-base">AI resume improvement</h3>
                </div>
                <p className="text-white/40 text-sm">Deep analysis comparing your CV to the jobs you're applying to.</p>
              </div>
              {!improvement && (
                <button
                  onClick={loadImprovement}
                  disabled={loadingImprovement}
                  className="btn btn-primary btn-sm shrink-0"
                >
                  {loadingImprovement ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  Analyze
                </button>
              )}
            </div>

            {improvement && (
              <div className="space-y-5">
                {/* ATS score */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="text-center shrink-0">
                    <div className={`font-display font-bold text-3xl ${improvement.ats_score >= 70 ? 'text-emerald-400' : improvement.ats_score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                      {improvement.ats_score}
                    </div>
                    <div className="text-xs text-white/30">ATS score</div>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${improvement.ats_score >= 70 ? 'bg-emerald-400' : improvement.ats_score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${improvement.ats_score}%` }}
                      />
                    </div>
                    <ul className="space-y-1">
                      {improvement.ats_tips.map((tip, i) => (
                        <li key={i} className="text-xs text-white/50 flex gap-1.5">
                          <AlertCircle size={11} className="text-amber-400 shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Missing keywords */}
                {improvement.missing_keywords.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={13} className="text-red-400" />
                      <span className="text-xs font-semibold uppercase tracking-widest text-white/30">Missing keywords</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {improvement.missing_keywords.map(kw => (
                        <span key={kw} className="tag text-red-400/70 border-red-400/15 bg-red-400/5">{kw}</span>
                      ))}
                    </div>
                    <p className="text-xs text-white/25 mt-2">Add these to your resume to improve match scores.</p>
                  </div>
                )}

                {/* Rewrite suggestions */}
                {improvement.rewrites.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowRewrites(v => !v)}
                      className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/30 mb-3 hover:text-white/60 transition-colors"
                    >
                      <Lightbulb size={12} className="text-amber-400" />
                      Suggested rewrites ({improvement.rewrites.length})
                      {showRewrites ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {showRewrites && (
                      <div className="space-y-3">
                        {improvement.rewrites.map((r, i) => (
                          <div key={i} className="rounded-xl overflow-hidden border border-white/[0.06]">
                            <div className="px-3 py-1.5 bg-white/[0.03] border-b border-white/[0.05]">
                              <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{r.section}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.05]">
                              <div className="p-3">
                                <p className="text-xs text-white/25 mb-1.5">Current</p>
                                <p className="text-xs text-white/50 leading-relaxed">{r.original}</p>
                              </div>
                              <div className="p-3 bg-emerald-400/[0.03]">
                                <p className="text-xs text-emerald-400/50 mb-1.5">Improved</p>
                                <p className="text-xs text-white/70 leading-relaxed">{r.improved}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Find jobs CTA */}
          <div className="flex justify-end">
            <a href="/jobs" className="btn btn-primary">
              Find internships <ArrowRight size={15} />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
