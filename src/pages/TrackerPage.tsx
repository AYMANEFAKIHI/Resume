import { useEffect, useState } from 'react'
import { Loader2, Trash2, FileText, TrendingUp, Send, Award, ClipboardList } from 'lucide-react'
import { getApplications, updateApplication, deleteApplication } from '../lib/api'
import type { Application, ApplicationStatus } from '../types'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  pending:    { label: 'Pending',    color: 'bg-white/5 text-white/40 border-white/10'          },
  submitting: { label: 'Submitting', color: 'bg-accent/10 text-accent2 border-accent/20'        },
  submitted:  { label: 'Submitted',  color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  failed:     { label: 'Failed',     color: 'bg-red-400/10 text-red-400 border-red-400/20'      },
  reviewing:  { label: 'Reviewing',  color: 'bg-blue-400/10 text-blue-400 border-blue-400/20'   },
  interview:  { label: 'Interview',  color: 'bg-amber-400/10 text-amber-400 border-amber-400/20'},
  rejected:   { label: 'Rejected',   color: 'bg-red-400/10 text-red-400/60 border-red-400/10'   },
  offer:      { label: '🎉 Offer',   color: 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30' },
}

const ALL_STATUSES: ApplicationStatus[] = [
  'pending', 'submitting', 'submitted', 'failed', 'reviewing', 'interview', 'rejected', 'offer'
]

export default function TrackerPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [viewCL, setViewCL] = useState<Application | null>(null)

  useEffect(() => {
    getApplications()
      .then(r => setApplications(r.applications))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false))
  }, [])

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    try {
      const res = await updateApplication(id, { status })
      setApplications(prev => prev.map(a => a.id === id ? res.application : a))
      toast.success('Status updated')
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
    { label: 'Total',       value: counts.total,     icon: ClipboardList, color: 'text-accent2',     bg: 'bg-accent/10'      },
    { label: 'Submitted',   value: counts.submitted, icon: Send,          color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Interviews',  value: counts.interview, icon: TrendingUp,    color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
    { label: 'Offers',      value: counts.offer,     icon: Award,         color: 'text-rose-400',    bg: 'bg-rose-400/10'    },
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
          <div key={label} className="card text-center">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className={`font-display font-bold text-3xl ${color}`}>{value}</div>
            <div className="text-white/30 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {applications.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Role', 'Company', 'Source', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-white/30 uppercase tracking-wider px-5 py-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map(app => {
                const cfg = STATUS_CONFIG[app.status]
                return (
                  <tr key={app.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0">
                    <td className="px-5 py-4">
                      <div className="font-medium text-sm">{app.job?.title ?? 'Unknown role'}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-white/60">{app.job?.company ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className="tag text-xs">{app.job?.source ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={app.status}
                        onChange={e => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border bg-transparent outline-none cursor-pointer ${cfg.color}`}
                      >
                        {ALL_STATUSES.map(s => (
                          <option key={s} value={s} className="bg-surface2 text-white">
                            {STATUS_CONFIG[s].label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-xs text-white/30">
                      {app.submitted_at
                        ? new Date(app.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {app.cover_letter && (
                          <button
                            onClick={() => setViewCL(app)}
                            className="btn btn-ghost btn-sm"
                          >
                            <FileText size={12} /> Letter
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="btn btn-danger btn-sm"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-24">
          <ClipboardList size={40} className="mx-auto mb-4 text-white/10" />
          <h3 className="font-display font-semibold text-xl mb-2">No applications yet</h3>
          <p className="text-white/30 text-sm">Go to Jobs and start applying — they'll all appear here</p>
        </div>
      )}

      {/* Cover Letter Viewer */}
      {viewCL && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div>
                <div className="font-semibold">{viewCL.job?.title}</div>
                <div className="text-accent2 text-sm">at {viewCL.job?.company}</div>
              </div>
              <button onClick={() => setViewCL(null)} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap font-body">
                {viewCL.cover_letter}
              </pre>
            </div>
            <div className="p-5 border-t border-white/[0.06]">
              <button
                onClick={() => { navigator.clipboard.writeText(viewCL.cover_letter ?? ''); toast.success('Copied!') }}
                className="btn btn-secondary btn-sm"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
