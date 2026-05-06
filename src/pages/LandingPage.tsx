import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useEffect } from 'react'
import { Zap, Search, FileText, Send, CheckCircle, ArrowRight, Star } from 'lucide-react'

const FEATURES = [
  {
    icon: FileText,
    title: 'AI Resume Analysis',
    desc: 'Upload your CV and Claude extracts your skills, experience, and target roles in seconds.',
    color: 'text-accent2',
    bg: 'bg-accent/10',
  },
  {
    icon: Search,
    title: 'Morocco-First Job Search',
    desc: 'Searches Rekrute.ma, Emploi.ma, LinkedIn Morocco, and international platforms simultaneously.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    icon: Star,
    title: 'AI Match Scoring',
    desc: 'Every internship gets scored 0–100 against your profile. See exactly why you match.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: Send,
    title: 'AI Cover Letters',
    desc: 'Generate a tailored, professional cover letter for each job in one click.',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
  },
]

const SOURCES = [
  { name: 'Rekrute.ma', flag: '🇲🇦' },
  { name: 'Emploi.ma', flag: '🇲🇦' },
  { name: 'LinkedIn', flag: '🇲🇦' },
  { name: 'RemoteOK', flag: '🌍' },
  { name: 'Arbeitnow', flag: '🌍' },
  { name: 'MarocAnnonces', flag: '🇲🇦' },
]

export default function LandingPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) navigate('/dashboard')
  }, [user, loading])

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
          <button onClick={() => navigate('/auth?mode=signin')} className="btn btn-ghost btn-sm">
            Sign in
          </button>
          <button onClick={() => navigate('/auth?mode=signup')} className="btn btn-primary btn-sm">
            Get started free
          </button>
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

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => navigate('/auth')} className="btn btn-primary btn-lg w-full sm:w-auto">
            Start for free <ArrowRight size={16} />
          </button>
          <div className="text-white/30 text-sm">No credit card · Free forever</div>
        </div>

        {/* Sources pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-10">
          <span className="text-white/25 text-xs self-center mr-1">Searches:</span>
          {SOURCES.map(s => (
            <span key={s.name}
              className="px-3 py-1 rounded-full text-xs border border-white/[0.07] bg-white/[0.03] text-white/40">
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

      {/* How it works */}
      <section className="relative z-10 px-6 md:px-12 pb-20 max-w-3xl mx-auto text-center">
        <h2 className="font-display font-bold text-3xl mb-12">
          From CV to application in <span className="gradient-text">3 steps</span>
        </h2>
        <div className="space-y-4 text-left">
          {[
            { num: '01', title: 'Upload your CV', desc: 'PDF or DOCX — AI extracts your skills, experience and builds your candidate profile automatically.' },
            { num: '02', title: 'Get matched', desc: 'We search Rekrute.ma, Emploi.ma, LinkedIn Morocco and more. Every job gets a match score from 0 to 100.' },
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
          <p className="text-white/40 mb-6 text-sm">Join students using InternIQ to land internships faster.</p>
          <button onClick={() => navigate('/auth')} className="btn btn-primary btn-lg">
            Get started free <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
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
            target="_blank" rel="noopener noreferrer"
            className="text-accent2 hover:underline font-medium">
            Aymane Fakihi
          </a>
          {' '}·{' '}
          <a href="https://portfolio-mu-ten-al9isz6c5k.vercel.app/"
            target="_blank" rel="noopener noreferrer"
            className="text-accent2 hover:underline">
            Portfolio
          </a>
        </div>

        <div className="text-white/20 text-xs">
          🇲🇦 Made in Morocco · {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  )
}
