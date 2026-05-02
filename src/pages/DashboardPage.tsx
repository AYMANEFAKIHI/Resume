import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Briefcase, Send, Star, TrendingUp, ArrowRight, Loader2, Lightbulb } from 'lucide-react'
import { getStats, getProfile, getResumeTips } from '../lib/api'
import type { DashboardStats, CandidateProfile } from '../types'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [tips, setTips] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, profileRes] = await Promise.allSettled([
          getStats(),
          getProfile(),
        ])
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.stats)
        if (profileRes.status === 'fulfilled') {
          setProfile(profileRes.value.profile)
          // Load tips in background
          getResumeTips().then(r => setTips(r.tips)).catch(() => {})
        }
      } catch {
        // silently fail — user may not have a profile yet
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const STAT_CARDS = [
    { label: 'Jobs Found',     value: stats?.jobs_found ?? 0,          icon: Briefcase,   color: 'text-accent2',       bg: 'bg-accent/10'      },
    { label: 'Applications',   value: stats?.total_applications ?? 0,  icon: Send,        color: 'text-emerald-400',   bg: 'bg-emerald-400/10' },
    { label: 'Interviews',     value: stats?.interviews ?? 0,          icon: TrendingUp,  color: 'text-amber-400',     bg: 'bg-amber-400/10'   },
    { label: 'Top Match',      value: `${stats?.top_match_score ?? 0}%`, icon: Star,      color: 'text-rose-400',      bg: 'bg-rose-400/10'    },
  ]

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

      {/* No profile yet */}
      {!profile && (
        <div className="card border-accent/20 bg-accent/5 mb-8 flex items-center justify-between gap-6">
          <div>
            <h3 className="font-display font-semibold text-lg mb-1">Start by uploading your resume</h3>
            <p className="text-white/40 text-sm">Claude will analyze it and find the best internship matches for you.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Quick actions */}
        {!profile && (
          <div className="card">
            <div className="section-label mb-5">Quick actions</div>
            <div className="space-y-3">
              {[
                { label: 'Upload resume', sub: 'Let AI analyze your background', to: '/resume', icon: FileText },
                { label: 'Find internships', sub: 'Search across all platforms', to: '/jobs', icon: Briefcase },
                { label: 'Track applications', sub: 'Monitor your progress', to: '/tracker', icon: TrendingUp },
              ].map(({ label, sub, to, icon: Icon }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-surface2 border border-white/[0.05] hover:border-white/15 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-accent2" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-white/35">{sub}</div>
                  </div>
                  <ArrowRight size={14} className="text-white/20 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
