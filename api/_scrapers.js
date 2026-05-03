function sanitize(str) {
  return (str ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

// ── 1. Rekrute.ma ─────────────────────────────────────────────────────────────
export async function scrapeRekrute(role) {
  try {
    const query = encodeURIComponent(role)
    const res = await fetch(
      `https://www.rekrute.com/offres.html?s=3&p=1&query=${query}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InternIQ/1.0)' } }
    )
    if (!res.ok) return []
    const html = await res.text()
    const jobs = []
    const itemRegex = /<li class="post-id[^"]*"[^>]*>([\s\S]*?)<\/li>/g
    const titleRegex = /<a[^>]*href="([^"]+)"[^>]*>\s*([^<]{5,80})/i
    const companyRegex = /class="[^"]*company[^"]*"[^>]*>\s*([^<]+)/i
    let match
    while ((match = itemRegex.exec(html)) !== null && jobs.length < 10) {
      const block = match[1]
      const t = titleRegex.exec(block)
      const c = companyRegex.exec(block)
      if (t && t[2].length > 5) {
        jobs.push({
          title: sanitize(t[2]),
          company: sanitize(c?.[1] ?? 'Moroccan Company'),
          location: 'Maroc',
          description: 'Internship opportunity in Morocco via Rekrute.ma',
          apply_url: t[1].startsWith('http') ? t[1] : `https://www.rekrute.com${t[1]}`,
          source: 'rekrute',
          scraped_at: new Date().toISOString(),
          is_active: true,
        })
      }
    }
    return jobs
  } catch (e) { console.error('Rekrute:', e.message); return [] }
}

// ── 2. Emploi.ma ──────────────────────────────────────────────────────────────
export async function scrapeEmploiMa(role) {
  try {
    const query = encodeURIComponent(role + ' stage')
    const res = await fetch(
      `https://www.emploi.ma/recherche-jobs-maroc/${query}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InternIQ/1.0)' } }
    )
    if (!res.ok) return []
    const html = await res.text()
    const jobs = []
    const regex = /href="(\/offre-emploi[^"]+)"[^>]*>\s*<[^>]+>\s*([^<]{10,80})/gi
    let m
    while ((m = regex.exec(html)) !== null && jobs.length < 10) {
      jobs.push({
        title: sanitize(m[2]),
        company: 'Moroccan Company',
        location: 'Maroc',
        description: 'Stage / Internship in Morocco via Emploi.ma',
        apply_url: `https://www.emploi.ma${m[1]}`,
        source: 'emploima',
        scraped_at: new Date().toISOString(),
        is_active: true,
      })
    }
    return jobs
  } catch (e) { console.error('Emploi.ma:', e.message); return [] }
}

// ── 3. Glassdoor RSS (public, no auth) ───────────────────────────────────────
export async function scrapeGlassdoor(role) {
  try {
    const query = encodeURIComponent(`${role} intern`)
    const res = await fetch(
      `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${query}&locT=N&locId=0&jobType=internship&fromAge=7&format=rss`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; InternIQ/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        }
      }
    )
    if (!res.ok) return []
    const xml = await res.text()
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []

    return items.slice(0, 10).map(item => {
      const get = (tag) => {
        const m = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`))
        return sanitize(m?.[1] ?? '')
      }
      return {
        title: get('title'),
        company: get('author') || get('source') || 'Company',
        location: get('location') || 'Remote',
        description: get('description').slice(0, 800),
        apply_url: get('link') || get('guid'),
        source: 'glassdoor',
        scraped_at: new Date().toISOString(),
        is_active: true,
      }
    }).filter(j => j.title && j.apply_url)
  } catch (e) { console.error('Glassdoor:', e.message); return [] }
}

// ── 4. RemoteOK ───────────────────────────────────────────────────────────────
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
        description: sanitize(j.description).slice(0, 800),
        apply_url: String(j.url ?? `https://remoteok.com/jobs/${j.id}`),
        source: 'remoteok',
        tags: Array.isArray(j.tags) ? j.tags.slice(0, 6) : [],
        scraped_at: new Date().toISOString(),
        is_active: true,
      }))
  } catch (e) { console.error('RemoteOK:', e.message); return [] }
}

// ── 5. Arbeitnow ──────────────────────────────────────────────────────────────
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
      description: sanitize(j.description).slice(0, 800),
      apply_url: String(j.url ?? ''),
      source: 'arbeitnow',
      tags: Array.isArray(j.tags) ? j.tags.slice(0, 6) : [],
      scraped_at: new Date().toISOString(),
      is_active: true,
    })).filter(j => j.apply_url)
  } catch (e) { console.error('Arbeitnow:', e.message); return [] }
}

// ── Main Orchestrator ─────────────────────────────────────────────────────────
export async function scrapeAllSources(roles, locations) {
  const role = roles[0] ?? 'software engineer'
  console.log(`Scraping: "${role}"`)

  const [rekrute, emploima, glassdoor, remoteok, arbeitnow] =
    await Promise.allSettled([
      scrapeRekrute(role),
      scrapeEmploiMa(role),
      scrapeGlassdoor(role),
      scrapeRemoteOK(role),
      scrapeArbeitnow(role),
    ])

  // Morocco first, then international
  const all = [
    ...(rekrute.status === 'fulfilled' ? rekrute.value : []),
    ...(emploima.status === 'fulfilled' ? emploima.value : []),
    ...(glassdoor.status === 'fulfilled' ? glassdoor.value : []),
    ...(remoteok.status === 'fulfilled' ? remoteok.value : []),
    ...(arbeitnow.status === 'fulfilled' ? arbeitnow.value : []),
  ]

  // Deduplicate
  const seen = new Set()
  return all.filter(j => {
    if (!j.apply_url || seen.has(j.apply_url)) return false
    seen.add(j.apply_url)
    return true
  })
}
