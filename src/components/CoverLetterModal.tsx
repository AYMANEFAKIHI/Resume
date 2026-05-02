import { useState } from 'react'
import { X, Copy, Send, Edit3, Check } from 'lucide-react'
import type { JobMatch } from '../types'
import toast from 'react-hot-toast'

interface Props {
  job: JobMatch
  letter: string
  onClose: () => void
  onApply: (letter: string) => void
}

export default function CoverLetterModal({ job, letter: initialLetter, onClose, onApply }: Props) {
  const [letter, setLetter] = useState(initialLetter)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(letter)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-up">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="font-display font-bold text-xl">{job.job.title}</h2>
            <p className="text-accent2 text-sm mt-0.5">at {job.job.company} · {job.job.location}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost p-2 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Cover letter */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-white/30 uppercase tracking-wider">
              AI-Generated Cover Letter
            </span>
            <button
              onClick={() => setEditing(!editing)}
              className="btn btn-ghost btn-sm"
            >
              <Edit3 size={12} />
              {editing ? 'Preview' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <textarea
              value={letter}
              onChange={e => setLetter(e.target.value)}
              className="input min-h-[320px] resize-none text-sm leading-relaxed"
            />
          ) : (
            <div className="bg-surface2 rounded-xl p-5 text-sm text-white/70 leading-relaxed whitespace-pre-wrap border border-white/[0.05]">
              {letter}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-6 border-t border-white/[0.06]">
          <button onClick={handleCopy} className="btn btn-secondary btn-sm">
            {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={() => onApply(letter)} className="btn btn-primary">
            <Send size={14} /> Submit application
          </button>
        </div>
      </div>
    </div>
  )
}
