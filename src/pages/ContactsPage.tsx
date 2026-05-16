import { useState, useEffect, useCallback } from 'react'
import { Search, Mail, Phone, MapPin, Users, Copy, ChevronDown, ChevronUp, Star, Loader2, Sparkles, Check } from 'lucide-react'
import { generateOutreachEmail } from '../lib/api'
import toast from 'react-hot-toast'

interface Contact { name: string; role: string; email: string; phone: string; is_hr: boolean }
interface Company { name: string; city: string; address: string; contacts: Contact[]; contact_count: number; has_email: boolean }

// ── Pagination constants ──────────────────────────────────────────────────────
const PAGE_SIZE = 60

export default function ContactsPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loadingData, setLoadingData] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [cityFilter, setCityFilter] = useState<string | null>(null)
  const [emailOnly, setEmailOnly] = useState(false)
  const [hrOnly, setHrOnly] = useState(false)

  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Outreach state: key = `${company.name}:${contact.name}`
  const [outreachLoading, setOutreachLoading] = useState<string | null>(null)
  const [outreachEmail, setOutreachEmail] = useState<{ key: string; text: string } | null>(null)
  const [outreachCopied, setOutreachCopied] = useState(false)

  // All cities for filter — loaded once from full dataset
  const [allCities, setAllCities] = useState<string[]>([])

  // ── Debounce search ───────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // ── Reset page on filter change ───────────────────────────────────────────
  useEffect(() => {
    setPage(0)
    setCompanies([])
  }, [debouncedSearch, cityFilter, emailOnly, hrOnly])

  // ── Load data (client-side from contacts_db.json, paginated in memory) ────
  // NOTE: If you've migrated contacts_db.json to Supabase (see migration SQL),
  // replace this with an API call to /api/contacts?search=...&page=...
  // For now this loads the JSON once and filters/paginates in memory.
  const [allData, setAllData] = useState<Company[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    fetch('/contacts_db.json')
      .then(r => r.json())
      .then((data: Company[]) => {
        setAllData(data)
        const cities = [...new Set(data.map(c => c.city).filter(Boolean))].sort()
        setAllCities(cities)
        setDataLoaded(true)
      })
      .catch(() => toast.error('Failed to load contacts'))
      .finally(() => setLoadingData(false))
  }, [])

  // ── Filter + paginate in memory ───────────────────────────────────────────
  useEffect(() => {
    if (!dataLoaded) return
    const q = debouncedSearch.toLowerCase().trim()
    const filtered = allData.filter(c => {
      const matchSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.contacts.some(ct =>
          ct.role.toLowerCase().includes(q) ||
          ct.name.toLowerCase().includes(q) ||
          ct.email.toLowerCase().includes(q)
        )
      return (
        matchSearch &&
        (!cityFilter || c.city === cityFilter) &&
        (!emailOnly || c.has_email) &&
        (!hrOnly || c.contacts.some(ct => ct.is_hr))
      )
    })
    setTotal(filtered.length)
    setCompanies(filtered.slice(0, (page + 1) * PAGE_SIZE))
  }, [allData, dataLoaded, debouncedSearch, cityFilter, emailOnly, hrOnly, page])

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleGenerateOutreach(contact: Contact, company: Company) {
    const key = `${company.name}:${contact.name}`
    setOutreachLoading(key)
    setOutreachEmail(null)
    try {
      const res = await generateOutreachEmail(contact, company)
      setOutreachEmail({ key, text: res.email })
    } catch {
      toast.error('Failed to generate outreach email')
    } finally {
      setOutreachLoading(null)
    }
  }

  function copyOutreach() {
    if (!outreachEmail) return
    navigator.clipboard.writeText(outreachEmail.text)
    setOutreachCopied(true)
    setTimeout(() => setOutreachCopied(false), 2000)
  }

  const totalContacts = allData.reduce((s, c) => s + c.contact_count, 0)
  const totalWithEmail = allData.filter(c => c.has_email).length
  const hasMore = companies.length < total

  if (loadingData) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 size={28} className="animate-spin text-accent mx-auto mb-3" />
        <p className="text-white/40 text-sm">Loading contacts database...</p>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="font-display font-bold text-3xl">Contacts Database 🇲🇦</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-white/40 flex-wrap">
          <span className="flex items-center gap-1.5"><Users size={13} /> {allData.length} companies</span>
          <span className="flex items-center gap-1.5"><Mail size={13} /> {totalContacts.toLocaleString()} contacts</span>
          <span className="flex items-center gap-1.5"><Star size={13} /> {totalWithEmail} with email</span>
        </div>
      </div>

      {/* Search & filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-60">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company, role, name, email..."
            className="input pl-10"
          />
        </div>

        <select
          value={cityFilter ?? ''}
          onChange={e => setCityFilter(e.target.value || null)}
          className="input w-40"
        >
          <option value="">All cities</option>
          {allCities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button
          onClick={() => setEmailOnly(v => !v)}
          className={`btn btn-sm ${emailOnly ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Mail size={13} /> Email only
        </button>

        <button
          onClick={() => setHrOnly(v => !v)}
          className={`btn btn-sm ${hrOnly ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Star size={13} /> HR only
        </button>
      </div>

      {/* Results count */}
      <p className="text-xs text-white/30 mb-4">
        Showing {companies.length} of {total} companies
        {debouncedSearch && ` matching "${debouncedSearch}"`}
      </p>

      {/* Company cards */}
      <div className="space-y-3">
        {companies.map((company) => (
          <div key={company.name} className="card">
            {/* Company header row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-display font-semibold text-base">{company.name}</h3>
                  {company.has_email && (
                    <span className="tag-green text-xs">has email</span>
                  )}
                  {company.contacts.some(c => c.is_hr) && (
                    <span className="tag-accent text-xs">HR contact</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/35 flex-wrap">
                  {company.city && (
                    <span className="flex items-center gap-1"><MapPin size={11} />{company.city}</span>
                  )}
                  <span className="flex items-center gap-1"><Users size={11} />{company.contact_count} contact{company.contact_count !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <button
                onClick={() => setExpanded(prev => prev === company.name ? null : company.name)}
                className="btn btn-ghost btn-sm shrink-0"
              >
                {expanded === company.name ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {expanded === company.name ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Expanded contacts */}
            {expanded === company.name && (
              <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                {company.contacts.map((contact, i) => {
                  const outreachKey = `${company.name}:${contact.name}`
                  const isGenerating = outreachLoading === outreachKey
                  const hasOutreach = outreachEmail?.key === outreachKey

                  return (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white/80">{contact.name}</span>
                            {contact.is_hr && <span className="tag-accent text-xs">HR</span>}
                          </div>
                          <div className="text-xs text-white/35 mb-2">{contact.role}</div>
                          <div className="flex flex-wrap gap-2">
                            {contact.email && (
                              <button
                                onClick={() => copyText(contact.email, `email-${i}-${company.name}`)}
                                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
                              >
                                {copied === `email-${i}-${company.name}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                {contact.email}
                              </button>
                            )}
                            {contact.phone && (
                              <button
                                onClick={() => copyText(contact.phone, `phone-${i}-${company.name}`)}
                                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
                              >
                                {copied === `phone-${i}-${company.name}` ? <Check size={11} className="text-emerald-400" /> : <Phone size={11} />}
                                {contact.phone}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Outreach generator button */}
                        <button
                          onClick={() => handleGenerateOutreach(contact, company)}
                          disabled={isGenerating}
                          className="btn btn-ghost btn-sm shrink-0 flex items-center gap-1.5"
                        >
                          {isGenerating
                            ? <><Loader2 size={12} className="animate-spin" /> Generating...</>
                            : <><Sparkles size={12} className="text-accent2" /> Outreach email</>
                          }
                        </button>
                      </div>

                      {/* Generated outreach email */}
                      {hasOutreach && (
                        <div className="mt-3 p-3 rounded-xl bg-accent/5 border border-accent/15">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-accent2 font-medium">Generated outreach email</span>
                            <button
                              onClick={copyOutreach}
                              className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors"
                            >
                              {outreachCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                              {outreachCopied ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed whitespace-pre-line">{outreachEmail.text}</p>
                          <div className="flex gap-2 mt-2">
                            {contact.email && (
                              <a
                                href={`mailto:${contact.email}?subject=Candidature%20stage&body=${encodeURIComponent(outreachEmail.text)}`}
                                className="btn btn-sm btn-primary text-xs"
                              >
                                <Mail size={11} /> Open in mail
                              </a>
                            )}
                            <button
                              onClick={() => setOutreachEmail(null)}
                              className="btn btn-ghost btn-sm text-xs"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={loadingMore}
            className="btn btn-secondary"
          >
            {loadingMore ? <Loader2 size={14} className="animate-spin" /> : null}
            Load more ({total - companies.length} remaining)
          </button>
        </div>
      )}

      {!hasMore && companies.length > 0 && (
        <p className="text-center text-xs text-white/20 mt-8">All {total} companies shown</p>
      )}

      {total === 0 && !loadingData && (
        <div className="text-center py-16">
          <Users size={40} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/40">No companies match your filters.</p>
          <button onClick={() => { setSearch(''); setCityFilter(null); setEmailOnly(false); setHrOnly(false) }} className="btn btn-ghost btn-sm mt-3">
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
