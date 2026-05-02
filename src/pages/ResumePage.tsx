import { useEffect, useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, Loader2, Edit3, Save, X, Plus } from 'lucide-react'
import { uploadResume, uploadResumeText, getProfile, updateProfile } from '../lib/api'
import type { CandidateProfile } from '../types'
import toast from 'react-hot-toast'

export default function ResumePage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<Partial<CandidateProfile>>({})
  const [newSkill, setNewSkill] = useState('')

  useEffect(() => {
    getProfile()
      .then(r => setProfile(r.profile))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setAnalyzing(true)
    try {
      const res = await uploadResume(file)
      setProfile(res.profile)
      toast.success('Resume analyzed!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setAnalyzing(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  async function handlePasteAnalyze() {
    if (pasteText.trim().length < 50) { toast.error('Please paste more resume content'); return }
    setAnalyzing(true)
    try {
      const res = await uploadResumeText(pasteText)
      setProfile(res.profile)
      setPasteText('')
      toast.success('Resume analyzed!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  function startEdit() {
    if (!profile) return
    setEditData({
      full_name: profile.full_name, title: profile.title,
      email: profile.email, phone: profile.phone, location: profile.location,
      skills: [...profile.skills], preferred_roles: [...profile.preferred_roles],
      preferred_locations: [...profile.preferred_locations],
      linkedin_url: profile.linkedin_url, github_url: profile.github_url,
      portfolio_url: profile.portfolio_url,
    })
    setEditMode(true)
  }

  async function saveEdit() {
    try {
      const res = await updateProfile(editData)
      setProfile(res.profile)
      setEditMode(false)
      toast.success('Profile updated!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 size={28} className="animate-spin text-accent" />
    </div>
  )

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-1">Resume</h1>
        <p className="text-white/40 text-sm">Upload your resume and let AI extract your full profile</p>
      </div>

      {!analyzing && (
        <div className="mb-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
              ${isDragActive ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/20 bg-surface'}`}
          >
            <input {...getInputProps()} />
            <div className="w-14 h-14 rounded-2xl bg-surface2 flex items-center justify-center mx-auto mb-4">
              <Upload size={22} className="text-white/40" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">
              {isDragActive ? 'Drop it here!' : 'Drop your resume here'}
            </h3>
            <p className="text-white/30 text-sm mb-1">PDF, DOCX or TXT · Max 10MB</p>
            <p className="text-white/20 text-xs mb-4">PDF is parsed server-side automatically</p>
            <button className="btn btn-secondary btn-sm" type="button">Choose file</button>
          </div>

          <div className="flex items-center gap-3 my-5 text-white/20 text-sm">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span>or paste resume text</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder="Paste your resume text here..."
            className="input min-h-[140px] resize-y w-full"
          />
          <div className="flex justify-end mt-3">
            <button onClick={handlePasteAnalyze} disabled={pasteText.trim().length < 50} className="btn btn-primary">
              Analyze with AI →
            </button>
          </div>
        </div>
      )}

      {analyzing && (
        <div className="card text-center py-16 mb-8">
          <div className="flex justify-center gap-2 mb-6">
            {[0,1,2].map(i => (
              <div key={i} className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse-dot"
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <h3 className="font-display font-semibold text-xl mb-2">Analyzing your resume...</h3>
          <p className="text-white/40 text-sm">AI is building your candidate profile</p>
        </div>
      )}

      {profile && !analyzing && (
        <div className="animate-fade-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <CheckCircle size={15} /> Profile extracted
            </div>
            {editMode ? (
              <div className="flex gap-2">
                <button onClick={() => setEditMode(false)} className="btn btn-ghost btn-sm"><X size={14} /> Cancel</button>
                <button onClick={saveEdit} className="btn btn-primary btn-sm"><Save size={14} /> Save</button>
              </div>
            ) : (
              <button onClick={startEdit} className="btn btn-secondary btn-sm"><Edit3 size={14} /> Edit</button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="space-y-4">
              <div className="card">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center font-display font-bold text-xl text-white mb-4">
                  {profile.full_name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
                </div>
                {editMode ? (
                  <div className="space-y-3">
                    {(['full_name','title','email','phone','location','linkedin_url','github_url','portfolio_url'] as const).map(key => (
                      <div key={key}>
                        <label className="text-xs text-white/30 mb-1 block capitalize">{key.replace(/_/g,' ')}</label>
                        <input className="input py-2 text-sm" value={String(editData[key] ?? '')}
                          onChange={e => setEditData(d => ({ ...d, [key]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="font-semibold text-lg">{profile.full_name}</div>
                    <div className="text-accent2 text-sm mb-3">{profile.title}</div>
                    {profile.summary && <p className="text-white/40 text-sm leading-relaxed mb-3">{profile.summary}</p>}
                    <div className="space-y-1.5 text-sm text-white/40">
                      {profile.email && <div>✉ {profile.email}</div>}
                      {profile.phone && <div>📱 {profile.phone}</div>}
                      {profile.location && <div>📍 {profile.location}</div>}
                      {profile.portfolio_url && <div>🌐 Portfolio</div>}
                    </div>
                  </>
                )}
              </div>
              <div className="card">
                <div className="section-label">Education</div>
                <div className="font-medium text-sm">{profile.education?.degree}</div>
                <div className="text-accent2 text-sm">{profile.education?.field}</div>
                <div className="text-white/40 text-sm">{profile.education?.institution}</div>
                <div className="text-white/30 text-xs mt-1">{profile.education?.year}</div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="card">
                <div className="section-label">Skills ({editMode ? editData.skills?.length : profile.skills.length})</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(editMode ? editData.skills ?? [] : profile.skills).map((s: string) => (
                    <span key={s} className="tag flex items-center gap-1">{s}
                      {editMode && (
                        <button onClick={() => setEditData(d => ({ ...d, skills: (d.skills??[]).filter(x=>x!==s) }))}
                          className="text-white/30 hover:text-red-400 ml-1"><X size={10}/></button>
                      )}
                    </span>
                  ))}
                </div>
                {editMode && (
                  <div className="flex gap-2">
                    <input className="input py-2 text-sm flex-1" placeholder="Add skill..." value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={e => { if(e.key==='Enter'&&newSkill.trim()){setEditData(d=>({...d,skills:[...(d.skills??[]),newSkill.trim()]}));setNewSkill('')}}} />
                    <button onClick={()=>{if(newSkill.trim()){setEditData(d=>({...d,skills:[...(d.skills??[]),newSkill.trim()]}));setNewSkill('')}}}
                      className="btn btn-secondary btn-sm"><Plus size={14}/></button>
                  </div>
                )}
              </div>

              <div className="card">
                <div className="section-label">Experience</div>
                <div className="space-y-4">
                  {profile.experience.map((exp: any, i: number) => (
                    <div key={i} className="pb-4 border-b border-white/[0.06] last:border-0 last:pb-0">
                      <div className="font-medium text-sm">{exp.title}</div>
                      <div className="text-accent2 text-sm">{exp.company} · {exp.duration}</div>
                      <div className="text-white/40 text-sm mt-1 leading-relaxed">{exp.description}</div>
                      {exp.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {exp.technologies.map((t:string) => <span key={t} className="tag text-xs">{t}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                  {profile.experience.length === 0 && <p className="text-white/30 text-sm">No experience listed</p>}
                </div>
              </div>

              <div className="card">
                <div className="section-label">Target roles</div>
                <div className="flex flex-wrap gap-2">
                  {profile.preferred_roles.map((r:string) => <span key={r} className="tag-accent">{r}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!profile && !analyzing && (
        <div className="text-center py-16 text-white/30">
          <FileText size={40} className="mx-auto mb-4 opacity-20" />
          <p>Upload your resume above to get started</p>
        </div>
      )}
    </div>
  )
}
