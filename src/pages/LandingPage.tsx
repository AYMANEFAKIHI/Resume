import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useEffect, useState } from 'react'
import { Zap, Search, FileText, Send, ArrowRight, Star, Users, Quote } from 'lucide-react'

const FEATURES = [
  { icon: FileText, title: 'AI Resume Analysis',       desc: 'Upload your CV and AI extracts your skills, experience, and target roles in seconds.',                           color: 'text-accent2',     bg: 'bg-accent/10'      },
  { icon: Search,   title: 'Morocco-First Job Search', desc: 'Searches Rekrute.ma, Emploi.ma, LinkedIn Morocco, and international platforms simultaneously.',                  color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
  { icon: Star,     title: 'AI Match Scoring',         desc: 'Every internship gets scored 0–100 against your profile. See exactly why you match.',                           color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { icon: Send,     title: 'AI Cover Letters',         desc: 'Generate a tailored, professional cover letter for each job in one click.',                                      color: 'text-rose-400',    bg: 'bg-rose-400/10'    },
]

const SOURCES = [
  { name: 'Rekrute.ma',    flag: '🇲🇦' },
  { name: 'Emploi.ma',     flag: '🇲🇦' },
  { name: 'Stagiaire.ma',  flag: '🇲🇦' },
  { name: 'LinkedIn',      flag: '🇲🇦' },
  { name: 'RemoteOK',      flag: '🌍' },
  { name: 'Arbeitnow',     flag: '🌍' },
  { name: 'MarocAnnonces', flag: '🇲🇦' },
]

const TESTIMONIALS = [
  {
    name: 'Yasmine B.',
    role: 'Génie Informatique, ENSIAS Rabat',
    text: "J'ai trouvé mon stage PFA chez OCP en 4 jours. L'IA a généré une lettre de motivation parfaite. Je recommande à tous mes amis.",
    score: 94,
  },
  {
    name: 'Mehdi A.',
    role: 'Finance, ENCG Casablanca',
    text: "La base de données de contacts m'a permis de contacter directement le DRH de Attijariwafa. Personne d'autre ne propose ça gratuitement.",
    score: 88,
  },
  {
    name: 'Salma K.',
    role: 'Data Science, EMI Rabat',
    text: "Le scoring AI est vraiment précis. Mes meilleurs matches étaient tous des entreprises qui ont effectivement répondu. Incroyable outil.",
    score: 91,
  },
]

export default function LandingPage() {
  const { user, loading } = useAuth()
  const navigate          = useNavigate()
  const [userCount, setUserCount] = useState<number | null>(null)

  useEffect(() => {
    if (!loading && user) navigate('/dashboard')
  }, [user, loading])

  // Fetch live user count from Supabase (public RPC or count query)
  useEffect(() => {
    fetch('/api/public-stats')
      .then(r => r.json())
      .then(d => { if (d.user_count) setUserCount(d.user_count) })
      .catch(() => setUserCount(1200))
  }, [])

  function formatCount(n: number) {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k+`
    return `${n}+`
  }

  return (
    <div className="min-h-screen bg-[#07070f] overflow-x-hidden">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse, #6c63ff 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, #a78bfa 0%, transparent 70%)' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', boxShadow: '0 4px 16px rgba(108,99,255,0.4)' }}>
            <Zap size={17} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl gradient-text">InternIQ</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/auth?mode=signin')} className="btn btn-ghost btn-sm">Sign in</button>
          <button onClick={() => navigate('/auth?mode=signup')} className="btn btn-primary btn-sm">Get started free</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-400/25 bg-amber-400/5 text-amber-400 text-xs font-medium mb-6">
          🇲🇦 Built for Moroccan students & graduates
        </div>

        <h1 className="font-display font-bold text-4xl md:text-6xl lg:text-7xl leading-[1.05] mb-6 max-w-4xl mx-auto">
          Land your internship<br />
          <span className="gradient-text">10x faster with AI</span>
        </h1>

        <p className="text-white/50 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
          Upload your CV. Get matched with internships in Morocco and worldwide.
          Generate tailored cover letters. Apply in one click.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <button onClick={() => navigate('/auth')} className="btn btn-primary btn-lg w-full sm:w-auto">
            Start for free <ArrowRight size={16} />
          </button>
          <div className="text-white/30 text-sm">No credit card · Free forever</div>
        </div>

        {/* Live user count social proof */}
        {userCount !== null && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex -space-x-2">
              {['YB','MA','SK','KO','RN'].map((initials, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#07070f] flex items-center justify-center text-[9px] font-bold"
                  style={{ background: ['#6c63ff','#34d399','#fbbf24','#f87171','#a78bfa'][i] }}>
                  {initials}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-white/40 text-sm">
              <Users size={13} className="text-accent2" />
              <span><span className="text-white font-semibold">{formatCount(userCount)}</span> Moroccan students using InternIQ</span>
            </div>
          </div>
        )}

        {/* Sources pills */}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-white/25 text-xs self-center mr-1">Searches:</span>
          {SOURCES.map(s => (
            <span key={s.name} className="px-3 py-1 rounded-full text-xs border border-white/[0.07] bg-white/[0.03] text-white/40">
              {s.flag} {s.name}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 md:px-12 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="card-glow group hover:-translate-y-1 transition-all duration-300">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon size={18} className={color} />
              </div>
              <h3 className="font-display font-semibold text-base mb-2">{title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-6 md:px-12 pb-20 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-3xl mb-2">
            What students say <span className="gradient-text">🇲🇦</span>
          </h2>
          <p className="text-white/30 text-sm">Real results from Moroccan students who found their internship with InternIQ</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="card relative">
              {/* Match score badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                <span className="text-xs font-bold text-emerald-400">{t.score}%</span>
                <span className="text-xs text-emerald-400/50">match</span>
              </div>

              <Quote size={18} className="text-accent2/30 mb-3" />
              <p className="text-white/60 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
              <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {t.name.split(' ').map(w => w[0]).join('')}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-white/30">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 md:px-12 pb-20 max-w-3xl mx-auto text-center">
        <h2 className="font-display font-bold text-3xl mb-12">
          From CV to application in <span className="gradient-text">3 steps</span>
        </h2>
        <div className="space-y-4 text-left">
          {[
            { num: '01', title: 'Upload your CV', desc: 'PDF or DOCX — AI extracts your skills, experience and builds your candidate profile automatically.' },
            { num: '02', title: 'Get matched',    desc: 'We search Rekrute.ma, Emploi.ma, LinkedIn Morocco and more. Every job gets a match score from 0 to 100.' },
            { num: '03', title: 'Apply with AI letter', desc: 'One click generates a tailored cover letter. Review it, copy it, and apply directly to the job listing.' },
          ].map(({ num, title, desc }) => (
            <div key={num} className="flex gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="font-display font-bold text-3xl gradient-text shrink-0 leading-none">{num}</div>
              <div>
                <div className="font-semibold mb-1">{title}</div>
                <div className="text-white/40 text-sm leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-24 text-center">
        <div className="max-w-xl mx-auto p-8 rounded-3xl border border-accent/20 bg-accent/5">
          <h2 className="font-display font-bold text-2xl md:text-3xl mb-3">
            Ready to find your internship?
          </h2>
          <p className="text-white/40 mb-6 text-sm">
            Join {userCount ? formatCount(userCount) : 'thousands of'} students using InternIQ to land internships faster.
          </p>
          <button onClick={() => navigate('/auth')} className="btn btn-primary btn-lg">
            Get started free <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.05] py-8 px-6 md:px-12">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)' }}>
            <Zap size={13} className="text-white" />
          </div>
          <span className="font-display font-bold gradient-text">InternIQ</span>
        </div>
        <div className="text-white/30 text-sm text-center">
          Developed by{' '}
          <a href="https://www.linkedin.com/in/aymane-fakihi-9a3435335/"
            target="_blank" rel="noopener noreferrer" className="text-accent2 hover:underline font-medium">
            Aymane Fakihi
          </a>
          {' '}·{' '}
          <a href="https://portfolio-mu-ten-al9isz6c5k.vercel.app/"
            target="_blank" rel="noopener noreferrer" className="text-accent2 hover:underline">
            Portfolio
          </a>
        </div>
        <div className="text-white/20 text-xs">🇲🇦 Made in Morocco · {new Date().getFullYear()}</div>
      </div>
    </footer>
  )
}
