function sanitize(str) {
  return (str ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

export async function scrapeRemoteOK(role) {
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'InternIQ/1.0' }
    })
    if (!res.ok) return []
    const data = await res.json()
    const jobs = Array.isArray(data) ? data.slice(1) : []
    const kw = role.toLowerCase()
    return jobs
      .filter(j => {
        const title = String(j.position ?? '').toLowerCase()
        const tags = Array.isArray(j.tags) ? j.tags.join(' ').toLowerCase() : ''
        return (title.includes(kw) || tags.includes(kw)) &&
          (title.includes('intern') || title.includes('junior') || title.includes('entry'))
      })
      .slice(0, 8)
      .map(j => ({
        title: sanitize(j.position),
        company: sanitize(j.company),
        location: 'Remote',
        description: sanitize(j.description).slice(0, 1000),
        apply_url: String(j.url ?? `https://remoteok.com/jobs/${j.id}`),
        source: 'remoteok',
        tags: Array.isArray(j.tags) ? j.tags.slice(0, 6) : [],
        scraped_at: new Date().toISOString(),
        is_active: true,
      }))
  } catch { return [] }
}

export async function scrapeArbeitnow(role) {
  try {
    const res = await fetch(
      `https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(role + ' intern')}`,
      { headers: { 'User-Agent': 'InternIQ/1.0' } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.data ?? []).slice(0, 8).map(j => ({
      title: sanitize(j.title),
      company: sanitize(j.company_name),
      location: j.remote ? 'Remote' : sanitize(j.location),
      description: sanitize(j.description).slice(0, 1000),
      apply_url: String(j.url ?? ''),
      source: 'arbeitnow',
      tags: Array.isArray(j.tags) ? j.tags.slice(0, 6) : [],
      scraped_at: new Date().toISOString(),
      is_active: true,
    })).filter(j => j.apply_url)
  } catch { return [] }
}

export async function scrapeAllSources(roles, locations) {
  const role = roles[0] ?? 'software engineer'
  console.log(`Scraping: "${role}"`)
  const [a, b] = await Promise.allSettled([
    scrapeRemoteOK(role),
    scrapeArbeitnow(role),
  ])
  const all = [
    ...(a.status === 'fulfilled' ? a.value : []),
    ...(b.status === 'fulfilled' ? b.value : []),
  ]
  const seen = new Set()
  return all.filter(j => {
    if (!j.apply_url || seen.has(j.apply_url)) return false
    seen.add(j.apply_url)
    return true
  })
}
