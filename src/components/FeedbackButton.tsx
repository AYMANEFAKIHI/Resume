import { useState } from 'react'
import { MessageSquare, X, Send, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [type, setType] = useState('general')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (message.trim().length < 3) return
    setLoading(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, email, type }),
      })
      setSent(true)
      setMessage('')
      setEmail('')
      setTimeout(() => { setSent(false); setOpen(false) }, 2000)
    } catch {
      toast.error('Failed to send feedback')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-white shadow-lg transition-all hover:-translate-y-0.5"
        style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', boxShadow: '0 4px 20px rgba(108,99,255,0.4)' }}
      >
        <MessageSquare size={15} />
        Feedback
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#111120] border border-white/10 rounded-2xl w-full max-w-md animate-fade-up">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div>
                <h3 className="font-display font-semibold text-lg">Share feedback</h3>
                <p className="text-white/35 text-xs mt-0.5">Help us improve InternIQ</p>
              </div>
              <button onClick={() => setOpen(false)} className="btn btn-ghost p-2 rounded-lg">
                <X size={16} />
              </button>
            </div>

            {sent ? (
              <div className="p-10 text-center">
                <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-1">Thank you! 🙏</h3>
                <p className="text-white/40 text-sm">Your feedback has been received.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Type */}
                <div className="flex gap-2">
                  {[
                    { key: 'general', label: '💬 General' },
                    { key: 'bug', label: '🐛 Bug' },
                    { key: 'feature', label: '✨ Feature' },
                  ].map(t => (
                    <button key={t.key} type="button"
                      onClick={() => setType(t.key)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all
                        ${type === t.key
                          ? 'bg-accent/15 border-accent/30 text-accent2'
                          : 'bg-white/[0.04] border-white/[0.07] text-white/40 hover:text-white'
                        }`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Your message *</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Tell us what you think, what's broken, or what you'd love to see..."
                    className="input min-h-[100px] resize-none"
                    required
                  />
                </div>

                {/* Email (optional) */}
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Email (optional — for follow-up)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input"
                  />
                </div>

                <button type="submit" disabled={loading || message.trim().length < 3} className="btn btn-primary w-full justify-center">
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <><Send size={14} /> Send feedback</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
