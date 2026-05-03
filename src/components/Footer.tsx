import { Zap } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-5 px-8 mt-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/20">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)' }}>
            <Zap size={10} className="text-white" />
          </div>
          <span className="font-display font-bold text-white/30">InternIQ</span>
        </div>

        <div className="text-center">
          Developed by{' '}
          <a href="https://www.linkedin.com/in/aymane-fakihi-9a3435335/"
            target="_blank" rel="noopener noreferrer"
            className="text-accent2/70 hover:text-accent2 transition-colors font-medium">
            Aymane Fakihi
          </a>
          {' · '}
          <a href="https://portfolio-mu-ten-al9isz6c5k.vercel.app/"
            target="_blank" rel="noopener noreferrer"
            className="text-accent2/70 hover:text-accent2 transition-colors">
            Portfolio
          </a>
        </div>

        <div>🇲🇦 Made in Morocco · {new Date().getFullYear()}</div>
      </div>
    </footer>
  )
}
