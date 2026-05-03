import { useState, useMemo } from 'react'
import { Search, ExternalLink, Linkedin, Building2, MapPin, Tag, X } from 'lucide-react'
import { MOROCCAN_COMPANIES, ALL_SECTORS, ALL_TAGS, type Company } from '../data/companies'

const SIZE_CONFIG = {
  Large:  { color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',  label: 'Large'  },
  Medium: { color: 'bg-blue-400/10 text-blue-400 border-blue-400/20',           label: 'Medium' },
  Small:  { color: 'bg-accent/10 text-accent2 border-accent/20',                label: 'Startup'},
}

export default function CompaniesPage() {
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [sizeFilter, setSizeFilter] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return MOROCCAN_COMPANIES.filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q))
      const matchSector = !sectorFilter || c.sector === sectorFilter
      const matchTag = !tagFilter || c.tags.includes(tagFilter)
      const matchSize = !sizeFilter || c.size === sizeFilter
      return matchSearch && matchSector && matchTag && matchSize
    })
  }, [search, sectorFilter, tagFilter, sizeFilter])

  function clearFilters() {
    setSearch('')
    setSectorFilter(null)
    setTagFilter(null)
    setSizeFilter(null)
  }

  const hasFilters = search || sectorFilter || tagFilter || sizeFilter

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-display font-bold text-3xl">Top Companies 🇲🇦</h1>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-400/10 border border-amber-400/20 text-amber-400">
            {MOROCCAN_COMPANIES.length} companies
          </span>
        </div>
        <p className="text-white/40 text-sm">
          Moroccan companies known to hire interns. Visit their careers page or LinkedIn and apply directly.
        </p>
        <div className="mt-3 p-3 rounded-xl bg-accent/5 border border-accent/15 text-xs text-white/40 leading-relaxed">
          💡 This list was curated by the Moroccan student community. These companies <strong className="text-white/60">may</strong> hire interns — always reach out directly and follow up.
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3 mb-6">
        {/* Search bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search companies, sectors, skills..."
            className="input pl-10 w-full"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Size filter */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-white/25 text-xs shrink-0">Size:</span>
          {[null, 'Large', 'Medium', 'Small'].map(s => (
            <button key={s ?? 'all'} onClick={() => setSizeFilter(s)}
              className={`px-3 py-1 rounded-full text-xs border transition-all
                ${sizeFilter === s ? 'bg-accent/15 border-accent/30 text-accent2' : 'bg-surface border-white/[0.07] text-white/35 hover:text-white'}`}>
              {s === null ? 'All' : s === 'Small' ? 'Startup' : s}
            </button>
          ))}
        </div>

        {/* Sector filter */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-white/25 text-xs shrink-0">Sector:</span>
          <button onClick={() => setSectorFilter(null)}
            className={`px-3 py-1 rounded-full text-xs border transition-all
              ${!sectorFilter ? 'bg-accent/15 border-accent/30 text-accent2' : 'bg-surface border-white/[0.07] text-white/35 hover:text-white'}`}>
            All
          </button>
          {ALL_SECTORS.slice(0, 12).map(s => (
            <button key={s} onClick={() => setSectorFilter(sectorFilter === s ? null : s)}
              className={`px-3 py-1 rounded-full text-xs border transition-all
                ${sectorFilter === s ? 'bg-accent/15 border-accent/30 text-accent2' : 'bg-surface border-white/[0.07] text-white/35 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Tag filter */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-white/25 text-xs shrink-0">Skills:</span>
          {ALL_TAGS.slice(0, 15).map(t => (
            <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)}
              className={`px-3 py-1 rounded-full text-xs border transition-all
                ${tagFilter === t ? 'bg-amber-400/15 border-amber-400/30 text-amber-400' : 'bg-surface border-white/[0.07] text-white/35 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors">
            <X size={12} /> Clear all filters ({filtered.length} results)
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="text-white/30 text-sm mb-4">
        Showing <span className="text-white/60 font-medium">{filtered.length}</span> of {MOROCCAN_COMPANIES.length} companies
      </div>

      {/* Company grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(company => (
            <CompanyCard key={company.name} company={company} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-white/30">
          <Building2 size={40} className="mx-auto mb-4 opacity-20" />
          <p>No companies match your search.</p>
          <button onClick={clearFilters} className="mt-3 text-accent2 text-sm hover:underline">Clear filters</button>
        </div>
      )}
    </div>
  )
}

function CompanyCard({ company }: { company: Company }) {
  const sizeCfg = SIZE_CONFIG[company.size as keyof typeof SIZE_CONFIG] ?? SIZE_CONFIG.Small

  return (
    <div className="card hover:border-white/15 transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/20 to-accent2/20 border border-accent/15 flex items-center justify-center shrink-0">
          <span className="font-display font-bold text-accent2 text-sm">
            {company.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${sizeCfg.color}`}>
          {sizeCfg.label}
        </span>
      </div>

      {/* Name + Sector */}
      <h3 className="font-semibold text-sm mb-1 leading-tight">{company.name}</h3>
      <div className="text-xs text-accent2 mb-1">{company.sector}</div>
      <div className="flex items-center gap-1 text-white/30 text-xs mb-3">
        <MapPin size={10} /> {company.location}
      </div>

      {/* Description */}
      <p className="text-white/40 text-xs leading-relaxed mb-4 flex-1">{company.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {company.tags.slice(0, 4).map(tag => (
          <span key={tag} className="tag text-xs">{tag}</span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        {company.careers_url && (
          <a href={company.careers_url} target="_blank" rel="noopener noreferrer"
            className="btn btn-primary btn-sm flex-1 justify-center">
            <ExternalLink size={12} /> Careers page
          </a>
        )}
        {company.linkedin_url && (
          <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer"
            className="btn btn-secondary btn-sm px-3">
            <Linkedin size={12} />
          </a>
        )}
      </div>
    </div>
  )
}
