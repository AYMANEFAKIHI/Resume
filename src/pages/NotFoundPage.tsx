import { useNavigate } from 'react-router-dom'
import { Zap, Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, #6c63ff, transparent 70%)' }} />
      </div>

      <div className="relative text-center max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', boxShadow: '0 8px 32px rgba(108,99,255,0.3)' }}>
            <Zap size={24} className="text-white" />
          </div>
        </div>

        {/* 404 */}
        <div className="font-display font-bold text-8xl gradient-text mb-4 leading-none">
          404
        </div>

        <h1 className="font-display font-bold text-2xl mb-3">Page not found</h1>
        <p className="text-white/40 text-sm leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn btn-ghost">
            <ArrowLeft size={15} /> Go back
          </button>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            <Home size={15} /> Go home
          </button>
        </div>

        <p className="text-white/15 text-xs mt-10">
          InternIQ · Built by{' '}
          <a href="https://www.linkedin.com/in/aymane-fakihi-9a3435335/"
            target="_blank" rel="noopener noreferrer"
            className="text-white/25 hover:text-accent2 transition-colors">
            Aymane Fakihi
          </a>
          {' '}🇲🇦
        </p>
      </div>
    </div>
  )
}
