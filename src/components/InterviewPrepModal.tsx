import { useState } from 'react'
import { Brain, ChevronDown, ChevronUp, Loader2, Lightbulb, Code2, Users, Building2 } from 'lucide-react'
import { getInterviewPrep } from '../lib/api'
import type { JobMatch } from '../types'
import toast from 'react-hot-toast'

interface InterviewQuestion {
  question: string
  hint: string
}

interface InterviewPrep {
  technical_questions: InterviewQuestion[]
  behavioral_questions: InterviewQuestion[]
  company_questions: InterviewQuestion[]
  tips: string[]
}

interface Props {
  job: JobMatch
  onClose: () => void
}

export default function InterviewPrepModal({ job, onClose }: Props) {
  const [prep, setPrep] = useState<InterviewPrep | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await getInterviewPrep(job.job_id)
      setPrep(res.prep)
    } catch {
      toast.error('Failed to generate interview prep')
    } finally {
      setLoading(false)
    }
  }

  function toggle(key: string) {
    setExpanded(prev => prev === key ? null : key)
  }

  const sections = prep ? [
    { key: 'technical', label: 'Technical questions', icon: Code2, color: 'text-blue-400', questions: prep.technical_questions },
    { key: 'behavioral', label: 'Behavioral questions', icon: Users, color: 'text-emerald-400', questions: prep.behavioral_questions },
    { key: 'company', label: 'Company-specific', icon: Building2, color: 'text-amber-400', questions: prep.company_questions },
  ] : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="card w-full max-w-2xl max-h-[85vh] overflow-y-auto relative">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain size={18} className="text-accent2" />
              <h2 className="font-display font-bold text-xl">Interview prep</h2>
            </div>
            <p className="text-white/40 text-sm">{job.job?.title} at {job.job?.company}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">Close</button>
        </div>

        {!prep && !loading && (
          <div className="text-center py-12">
            <Brain size={40} className="text-accent2/30 mx-auto mb-4" />
            <p className="text-white/40 text-sm mb-6">Generate AI-powered interview questions tailored to this role and your profile.</p>
            <button onClick={load} className="btn btn-primary">
              Generate prep <Brain size={14} />
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <Loader2 size={28} className="animate-spin text-accent mx-auto mb-3" />
            <p className="text-white/40 text-sm">Preparing your interview questions...</p>
          </div>
        )}

        {prep && (
          <>
            {prep.tips.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-amber-400/5 border border-amber-400/15">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={14} className="text-amber-400" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-amber-400/60">Top tips</span>
                </div>
                <ul className="space-y-1.5">
                  {prep.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-white/60 flex gap-2">
                      <span className="text-amber-400 shrink-0">·</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              {sections.map(({ key, label, icon: Icon, color, questions }) => (
                <div key={key} className="border border-white/[0.06] rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggle(key)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={15} className={color} />
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-white/30 ml-1">{questions.length}</span>
                    </div>
                    {expanded === key ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                  </button>

                  {expanded === key && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-3">
                      {questions.map((q, i) => (
                        <div key={i} className="p-3 rounded-xl bg-surface2 border border-white/[0.05]">
                          <p className="text-sm font-medium text-white/80 mb-2">{i + 1}. {q.question}</p>
                          <p className="text-xs text-white/35 leading-relaxed">
                            <span className="text-accent2/60 font-medium">Hint: </span>{q.hint}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
