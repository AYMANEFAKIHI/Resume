import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Zap, Mail, Lock, ArrowRight, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
        toast.success('Welcome back!')
        navigate('/dashboard')
      } else {
        await signUp(email, password)
        toast.success('Account created! Check your email to confirm.')
        setMode('signin')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(ellipse, #6c63ff, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Back to home */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-white/30 text-sm hover:text-white transition-colors mb-8">
          <ArrowLeft size={14} /> Back to home
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', boxShadow: '0 8px 32px rgba(108,99,255,0.35)' }}>
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl gradient-text mb-1">InternIQ</h1>
          <p className="text-white/35 text-sm">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your free account'}
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/40 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" className="input pl-10" required />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-white/40 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="input pl-10" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center py-3 mt-2">
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <>{mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight size={15} /></>
              }
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/[0.06] text-center">
            <span className="text-white/30 text-sm">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-accent2 text-sm font-medium hover:underline">
              {mode === 'signin' ? 'Sign up free' : 'Sign in'}
            </button>
          </div>
        </div>

        {/* Footer credit */}
        <p className="text-center text-white/15 text-xs mt-6">
          Built by{' '}
          <a href="https://www.linkedin.com/in/aymane-fakihi-9a3435335/"
            target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-accent2 transition-colors">
            Aymane Fakihi
          </a>
          {' '}· 🇲🇦 Made in Morocco
        </p>
      </div>
    </div>
  )
}
