function sanitize(str) {
  return (str ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

// ── 1. Rekrute.ma (Morocco #1 job board) ─────────────────────────────────────
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
    const titleRegex = /<a[^>]*class="[^"]*offre[^"]*"[^>]*href="([^"]+)"[^>]*>\s*([^<]+)/i
    const companyRegex = /class="[^"]*company[^"]*"[^>]*>\s*([^<]+)/i
    const locationRegex = /Ville\s*:?\s*<[^>]*>([^<]+)/i

    let match
    while ((match = itemRegex.exec(html)) !== null && jobs.length < 10) {
      const block = match[1]
      const titleMatch = titleRegex.exec(block)
      const companyMatch = companyRegex.exec(block)
      const locationMatch = locationRegex.exec(block)
      if (titleMatch) {
        jobs.push({
          title: sanitize(titleMatch[2]),
          company: sanitize(companyMatch?.[1] ?? 'Moroccan Company'),
          location: sanitize(locationMatch?.[1] ?? 'Morocco'),
          description: `Internship opportunity in Morocco. Apply via Rekrute.ma`,
          apply_url: titleMatch[1].startsWith('http') ? titleMatch[1] : `https://www.rekrute.com${titleMatch[1]}`,
          source: 'rekrute',
          scraped_at: new Date().toISOString(),
          is_active: true,
        })
      }
    }
    return jobs
  } catch (e) {
    console.error('Rekrute error:', e.message)
    return []
  }
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
    const blocks = html.match(/<div[^>]+class="[^"]*job[^"]*"[^>]*>[\s\S]*?<\/div>/gi) ?? []

    for (const block of blocks.slice(0, 10)) {
      const titleMatch = block.match(/href="([^"]+)"[^>]*>([^<]{10,80})</)
      const companyMatch = block.match(/class="[^"]*company[^"]*"[^>]*>([^<]+)/)
      if (titleMatch && titleMatch[2].length > 5) {
        jobs.push({
          title: sanitize(titleMatch[2]),
          company: sanitize(companyMatch?.[1] ?? 'Moroccan Company'),
          location: 'Maroc',
          description: `Stage / Internship in Morocco. Apply via Emploi.ma`,
          apply_url: titleMatch[1].startsWith('http') ? titleMatch[1] : `https://www.emploi.ma${titleMatch[1]}`,
          source: 'emploima',
          scraped_at: new Date().toISOString(),
          is_active: true,
        })
      }
    }
    return jobs
  } catch (e) {
    console.error('Emploi.ma error:', e.message)
    return []
  }
}

// ── 3. MarocAnnonces stages ───────────────────────────────────────────────────
export async function scrapeMarocAnnonces(role) {
  try {
    const query = encodeURIComponent(role)
    const res = await fetch(
      `https://www.marocannonces.com/maroc/offres-emploi-b309.html?kw=${query}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InternIQ/1.0)' } }
    )
    if (!res.ok) return []
    const html = await res.text()
    const jobs = []
    const regex = /href="(\/maroc\/[^"]+offre[^"]+\.html)"[^>]*>\s*<[^>]+>\s*([^<]{10,80})/gi
    let m
    while ((m = regex.exec(html)) !== null && jobs.length < 8) {
      jobs.push({
        title: sanitize(m[2]),
        company: 'Moroccan Company',
        location: 'Maroc',
        description: 'Internship/Stage opportunity in Morocco',
        apply_url: `https://www.marocannonces.com${m[1]}`,
        source: 'marocannonces',
        scraped_at: new Date().toISOString(),
        is_active: true,
      })
    }
    return jobs
  } catch (e) {
    console.error('MarocAnnonces error:', e.message)
    return []
  }
}

// ── 4. RemoteOK (international remote) ───────────────────────────────────────
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
  } catch (e) {
    console.error('RemoteOK error:', e.message)
    return []
  }
}

// ── 5. Arbeitnow (Europe + Remote) ───────────────────────────────────────────
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
  } catch (e) {
    console.error('Arbeitnow error:', e.message)
    return []
  }
}

// ── 6. LinkedIn Public Search (no auth needed for search page) ────────────────
export async function scrapeLinkedInPublic(role) {
  try {
    const query = encodeURIComponent(`${role} internship Morocco`)
    const res = await fetch(
      `https://www.linkedin.com/jobs/search/?keywords=${query}&location=Morocco&f_E=1`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      }
    )
    if (!res.ok) return []
    const html = await res.text()
    const jobs = []
    const regex = /data-entity-urn="[^"]*:(\d+)"[\s\S]*?<h3[^>]*>\s*([^<]{5,80})<[\s\S]*?<h4[^>]*>\s*([^<]{3,60})</g
    let m
    while ((m = regex.exec(html)) !== null && jobs.length < 8) {
      jobs.push({
        title: sanitize(m[2]),
        company: sanitize(m[3]),
        location: 'Morocco',
        description: `${sanitize(m[2])} internship opportunity at ${sanitize(m[3])}`,
        apply_url: `https://www.linkedin.com/jobs/view/${m[1]}`,
        source: 'linkedin',
        scraped_at: new Date().toISOString(),
        is_active: true,
      })
    }
    return jobs
  } catch (e) {
    console.error('LinkedIn error:', e.message)
    return []
  }
}

// ── Main Orchestrator ─────────────────────────────────────────────────────────
export async function scrapeAllSources(roles, locations) {
  const role = roles[0] ?? 'software engineer'
  const isMorocco = (locations ?? []).some(l =>
    l.toLowerCase().includes('maroc') || l.toLowerCase().includes('morocco') || l.toLowerCase().includes('rabat') || l.toLowerCase().includes('casablanca')
  )

  console.log(`Scraping: "${role}" | Morocco priority: ${isMorocco}`)

  // Run all scrapers in parallel
  const [rekrute, emploima, marocannonces, linkedin, remoteok, arbeitnow] =
    await Promise.allSettled([
      scrapeRekrute(role),
      scrapeEmploiMa(role),
      scrapeMarocAnnonces(role),
      scrapeLinkedInPublic(role),
      scrapeRemoteOK(role),
      scrapeArbeitnow(role),
    ])

  // Morocco first, then international
  const moroccanJobs = [
    ...(rekrute.status === 'fulfilled' ? rekrute.value : []),
    ...(emploima.status === 'fulfilled' ? emploima.value : []),
    ...(marocannonces.status === 'fulfilled' ? marocannonces.value : []),
    ...(linkedin.status === 'fulfilled' ? linkedin.value : []),
  ]

  const internationalJobs = [
    ...(remoteok.status === 'fulfilled' ? remoteok.value : []),
    ...(arbeitnow.status === 'fulfilled' ? arbeitnow.value : []),
  ]

  // Morocco jobs first always
  const all = [...moroccanJobs, ...internationalJobs]

  // Deduplicate
  const seen = new Set()
  return all.filter(j => {
    if (!j.apply_url || seen.has(j.apply_url)) return false
    seen.add(j.apply_url)
    return true
  })
}
