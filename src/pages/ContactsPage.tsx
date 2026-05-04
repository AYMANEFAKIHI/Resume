import { useState, useMemo, useEffect } from 'react'
import { Search, Mail, Phone, MapPin, Users, Copy, X, ChevronDown, ChevronUp, Star, Loader2 } from 'lucide-react'

interface Contact { name: string; role: string; email: string; phone: string; is_hr: boolean }
interface Company { name: string; city: string; address: string; contacts: Contact[]; contact_count: number; has_email: boolean }

export default function ContactsPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState<string | null>(null)
  const [emailOnly, setEmailOnly] = useState(false)
  const [hrOnly, setHrOnly] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetch('/contacts_db.json')
      .then(r => r.json())
      .then(data => setCompanies(data))
      .catch(() => {})
      .finally(() => setLoadingData(false))
  }, [])

  const ALL_CITIES = useMemo(() =>
    [...new Set(companies.map(c => c.city).filter(Boolean))].sort(), [companies])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return companies.filter(c => {
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) ||
        c.contacts.some(ct => ct.role.toLowerCase().includes(q) || ct.name.toLowerCase().includes(q) || ct.email.toLowerCase().includes(q))
      return matchSearch && (!cityFilter || c.city === cityFilter) &&
        (!emailOnly || c.has_email) && (!hrOnly || c.contacts.some(ct => ct.is_hr))
    })
  }, [companies, search, cityFilter, emailOnly, hrOnly])

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const totalContacts = companies.reduce((s, c) => s + c.contact_count, 0)
  const totalWithEmail = companies.filter(c => c.has_email).length

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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="font-display font-bold text-3xl">Contacts Database 🇲🇦</h1>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
            {companies.length} companies · {totalContacts.toLocaleString()} contacts
          </span>
        </div>
        <p className="text-white/40 text-sm mb-3">Direct contacts at Moroccan companies — reach out personally for internship opportunities.</p>
        <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/15 text-xs text-white/50 leading-relaxed">
          ⚡ <strong className="text-white/70">Pro tip:</strong> Email the HR/RH contact directly with your CV and a short personalized message. A direct email beats any job board application.
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Companies',      value: companies.length, color: 'text-accent2'     },
          { label: 'Total contacts', value: totalContacts,    color: 'text-white'       },
          { label: 'With email',     value: totalWithEmail,   color: 'text-emerald-400' },
          { label: 'Cities',         value: ALL_CITIES.length, color: 'text-amber-400'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center py-4">
            <div className={`font-display font-bold text-2xl ${color} mb-1`}>{value.toLocaleString()}</div>
            <div className="text-white/30 text-xs">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search company, city, role, contact name, email..." className="input pl-10 w-full" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"><X size={14}/></button>}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={() => setEmailOnly(!emailOnly)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-all flex items-center gap-1.5
              ${emailOnly ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-400' : 'bg-surface border-white/[0.07] text-white/40 hover:text-white'}`}>
            <Mail size={11}/> Has email ({totalWithEmail})
          </button>
          <button onClick={() => setHrOnly(!hrOnly)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-all flex items-center gap-1.5
              ${hrOnly ? 'bg-accent/15 border-accent/30 text-accent2' : 'bg-surface border-white/[0.07] text-white/40 hover:text-white'}`}>
            <Star size={11}/> HR/RH contacts only
          </button>
          {(emailOnly || hrOnly || cityFilter) && (
            <button onClick={() => { setEmailOnly(false); setHrOnly(false); setCityFilter(null) }}
              className="px-3 py-1.5 rounded-full text-xs border border-red-400/20 text-red-400 hover:bg-red-400/10 transition-all flex items-center gap-1">
              <X size={11}/> Clear
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-white/25 text-xs shrink-0">🏙️ City:</span>
          <button onClick={() => setCityFilter(null)}
            className={`px-3 py-1 rounded-full text-xs border transition-all
              ${!cityFilter ? 'bg-amber-400/15 border-amber-400/30 text-amber-400' : 'bg-surface border-white/[0.07] text-white/30 hover:text-white'}`}>
            All
          </button>
          {ALL_CITIES.slice(0, 15).map(city => (
            <button key={city} onClick={() => setCityFilter(cityFilter === city ? null : city)}
              className={`px-3 py-1 rounded-full text-xs border transition-all
                ${cityFilter === city ? 'bg-amber-400/15 border-amber-400/30 text-amber-400' : 'bg-surface border-white/[0.07] text-white/30 hover:text-white'}`}>
              {city}
            </button>
          ))}
        </div>
      </div>

      <div className="text-white/30 text-sm mb-4">
        Showing <span className="text-white/60 font-medium">{Math.min(filtered.length, 200)}</span>
        {filtered.length > 200 ? ` of ${filtered.length}` : ''} companies
      </div>

      {/* Company list */}
      <div className="space-y-2">
        {filtered.slice(0, 200).map(company => {
          const isExpanded = expanded === company.name
          const hrContacts = company.contacts.filter(c => c.is_hr)
          const emailContacts = company.contacts.filter(c => c.email)
          const copyKey = 'co-' + company.name

          return (
            <div key={company.name}
              className={`card p-0 overflow-hidden transition-all duration-200 ${isExpanded ? 'border-white/15' : 'hover:border-white/10'}`}>
              <div className="flex items-center justify-between p-4 cursor-pointer gap-3"
                onClick={() => setExpanded(isExpanded ? null : company.name)}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent/20 to-accent2/20 border border-accent/10 flex items-center justify-center shrink-0">
                    <span className="font-display font-bold text-accent2 text-xs">{company.name.slice(0,2).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
                      {company.name}
                      {hrContacts.length > 0 && <span className="px-1.5 py-0.5 rounded text-xs bg-accent/10 text-accent2 border border-accent/20">HR ✓</span>}
                    </div>
                    <div className="flex items-center gap-3 text-white/30 text-xs mt-0.5 flex-wrap">
                      {company.city && <span className="flex items-center gap-1"><MapPin size={10}/>{company.city}</span>}
                      <span className="flex items-center gap-1"><Users size={10}/>{company.contact_count}</span>
                      {emailContacts.length > 0 && <span className="flex items-center gap-1 text-emerald-400/60"><Mail size={10}/>{emailContacts.length} email{emailContacts.length > 1 ? 's' : ''}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {emailContacts.length > 0 && (
                    <button onClick={e => { e.stopPropagation(); const emails = emailContacts.map(c => c.email).join(', '); copyText(emails, copyKey) }}
                      className={`btn btn-sm text-xs py-1 ${copied === copyKey ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-400 border' : 'btn-ghost'}`}>
                      <Copy size={11}/> {copied === copyKey ? 'Copied!' : 'Copy emails'}
                    </button>
                  )}
                  {isExpanded ? <ChevronUp size={14} className="text-white/30"/> : <ChevronDown size={14} className="text-white/30"/>}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-white/[0.06]">
                  {company.address && company.address !== 'nan' && (
                    <div className="px-4 py-2 text-xs text-white/20 flex items-start gap-1.5 bg-white/[0.01]">
                      <MapPin size={10} className="mt-0.5 shrink-0"/> {company.address}
                    </div>
                  )}
                  <div className="divide-y divide-white/[0.04]">
                    {company.contacts.map((contact, i) => {
                      const emailKey = `em-${i}-${company.name}`
                      const phoneKey = `ph-${i}-${company.name}`
                      return (
                        <div key={i} className={`px-4 py-3 flex items-center justify-between gap-3 flex-wrap ${contact.is_hr ? 'bg-accent/[0.03] border-l-2 border-l-accent/20' : ''}`}>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{contact.name}</span>
                              {contact.is_hr && <span className="px-1.5 py-0.5 rounded text-xs bg-accent/10 text-accent2 border border-accent/20">HR/RH</span>}
                            </div>
                            <div className="text-white/35 text-xs mt-0.5">{contact.role}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap shrink-0">
                            {contact.phone && contact.phone !== 'nan' && (
                              <button onClick={() => copyText(contact.phone, phoneKey)}
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all
                                  ${copied === phoneKey ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-400' : 'bg-surface2 border-white/[0.07] text-white/30 hover:text-white'}`}>
                                <Phone size={10}/> {contact.phone}
                              </button>
                            )}
                            {contact.email && contact.email !== 'nan' && (
                              <button onClick={() => copyText(contact.email, emailKey)}
                                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all
                                  ${copied === emailKey ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-400' : 'bg-surface2 border-white/[0.07] text-white/50 hover:text-white hover:border-white/20'}`}>
                                <Mail size={10}/> {copied === emailKey ? 'Copied!' : contact.email}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length > 200 && (
          <div className="text-center py-6 card text-white/30 text-sm">
            Showing 200 of {filtered.length} — refine your search to see more
          </div>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-white/30">
            <Users size={40} className="mx-auto mb-4 opacity-20"/>
            <p>No companies match your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
