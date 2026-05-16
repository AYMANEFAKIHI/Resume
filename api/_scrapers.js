import { logScraperHealth } from './_db.js'

function sanitize(str) {
  return (str ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function makeJob(title, company, location, description, url, source) {
  return {
    title: sanitize(title),
    company: sanitize(company),
    location: sanitize(location),
    description: sanitize(description).slice(0, 800),
    apply_url: url,
    source,
    scraped_at: new Date().toISOString(),
    is_active: true,
  }
}

async function fetchHTML(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-MA,fr;q=0.9,en;q=0.8',
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

// Wraps a scraper function with health logging
async function withHealth(source, fn) {
  try {
    const jobs = await fn()
    await logScraperHealth(source, jobs.length, true)
    return jobs
  } catch (e) {
    console.error(`[SCRAPER FAIL] ${source}:`, e.message)
    await logScraperHealth(source, 0, false)
    return []
  }
}

// ── 1. Rekrute.ma ─────────────────────────────────────────────────────────────
export async function scrapeRekrute(role) {
  return withHealth('rekrute', async () => {
    const html = await fetchHTML(`https://www.rekrute.com/offres.html?s=3&p=1&query=${encodeURIComponent(role)}`)
    const jobs = []
    const itemRegex = /<li class="post-id[^"]*"[^>]*>([\s\S]*?)<\/li>/g
    const titleRegex = /<a[^>]*href="([^"]+)"[^>]*>\s*([^<]{5,80})/i
    const companyRegex = /class="[^"]*company[^"]*"[^>]*>\s*([^<]+)/i
    const locationRegex = /Ville\s*:?\s*<[^>]*>([^<]+)/i
    let m
    while ((m = itemRegex.exec(html)) !== null && jobs.length < 12) {
      const b = m[1], t = titleRegex.exec(b), c = companyRegex.exec(b), l = locationRegex.exec(b)
      if (t && t[2].length > 5)
        jobs.push(makeJob(t[2], c?.[1] ?? 'Moroccan Company', l?.[1] ?? 'Maroc',
          'Internship via Rekrute.ma', t[1].startsWith('http') ? t[1] : `https://www.rekrute.com${t[1]}`, 'rekrute'))
    }
    return jobs
  })
}

// ── 2. Emploi.ma ──────────────────────────────────────────────────────────────
export async function scrapeEmploiMa(role) {
  return withHealth('emploima', async () => {
    const html = await fetchHTML(`https://www.emploi.ma/recherche-jobs-maroc/${encodeURIComponent(role + ' stage')}`)
    const jobs = []
    const regex = /href="(\/offre-emploi[^"]+)"[^>]*>\s*<[^>]+>\s*([^<]{10,80})/gi
    let m
    while ((m = regex.exec(html)) !== null && jobs.length < 10)
      jobs.push(makeJob(m[2], 'Moroccan Company', 'Maroc', 'Stage via Emploi.ma', `https://www.emploi.ma${m[1]}`, 'emploima'))
    return jobs
  })
}

// ── 3. Stagiaire.ma ───────────────────────────────────────────────────────────
export async function scrapeStagiaireMa(role) {
  return withHealth('stagiairema', async () => {
    const html = await fetchHTML(`https://www.stagiaire.ma/offres-de-stage/?s=${encodeURIComponent(role)}`)
    const jobs = []
    const regex = /href="(https:\/\/www\.stagiaire\.ma\/offre[^"]+)"[^>]*>\s*(?:<[^>]*>\s*)*([^<]{5,80})/gi
    let m
    while ((m = regex.exec(html)) !== null && jobs.length < 10)
      if (m[2].trim().length > 4)
        jobs.push(makeJob(m[2], 'Moroccan Company', 'Maroc', 'Stage via Stagiaire.ma', m[1], 'stagiairema'))
    return jobs
  })
}

// ── 4. Tanmia.ma ──────────────────────────────────────────────────────────────
export async function scrapeTanmiaMa(role) {
  return withHealth('tanmiama', async () => {
    const html = await fetchHTML(`https://www.tanmia.ma/offres-demploi/?search=${encodeURIComponent(role)}`)
    const jobs = []
    const regex = /href="(https:\/\/www\.tanmia\.ma\/offre[^"]+)"[^>]*>\s*(?:<[^>]*>\s*)*([^<]{5,80})/gi
    let m
    while ((m = regex.exec(html)) !== null && jobs.length < 8)
      jobs.push(makeJob(m[2], 'Moroccan Company', 'Maroc', 'Stage via Tanmia.ma', m[1], 'tanmiama'))
    return jobs
  })
}

// ── 5. OptionCarriere.ma ──────────────────────────────────────────────────────
export async function scrapeOptionCarriere(role) {
  return withHealth('optioncarriere', async () => {
    const html = await fetchHTML(`https://www.optioncarriere.ma/emploi.php?s=${encodeURIComponent(role + ' stage')}&l=Maroc`)
    const jobs = []
    const regex = /href="(\/job[^"]+)"[^>]*class="[^"]*title[^"]*"[^>]*>\s*([^<]{5,80})/gi
    let m
    while ((m = regex.exec(html)) !== null && jobs.length < 8)
      jobs.push(makeJob(m[2], 'Moroccan Company', 'Maroc', 'Stage via OptionCarriere.ma', `https://www.optioncarriere.ma${m[1]}`, 'optioncarriere'))
    return jobs
  })
}

// ── 6. Khdma.ma ───────────────────────────────────────────────────────────────
export async function scrapeKhdmaMa(role) {
  return withHealth('khdmama', async () => {
    const html = await fetchHTML(`https://www.khdma.ma/offres-emploi/recherche?query=${encodeURIComponent(role + ' stage')}`)
    const jobs = []
    const regex = /href="(\/offres-emploi\/[^"]+)"[^>]*>\s*(?:<[^>]*>\s*)*([^<]{5,80})/gi
    let m
    while ((m = regex.exec(html)) !== null && jobs.length < 8)
      if (!m[1].includes('recherche') && m[2].trim().length > 4)
        jobs.push(makeJob(m[2], 'Moroccan Company', 'Maroc', 'Stage via Khdma.ma', `https://www.khdma.ma${m[1]}`, 'khdmama'))
    return jobs
  })
}

// ── 7. Dreamjob.ma ────────────────────────────────────────────────────────────
export async function scrapeDreamjobMa(role) {
  return withHealth('dreamjobma', async () => {
    const html = await fetchHTML(`https://www.dreamjob.ma/offres-emploi?q=${encodeURIComponent(role + ' stage')}`)
    const jobs = []
    const regex = /href="(https:\/\/www\.dreamjob\.ma\/offre[^"]+)"[^>]*>\s*(?:<[^>]*>\s*)*([^<]{5,80})/gi
    let m
    while ((m = regex.exec(html)) !== null && jobs.length < 8)
      if (m[2].trim().length > 4)
        jobs.push(makeJob(m[2], 'Moroccan Company', 'Maroc', 'Stage via Dreamjob.ma', m[1], 'dreamjobma'))
    return jobs
  })
}

// ── 8. Menara Emploi ──────────────────────────────────────────────────────────
export async function scrapeMenaraEmploi(role) {
  return withHealth('menaraemploi', async () => {
    const html = await fetchHTML(`https://emploi.menara.ma/recherche?motcle=${encodeURIComponent(role)}&type=stage`)
    const jobs = []
    const regex = /href="(\/offre[^"]+)"[^>]*>\s*(?:<[^>]*>\s*)*([^<]{5,80})/gi
    let m
    while ((m = regex.exec(html)) !== null && jobs.length < 8)
      if (m[2].trim().length > 4)
        jobs.push(makeJob(m[2], 'Moroccan Company', 'Maroc', 'Stage via Menara Emploi', `https://emploi.menara.ma${m[1]}`, 'menaraemploi'))
    return jobs
  })
}

// ── 9. MarocAnnonces ──────────────────────────────────────────────────────────
export async function scrapeMarocAnnonces(role) {
  return withHealth('marocannonces', async () => {
    const html = await fetchHTML(`https://www.marocannonces.com/maroc/offres-emploi-b309.html?kw=${encodeURIComponent(role)}`)
    const jobs = []
    const regex = /href="(\/maroc\/[^"]+offre[^"]+\.html)"[^>]*>\s*<[^>]+>\s*([^<]{10,80})/gi
    let m
    while ((m = regex.exec(html)) !== null && jobs.length < 8)
      jobs.push(makeJob(m[2], 'Moroccan Company', 'Maroc', 'Stage via MarocAnnonces', `https://www.marocannonces.com${m[1]}`, 'marocannonces'))
    return jobs
  })
}

// ── 10. LinkedIn Morocco ──────────────────────────────────────────────────────
export async function scrapeLinkedInMorocco(role) {
  return withHealth('linkedin', async () => {
    const query = encodeURIComponent(`${role} internship`)
    const html = await fetchHTML(`https://www.linkedin.com/jobs/search/?keywords=${query}&location=Morocco&f_E=1&f_JT=I`)
    const jobs = []
    const regex = /data-entity-urn="[^"]*:(\d+)"[\s\S]*?<h3[^>]*>\s*([^<]{5,80})<[\s\S]*?<h4[^>]*>\s*([^<]{3,60})</g
    let m
    while ((m = regex.exec(html)) !== null && jobs.length < 8)
      jobs.push(makeJob(m[2], m[3], 'Morocco', `${sanitize(m[2])} at ${sanitize(m[3])} — LinkedIn Morocco`,
        `https://www.linkedin.com/jobs/view/${m[1]}`, 'linkedin'))
    return jobs
  })
}

// ── 11. Glassdoor ─────────────────────────────────────────────────────────────
export async function scrapeGlassdoor(role) {
  return withHealth('glassdoor', async () => {
    const res = await fetch(
      `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(role + ' intern')}&locT=N&locId=0&jobType=internship&fromAge=7&format=rss`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InternIQ/1.0)', 'Accept': 'application/rss+xml' }, signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const xml = await res.text()
    return (xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []).slice(0, 8).map(item => {
      const get = tag => { const m = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`)); return sanitize(m?.[1] ?? '') }
      return makeJob(get('title'), get('author') || get('source') || 'Company', get('location') || 'Remote',
        get('description'), get('link') || get('guid'), 'glassdoor')
    }).filter(j => j.title && j.apply_url)
  })
}

// ── 12. RemoteOK ──────────────────────────────────────────────────────────────
export async function scrapeRemoteOK(role) {
  return withHealth('remoteok', async () => {
    const res = await fetch('https://remoteok.com/api', { headers: { 'User-Agent': 'InternIQ/1.0' }, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    const kw = role.toLowerCase()
    return (Array.isArray(data) ? data.slice(1) : [])
      .filter(j => { const t = String(j.position ?? '').toLowerCase(), g = Array.isArray(j.tags) ? j.tags.join(' ').toLowerCase() : ''; return (t.includes(kw) || g.includes(kw)) && (t.includes('intern') || t.includes('junior') || t.includes('entry')) })
      .slice(0, 8)
      .map(j => makeJob(j.position, j.company, 'Remote', sanitize(j.description), String(j.url ?? `https://remoteok.com/jobs/${j.id}`), 'remoteok'))
  })
}

// ── 13. Arbeitnow ─────────────────────────────────────────────────────────────
export async function scrapeArbeitnow(role) {
  return withHealth('arbeitnow', async () => {
    const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(role + ' intern')}`,
      { headers: { 'User-Agent': 'InternIQ/1.0' }, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data ?? []).slice(0, 8)
      .map(j => makeJob(j.title, j.company_name, j.remote ? 'Remote' : j.location, sanitize(j.description), String(j.url ?? ''), 'arbeitnow'))
      .filter(j => j.apply_url)
  })
}

// ── Main orchestrator ─────────────────────────────────────────────────────────
export async function scrapeAllSources(roles, locations) {
  const role = roles[0] ?? 'software engineer'
  console.log(`[SCRAPE] Starting "${role}" across 13 sources`)

  const results = await Promise.allSettled([
    scrapeRekrute(role),
    scrapeEmploiMa(role),
    scrapeStagiaireMa(role),
    scrapeTanmiaMa(role),
    scrapeOptionCarriere(role),
    scrapeKhdmaMa(role),
    scrapeDreamjobMa(role),
    scrapeMenaraEmploi(role),
    scrapeMarocAnnonces(role),
    scrapeLinkedInMorocco(role),
    scrapeGlassdoor(role),
    scrapeRemoteOK(role),
    scrapeArbeitnow(role),
  ])

  const all = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
  console.log(`[SCRAPE] Total scraped: ${all.length}`)

  const seen = new Set()
  return all.filter(j => {
    if (!j.apply_url || !j.title || seen.has(j.apply_url)) return false
    seen.add(j.apply_url)
    return true
  })
}

// ── Targeted company search ───────────────────────────────────────────────────
export async function scrapeTargetedCompanies(role, companyNames) {
  const jobs = []
  for (const company of companyNames.slice(0, 5)) {
    try {
      const query = encodeURIComponent(`${role} intern ${company}`)
      const res = await fetch(
        `https://www.linkedin.com/jobs/search/?keywords=${query}&location=Morocco&f_JT=I`,
        { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, signal: AbortSignal.timeout(5000) }
      )
      if (!res.ok) continue
      const html = await res.text()
      const regex = /data-entity-urn="[^"]*:(\d+)"[\s\S]*?<h3[^>]*>\s*([^<]{5,80})<[\s\S]*?<h4[^>]*>\s*([^<]{3,60})</g
      let m
      while ((m = regex.exec(html)) !== null && jobs.length < 3) {
        if (m[3].toLowerCase().includes(company.toLowerCase().slice(0, 5))) {
          jobs.push(makeJob(m[2], m[3], 'Morocco',
            `${sanitize(m[2])} internship at ${sanitize(m[3])}`,
            `https://www.linkedin.com/jobs/view/${m[1]}`, 'linkedin'))
        }
      }
    } catch {}
  }
  return jobs
}
