import { useEffect, useState } from 'react'
import { Loader2, Trash2, FileText, TrendingUp, Send, Award, ClipboardList, Brain } from 'lucide-react'
import { getApplications, updateApplication, deleteApplication } from '../lib/api'
import type { Application, ApplicationStatus } from '../types'
import InterviewPrepModal from '../components/InterviewPrepModal'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  pending:    { label: 'Pending',    color: 'bg-white/5 text-white/40 border-white/10'                  },
  submitting: { label: 'Submitting', color: 'bg-accent/10 text-accent2 border-accent/20'                },
  submitted:  { label: 'Submitted',  color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'  },
  failed:     { label: 'Failed',     color: 'bg-red-400/10 text-red-400 border-red-400/20'              },
  reviewing:  { label: 'Reviewing',  color: 'bg-blue-400/10 text-blue-400 border-blue-400/20'           },
  interview:  { label: 'Interview',  color: 'bg-amber-400/10 text-amber-400 border-amber-400/20'        },
  rejected:   { label: 'Rejected',   color: 'bg-red-400/10 text-red-400/60 border-red-400/10'           },
  offer:      { label: '🎉 Offer',   color: 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30'  },
}

const ALL_STATUSES: ApplicationStatus[] = [
  'pending', 'submitting', 'submitted', 'failed', 'reviewing', 'interview', 'rejected', 'offer'
]

export default function TrackerPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [viewCL, setViewCL] = useState<Application | null>(null)
  const [prepJob, setPrepJob] = useState<any | null>(null)  // job match for interview prep

  useEffect(() => {
    getApplications()
      .then(r => setApplications(r.applications))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false))
  }, [])

  async function handleStatusChange(id: string, status: ApplicationStatus, app: Application) {
    try {
      const res = await updateApplication(id, { status })
      setApplications(prev => prev.map(a => a.id === id ? res.application : a))
      toast.success('Status updated')

      // Auto-suggest interview prep when moved to "interview"
      if (status === 'interview' && app.job) {
        toast.success('🎉 Interview! Want to prep?', {
          duration: 5000,
          icon: '🧠',
        })
        // Slight delay so toast shows first
        setTimeout(() => setPrepJob({ job_id: app.job_id, job: app.job, match_score: 0 }), 800)
      }
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteApplication(id)
      setApplications(prev => prev.filter(a => a.id !== id))
      toast.success('Application removed')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const counts = {
    total:     applications.length,
    submitted: applications.filter(a => a.status === 'submitted').length,
    interview: applications.filter(a => a.status === 'interview').length,
    offer:     applications.filter(a => a.status === 'offer').length,
  }

  const STAT_CARDS = [
    { label: 'Total',      value: counts.total,     icon: ClipboardList, color: 'text-accent2',     bg: 'bg-accent/10'      },
    { label: 'Submitted',  value: counts.submitted, icon: Send,          color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Interviews', value: counts.interview, icon: TrendingUp,    color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
    { label: 'Offers',     value: counts.offer,     icon: Award,         color: 'text-rose-400',    bg: 'bg-rose-400/10'    },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 size={28} className="animate-spin text-accent" />
    </div>
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-1">Application tracker</h1>
        <p className="text-white/40 text-sm">Track every application and update statuses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
              <Icon size={18} className={color} />
            </div>
            <div className={`font-display font-bold text-3xl ${color} mb-1`}>{value}</div>
            <div className="text-white/40 text-xs">{label}</div>
          </div>
        ))}
      </div>

      {/* Applications list */}
      {applications.length === 0 ? (
        <div className="card text-center py-16">
          <ClipboardList size={40} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/40 mb-2">No applications yet</p>
          <p className="text-white/25 text-sm">Apply to jobs from the Jobs page to track them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.id} className="card">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base mb-0.5 truncate">
                    {app.job?.title ?? 'Unknown position'}
                  </div>
                  <div className="text-white/40 text-sm truncate">
                    {app.job?.company ?? 'Unknown company'}
                    {app.job?.location ? ` · ${app.job.location}` : ''}
                    {app.job?.source ? ` · ${app.job.source}` : ''}
                  </div>
                  <div className="text-white/20 text-xs mt-1">
                    Applied {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Interview prep button — shown when status is interview */}
                  {app.status === 'interview' && (
                    <button
                      onClick={() => setPrepJob({ job_id: app.job_id, job: app.job, match_score: 0 })}
                      className="btn btn-sm flex items-center gap-1.5 border border-amber-400/25 text-amber-400 bg-amber-400/5 hover:bg-amber-400/10"
                    >
                      <Brain size={12} /> Prep
                    </button>
                  )}

                  {/* Cover letter button */}
                  {app.cover_letter && (
                    <button
                      onClick={() => setViewCL(app)}
                      className="btn btn-ghost btn-sm flex items-center gap-1.5"
                    >
                      <FileText size={12} /> Letter
                    </button>
                  )}

                  {/* Status selector */}
                  <select
                    value={app.status}
                    onChange={e => handleStatusChange(app.id, e.target.value as ApplicationStatus, app)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium cursor-pointer bg-transparent ${STATUS_CONFIG[app.status]?.color ?? ''}`}
                  >
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s} style={{ background: '#111120' }}>
                        {STATUS_CONFIG[s].label}
                      </option>
                    ))}
                  </select>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(app.id)}
                    className="btn btn-danger btn-sm"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cover letter modal */}
      {viewCL && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="card w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display font-bold text-xl mb-1">Cover letter</h2>
                <p className="text-white/40 text-sm">{viewCL.job?.title} at {viewCL.job?.company}</p>
              </div>
              <button onClick={() => setViewCL(null)} className="btn btn-ghost btn-sm">Close</button>
            </div>
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{viewCL.cover_letter}</p>
          </div>
        </div>
      )}

      {/* Interview prep modal */}
      {prepJob && (
        <InterviewPrepModal job={prepJob} onClose={() => setPrepJob(null)} />
      )}
    </div>
  )
}
