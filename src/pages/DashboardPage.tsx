import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Briefcase, Send, Star, TrendingUp, ArrowRight, Loader2, Lightbulb, Bell, BarChart2, CheckCircle2 } from 'lucide-react'
import { getStats, getProfile, getResumeTips, getAlertPrefs, updateAlertPrefs, getScraperHealth } from '../lib/api'
import type { DashboardStats, CandidateProfile } from '../types'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface AlertPrefs { frequency: string; min_score: number; enabled: boolean }
interface HealthSource { source: string; status: string; success_rate: number; avg_jobs_per_run: number; last_run: string | null }

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [tips, setTips] = useState<string[]>([])
  const [alertPrefs, setAlertPrefs] = useState<AlertPrefs | null>(null)
  const [health, setHealth] = useState<HealthSource[]>([])
  const [loading, setLoading] = useState(true)
  const [savingAlerts, setSavingAlerts] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, profileRes, alertRes, healthRes] = await Promise.allSettled([
          getStats(),
          getProfile(),
          getAlertPrefs(),
          getScraperHealth(),
        ])
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.stats)
        if (profileRes.status === 'fulfilled') {
          setProfile(profileRes.value.profile)
          getResumeTips().then(r => setTips(r.tips)).catch(() => {})
        }
        if (alertRes.status === 'fulfilled') setAlertPrefs(alertRes.value.prefs)
        if (healthRes.status === 'fulfilled') setHealth(healthRes.value.sources ?? [])
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function saveAlertPrefs(updates: Partial<AlertPrefs>) {
    if (!alertPrefs) return
    const next = { ...alertPrefs, ...updates }
    setAlertPrefs(next)
    setSavingAlerts(true)
    try {
      await updateAlertPrefs(next)
      toast.success('Alert preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSavingAlerts(false)
    }
  }

  const STAT_CARDS = [
    { label: 'Jobs Found',   value: stats?.jobs_found ?? 0,             color: 'text-accent2',     bg: 'bg-accent/10',      icon: Briefcase   },
    { label: 'Applications', value: stats?.total_applications ?? 0,     color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: Send        },
    { label: 'Interviews',   value: stats?.interviews ?? 0,             color: 'text-amber-400',   bg: 'bg-amber-400/10',   icon: TrendingUp  },
    { label: 'Top Match',    value: `${stats?.top_match_score ?? 0}%`,  color: 'text-rose-400',    bg: 'bg-rose-400/10',    icon: Star        },
  ]

  const statusColor = (s: string) =>
    s === 'healthy' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
    s === 'degraded' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
    s === 'down' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
    'text-white/30 bg-white/5 border-white/10'

  const SOURCE_LABELS: Record<string, string> = {
    rekrute: 'Rekrute.ma', emploima: 'Emploi.ma', stagiairema: 'Stagiaire.ma',
    tanmiama: 'Tanmia.ma', optioncarriere: 'OptionCarriere', khdmama: 'Khdma.ma',
    dreamjobma: 'Dreamjob.ma', menaraemploi: 'Menara Emploi', marocannonces: 'MarocAnnonces',
    linkedin: 'LinkedIn', glassdoor: 'Glassdoor', remoteok: 'RemoteOK', arbeitnow: 'Arbeitnow',
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <Loader2 size={28} className="animate-spin text-accent" />
    </div>
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display font-bold text-3xl mb-1">
          {profile ? `Welcome back, ${profile.full_name.split(' ')[0]} 👋` : 'Welcome to InternIQ 👋'}
        </h1>
        <p className="text-white/40 text-sm">{user?.email}</p>
      </div>

      {/* Upload CTA */}
      {!profile && (
        <div className="card border-accent/20 bg-accent/5 mb-8 flex items-center justify-between gap-6">
          <div>
            <h3 className="font-display font-semibold text-lg mb-1">Start by uploading your resume</h3>
            <p className="text-white/40 text-sm">AI analyzes your CV and finds the best internship matches automatically.</p>
          </div>
          <button onClick={() => navigate('/resume')} className="btn btn-primary shrink-0">
            Upload resume <ArrowRight size={15} />
          </button>
        </div>
      )}

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

      {/* Analytics row */}
      {stats && stats.total_applications > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Response rate */}
          <div className="card">
            <div className="section-label flex items-center gap-2 mb-5">
              <BarChart2 size={12} className="text-accent2" />
              Application funnel
            </div>
            <div className="space-y-3">
              {[
                { label: 'Applied', value: stats.total_applications, color: 'bg-accent/60' },
                { label: 'Under review', value: stats.submitted, color: 'bg-blue-400/60' },
                { label: 'Interviews', value: stats.interviews, color: 'bg-amber-400/60' },
                { label: 'Offers', value: stats.offers, color: 'bg-emerald-400/60' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-white/40 mb-1">
                    <span>{label}</span>
                    <span className="font-medium text-white/60">{value}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all duration-700`}
                      style={{ width: stats.total_applications > 0 ? `${Math.round((value / stats.total_applications) * 100)}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
            {(stats as any).response_rate !== undefined && (
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Response rate</span>
                  <span className={`text-sm font-bold ${(stats as any).response_rate >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {(stats as any).response_rate}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Weekly trend */}
          {(stats as any).weekly_trend?.length > 0 && (
            <div className="card">
              <div className="section-label flex items-center gap-2 mb-5">
                <TrendingUp size={12} className="text-emerald-400" />
                Applications this week
              </div>
              <div className="flex items-end gap-2 h-20">
                {(stats as any).weekly_trend.map((d: { date: string; count: number }) => {
                  const max = Math.max(...(stats as any).weekly_trend.map((x: any) => x.count), 1)
                  const pct = Math.round((d.count / max) * 100)
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-sm bg-accent/30 hover:bg-accent/50 transition-colors" style={{ height: `${pct}%`, minHeight: d.count > 0 ? '4px' : '0' }} />
                      <span className="text-xs text-white/20">{d.date.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Profile snapshot */}
        {profile && (
          <div className="card">
            <div className="flex items-start justify-between mb-5">
              <div className="section-label">Your profile</div>
              <button onClick={() => navigate('/resume')} className="btn btn-ghost btn-sm">Edit</button>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center font-display font-bold text-lg text-white shrink-0">
                {profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-base">{profile.full_name}</div>
                <div className="text-accent2 text-sm">{profile.title}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {profile.skills.slice(0, 8).map(s => (
                <span key={s} className="tag">{s}</span>
              ))}
              {profile.skills.length > 8 && (
                <span className="tag text-white/30">+{profile.skills.length - 8}</span>
              )}
            </div>
            <button onClick={() => navigate('/jobs')} className="btn btn-primary w-full justify-center">
              Find internships <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* AI tips */}
        {tips.length > 0 && (
          <div className="card">
            <div className="section-label flex items-center gap-2 mb-5">
              <Lightbulb size={12} className="text-amber-400" />
              AI resume tips
            </div>
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-surface2 border border-white/[0.05]">
                  <span className="text-amber-400 text-xs font-bold mt-0.5 shrink-0">{i + 1}</span>
                  <p className="text-white/60 text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alert preferences */}
      {alertPrefs && (
        <div className="card mb-8">
          <div className="section-label flex items-center gap-2 mb-5">
            <Bell size={12} className="text-accent2" />
            Email job alerts
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={alertPrefs.enabled}
                  onChange={e => saveAlertPrefs({ enabled: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${alertPrefs.enabled ? 'bg-accent' : 'bg-white/10'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-200 ${alertPrefs.enabled ? 'left-5' : 'left-0.5'}`} />
                </div>
              </div>
              <span className="text-sm text-white/60">{alertPrefs.enabled ? 'Enabled' : 'Disabled'}</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Frequency</span>
              <select
                value={alertPrefs.frequency}
                onChange={e => saveAlertPrefs({ frequency: e.target.value })}
                className="input py-1.5 text-xs w-28"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Min. score</span>
              <select
                value={alertPrefs.min_score}
                onChange={e => saveAlertPrefs({ min_score: Number(e.target.value) })}
                className="input py-1.5 text-xs w-24"
              >
                {[50, 60, 70, 80, 90].map(v => <option key={v} value={v}>{v}+</option>)}
              </select>
            </div>

            {savingAlerts && <Loader2 size={14} className="animate-spin text-accent" />}
            {!savingAlerts && alertPrefs.enabled && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 size={12} /> Active
              </span>
            )}
          </div>
          <p className="text-xs text-white/25 mt-3">You'll receive an email digest of new internships matching your profile score threshold.</p>
        </div>
      )}

      {/* Scraper health */}
      {health.length > 0 && (
        <div className="card">
          <div className="section-label mb-5">Platform health</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {health.map(s => (
              <div key={s.source} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <span className="text-xs text-white/50 truncate mr-2">{SOURCE_LABELS[s.source] ?? s.source}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-md border shrink-0 ${statusColor(s.status)}`}>
                  {s.success_rate}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/20 mt-3">Success rate over last 7 days. Auto-refreshed each scrape run.</p>
        </div>
      )}
    </div>
  )
}
