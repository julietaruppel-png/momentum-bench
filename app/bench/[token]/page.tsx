'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Candidate } from '@/lib/types'

function initials(c: Candidate) {
  return `${c.first_name?.[0] ?? ''}${c.last_name?.[0] ?? ''}`.toUpperCase()
}

function detectRegion(c: Candidate): string {
  if (c.is_us_based) return 'US'
  const loc = (c.location ?? '').toLowerCase()
  const canada = ['toronto', 'vancouver', 'montreal', 'calgary', 'ottawa', 'canada']
  const europe = ['london', 'amsterdam', 'berlin', 'paris', 'madrid', 'rome', 'lisbon', 'italy', 'spain', 'france', 'portugal', 'netherlands', 'germany', 'uk', 'europe', 'ireland']
  const asia = ['india', 'pakistan', 'philippines', 'indonesia', 'singapore', 'delhi', 'mumbai', 'bangalore', 'karachi', 'lahore', 'manila', 'chennai', 'hyderabad', 'pune', 'kolkata', 'cebu', 'asia', 'noida', 'rawalpindi', 'chandigarh', 'jaipur', 'makati']
  if (canada.some(x => loc.includes(x))) return 'Canada'
  if (europe.some(x => loc.includes(x))) return 'Europe'
  if (asia.some(x => loc.includes(x))) return 'Asia'
  return 'LATAM'
}

const SALARY_RANGES = [
  { region: 'LATAM', min: 2800, max: 5000 },
  { region: 'US', min: 5000, max: 10800 },
  { region: 'Europe', min: 5400, max: 7900 },
  { region: 'Asia', min: 1700, max: 3800 },
  { region: 'Canada', min: 3000, max: 9200 },
]

const REGION_COLORS: Record<string, string> = {
  LATAM: '#6366f1', US: '#8b5cf6', Europe: '#a78bfa', Asia: '#c4b5fd', Canada: '#ddd6fe',
}

function fmt(n: number) {
  const k = n / 1000
  return `$${k % 1 === 0 ? k : k.toFixed(1)}k`
}

const CRM_OPTIONS = ['HubSpot', 'Salesforce', 'Zoho', 'Pipedrive', 'GoHighLevel', 'Close.io']
const SKILL_OPTIONS = ['SQL', 'APIs', 'Zapier / Make', 'n8n / AI tools', 'Migrations', 'Reporting & dashboards', 'Data hygiene', 'Webhooks', 'Sales enablement', 'Stakeholder-facing']
const REGION_OPTIONS = ['LATAM', 'US', 'Europe', 'Asia', 'Canada']
const TZ_OPTIONS = ['Eastern', 'Central', 'Mountain', 'Pacific']

const CRM_KEY: Record<string, string> = {
  HubSpot: 'skill_hubspot', Salesforce: 'skill_salesforce',
  Zoho: 'skill_zoho', Pipedrive: 'skill_pipedrive', GoHighLevel: 'skill_gohighlevel',
  'Close.io': 'skill_other_crm',
}
const SKILL_KEY: Record<string, string> = {
  SQL: 'skill_sql', APIs: 'skill_api_integrations',
  'Zapier / Make': 'skill_automation_tools',
  'n8n / AI tools': 'skill_n8n_or_ai',
  Migrations: 'skill_crm_migrations', 'Reporting & dashboards': 'skill_reporting_dashboards',
  'Data hygiene': 'skill_data_hygiene', Webhooks: 'skill_webhooks',
  'Sales enablement': 'skill_sales_enablement', 'Stakeholder-facing': 'style_client_facing',
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <div onClick={onChange} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }}>
      <div style={{
        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
        border: `1px solid ${checked ? '#6366f1' : '#2e2860'}`,
        background: checked ? '#6366f1' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ fontSize: 13, color: checked ? '#ffffff' : '#9ca3af' }}>{label}</span>
    </div>
  )
}

function FilterSection({ title, items, selected, toggle }: { title: string; items: string[]; selected: string[]; toggle: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>{title}</div>
      {items.map(item => (
        <Checkbox key={item} checked={selected.includes(item)} onChange={() => toggle(item)} label={item} />
      ))}
    </div>
  )
}

function MiniBarChart({ data }: { data: { region: string; count: number; color: string }[] }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t) }, [])
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160 }}>
      {data.map((d, i) => (
        <div key={d.region} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{d.count}</span>
          <div style={{
            width: '100%', borderRadius: '5px 5px 0 0', background: d.color,
            height: animated ? `${(d.count / max) * 100}%` : '0%',
            minHeight: animated ? 4 : 0,
            transition: `height 1.8s cubic-bezier(0.34,1.56,0.64,1) ${i * 150}ms`,
            boxShadow: `0 0 16px ${d.color}40`,
          }} />
          <span style={{ fontSize: 11, color: '#6b7280' }}>{d.region}</span>
        </div>
      ))}
    </div>
  )
}

function SalaryRange({ min, max }: { min: number; max: number }) {
  const [curMin, setCurMin] = useState(0)
  const [curMax, setCurMax] = useState(0)
  useEffect(() => {
    const duration = 2200
    const start = performance.now()
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setCurMin(Math.round(ease * min))
      setCurMax(Math.round(ease * max))
      if (p < 1) requestAnimationFrame(animate)
    }
    const t = setTimeout(() => requestAnimationFrame(animate), 200)
    return () => clearTimeout(t)
  }, [min, max])
  return <>{fmt(curMin)} – {fmt(curMax)}</>
}

type CandidateWithRegion = Candidate & { _region: string }

export default function BenchPage({ params }: { params: { token: string } }) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [validToken, setValidToken] = useState(false)
  const [smBookmarks, setSmBookmarks] = useState<string[]>([])
  const [clientBookmarks, setClientBookmarks] = useState<string[]>([])
  const [tab, setTab] = useState<'overview' | 'candidates'>('overview')
  const [selCRM, setSelCRM] = useState<string[]>([])
  const [selSkills, setSelSkills] = useState<string[]>([])
  const [selRegions, setSelRegions] = useState<string[]>([])
  const [selTZ, setSelTZ] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [bookmarkView, setBookmarkView] = useState<'none' | 'sm' | 'client'>('none')

  useEffect(() => {
    async function load() {
      const { data: tok } = await supabase
        .from('client_tokens').select('id,active,bookmarked_candidates').eq('token', params.token).single()
      if (!tok?.active) { setLoading(false); return }
      setValidToken(true)
      setSmBookmarks((tok as any).bookmarked_candidates ?? [])
      // Load client bookmarks from localStorage
      const stored = localStorage.getItem(`bookmarks_${params.token}`)
      if (stored) setClientBookmarks(JSON.parse(stored))
      const { data } = await supabase.from('candidates').select('*').order('first_name')
      setCandidates(data ?? [])
      setLoading(false)
    }
    load()
  }, [params.token])

  const toggleClientBookmark = (id: string) => {
    setClientBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem(`bookmarks_${params.token}`, JSON.stringify(next))
      return next
    })
  }

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (val: string) =>
    setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])

  const clearAll = () => { setSelCRM([]); setSelSkills([]); setSelRegions([]); setSelTZ([]); setBookmarkView('none') }

  const withRegion = useMemo(() => candidates.map(c => ({ ...c, _region: detectRegion(c) })), [candidates])

  const filtered = useMemo(() => withRegion.filter(c => {
    if (bookmarkView === 'sm' && !smBookmarks.includes(c.id)) return false
    if (bookmarkView === 'client' && !clientBookmarks.includes(c.id)) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${c.first_name} ${c.last_name}`.toLowerCase().includes(q)) return false
    }
    if (selCRM.length && !selCRM.every(cr => (c as any)[CRM_KEY[cr]])) return false
    if (selSkills.length && !selSkills.every(sk => {
      if (sk === 'n8n / AI tools') return (c as any).skill_n8n || c.skill_ai_tools
      return (c as any)[SKILL_KEY[sk]]
    })) return false
    if (selRegions.length && !selRegions.includes(c._region)) return false
    if (selTZ.length && !selTZ.some(tz => c.time_zones?.includes(tz))) return false
    return true
  }), [withRegion, selCRM, selSkills, selRegions, selTZ, search, bookmarkView, smBookmarks, clientBookmarks])

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    withRegion.forEach(c => { counts[c._region] = (counts[c._region] ?? 0) + 1 })
    return counts
  }, [withRegion])

  const chartData = ['LATAM', 'US', 'Europe', 'Asia', 'Canada'].map(r => ({
    region: r, count: regionCounts[r] ?? 0, color: REGION_COLORS[r],
  }))

  const salaryData = SALARY_RANGES.map(r => ({ ...r, count: regionCounts[r.region] ?? 0 }))

  const activeFilters = [
    ...selCRM.map(v => ({ label: v, clear: () => toggle(setSelCRM)(v) })),
    ...selSkills.map(v => ({ label: v, clear: () => toggle(setSelSkills)(v) })),
    ...selRegions.map(v => ({ label: v, clear: () => toggle(setSelRegions)(v) })),
    ...selTZ.map(v => ({ label: v, clear: () => toggle(setSelTZ)(v) })),
  ]

  const crmTags = (c: Candidate) => [
    c.skill_hubspot && 'HubSpot', c.skill_salesforce && 'Salesforce',
    c.skill_zoho && 'Zoho', c.skill_pipedrive && 'Pipedrive', c.skill_gohighlevel && 'GoHighLevel',
  ].filter(Boolean) as string[]

  const otherSkillTags = (c: Candidate) => [
    c.skill_sql && 'SQL', c.skill_automation_tools && 'Zapier / Make',
    ((c as any).skill_n8n || c.skill_ai_tools) && 'n8n / AI tools',
    c.skill_api_integrations && 'APIs',
    c.skill_crm_migrations && 'Migrations', c.skill_reporting_dashboards && 'Reporting',
    c.skill_data_hygiene && 'Data hygiene', c.skill_webhooks && 'Webhooks',
    c.skill_sales_enablement && 'Sales enablement', (c as any).style_client_facing && 'Stakeholder-facing',
    c.skill_kpi_reviews && 'KPI reviews', c.skill_forecasting && 'Forecasting',
  ].filter(Boolean) as string[]

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0e1a' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #1e1b4b', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!validToken) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0e1a', color: '#e2e8f0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 14 }}>🔒</div>
        <h1 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Invalid or expired link</h1>
        <p style={{ color: '#4b5563', fontSize: 13 }}>Contact your Sales Momentum representative.</p>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: '#0f0e1a', color: '#e2e8f0', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#1e1b4b;border-radius:2px}
        .card-h:hover{border-color:#3730a3 !important}
        .lnk:hover{background:rgba(99,102,241,0.18) !important}
        .bm-btn:hover{opacity:1 !important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .22s ease forwards}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* NAV */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 32px', height: 56, borderBottom: '1px solid #1e1b4b', background: '#0a0917', position: 'sticky', top: 0, zIndex: 40 }}>
        <img src="/logo.png" alt="Sales Momentum" style={{ height: 28, width: 'auto', objectFit: 'contain' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        <div style={{ width: 1, height: 14, background: '#1e1b4b', margin: '0 16px' }} />
        <div style={{ fontSize: 11, color: '#374151' }}>Operator Bench</div>
        <div style={{ flex: 1 }} />
        {(['overview', 'candidates'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? '#a5b4fc' : '#4b5563',
            borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent',
            padding: '0 4px', marginLeft: 24, height: 56,
            textTransform: 'capitalize', letterSpacing: '.02em',
          }}>{t}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="fu" style={{ padding: '44px 48px', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-.02em' }}>Operator Bench</div>
            <div style={{ fontSize: 12, color: '#4b5563', marginTop: 6 }}>{candidates.length} operators available · Curated by Sales Momentum</div>
          </div>

          <div style={{ background: '#13112a', border: '1px solid #1e1b4b', borderRadius: 16, padding: '28px 32px 24px', marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 3 }}>Candidates by Region</div>
            <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 28 }}>Distribution across the full bench</div>
            <MiniBarChart data={chartData} />
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>Salary Expectations by Region</div>
          <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 16 }}>Monthly rate ranges across the bench</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {salaryData.map((r, i) => {
              const ac = Object.values(REGION_COLORS)[i]
              const border = `rgba(${['99,102,241', '139,92,246', '167,139,250', '196,181,253', '221,214,254'][i]}, 0.2)`
              return (
                <div key={r.region} style={{ background: '#13112a', border: `1px solid ${border}`, borderRadius: 13, padding: '20px 18px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: ac, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>{r.region}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>
                    <SalaryRange min={r.min} max={r.max} />
                    <span style={{ fontSize: 10, fontWeight: 400, color: '#4b5563', marginLeft: 3 }}>/mo</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CANDIDATES */}
      {tab === 'candidates' && (
        <div style={{ display: 'flex' }}>
          {/* Sidebar */}
          <div style={{ width: 224, borderRight: '1px solid #1e1b4b', padding: '28px 18px', flexShrink: 0, minHeight: 'calc(100vh - 56px)', position: 'sticky', top: 56, alignSelf: 'flex-start', overflowY: 'auto', maxHeight: 'calc(100vh - 56px)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 20 }}>Filters</div>

            {/* SM Bookmarks */}
            {smBookmarks.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div
                  onClick={() => setBookmarkView(bookmarkView === 'sm' ? 'none' : 'sm')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                    borderRadius: 8, cursor: 'pointer',
                    background: bookmarkView === 'sm' ? 'rgba(99,102,241,0.2)' : '#1a1730',
                    border: `1px solid ${bookmarkView === 'sm' ? 'rgba(99,102,241,0.5)' : '#2e2860'}`,
                    transition: 'all .15s', marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 13 }}>★</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: bookmarkView === 'sm' ? '#a5b4fc' : '#8b9cc7' }}>Bookmarked by Sales Momentum</div>
                    <div style={{ fontSize: 10, color: '#4b5563', marginTop: 1 }}>{smBookmarks.length} candidates</div>
                  </div>
                </div>
              </div>
            )}

            {/* Client Bookmarks */}
            <div style={{ marginBottom: 20 }}>
              <div
                onClick={() => setBookmarkView(bookmarkView === 'client' ? 'none' : 'client')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  borderRadius: 8, cursor: 'pointer',
                  background: bookmarkView === 'client' ? 'rgba(99,102,241,0.2)' : '#1a1730',
                  border: `1px solid ${bookmarkView === 'client' ? 'rgba(99,102,241,0.5)' : '#2e2860'}`,
                  transition: 'all .15s',
                }}
              >
                <span style={{ fontSize: 13 }}>🔖</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: bookmarkView === 'client' ? '#a5b4fc' : '#8b9cc7' }}>Bookmarked by you</div>
                  <div style={{ fontSize: 10, color: '#4b5563', marginTop: 1 }}>{clientBookmarks.length} saved</div>
                </div>
              </div>
            </div>

            <div style={{ borderBottom: '1px solid #1e1b4b', marginBottom: 20 }} />

            <FilterSection title="CRM Experience" items={CRM_OPTIONS} selected={selCRM} toggle={toggle(setSelCRM)} />
            <FilterSection title="Time Zone" items={TZ_OPTIONS} selected={selTZ} toggle={toggle(setSelTZ)} />
            <FilterSection title="Region" items={REGION_OPTIONS} selected={selRegions} toggle={toggle(setSelRegions)} />
            <FilterSection title="Skills" items={SKILL_OPTIONS} selected={selSkills} toggle={toggle(setSelSkills)} />
          </div>

          {/* Cards */}
          <div className="fu" style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
            {activeFilters.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {activeFilters.map((f, i) => (
                  <div key={i} onClick={f.clear} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '4px 10px', fontSize: 11, color: '#a5b4fc', cursor: 'pointer' }}>
                    {f.label} <span style={{ opacity: .5, fontSize: 13 }}>×</span>
                  </div>
                ))}
                <div onClick={clearAll} style={{ fontSize: 11, color: '#4b5563', cursor: 'pointer', padding: '4px 8px', alignSelf: 'center' }}>Clear all</div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 14px', background: '#13112a', border: '1px solid #1e1b4b', borderRadius: 8, color: '#e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#6366f1'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#1e1b4b'}
              />
            </div>

            <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 20 }}>
              {filtered.length} operator{filtered.length !== 1 ? 's' : ''}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(c => {
                const isOpen = expanded === c.id
                const crms = crmTags(c)
                const skills = otherSkillTags(c)
                const region = (c as CandidateWithRegion)._region
                const isSmBookmarked = smBookmarks.includes(c.id)
                const isClientBookmarked = clientBookmarks.includes(c.id)

                return (
                  <div key={c.id} className="card-h" style={{
                    background: '#13112a',
                    border: `1px solid ${isOpen ? '#3730a3' : isSmBookmarked ? 'rgba(99,102,241,0.35)' : '#1e1b4b'}`,
                    borderRadius: 13, padding: '18px 20px', transition: 'border-color .15s', position: 'relative',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                        background: 'linear-gradient(135deg, #4338ca, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#fff',
                        boxShadow: '0 0 12px rgba(99,102,241,0.25)',
                      }}>
                        {initials(c)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {c.first_name} {c.last_name}
                          {isSmBookmarked && (
                            <span style={{ fontSize: 10, color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 4, padding: '1px 7px', whiteSpace: 'nowrap' }}>★ Sales Momentum pick</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                          <span style={{ fontSize: 11, color: '#6b7280' }}>{region}</span>
                          {c.location && <><span style={{ color: '#2e2860' }}>·</span><span style={{ fontSize: 11, color: '#6b7280' }}>{c.location}</span></>}
                          {c.time_zones?.length > 0 && <><span style={{ color: '#2e2860' }}>·</span><span style={{ fontSize: 11, color: '#6b7280' }}>{c.time_zones.join(', ')}</span></>}
                          {crms.length > 0 && (
                            <><span style={{ color: '#2e2860' }}>·</span>
                            {crms.map(cr => (
                              <span key={cr} style={{ fontSize: 10, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 4, padding: '2px 7px', color: '#a5b4fc', fontWeight: 600 }}>{cr}</span>
                            ))}</>
                          )}
                        </div>

                        {skills.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {skills.slice(0, 7).map(s => (
                              <span key={s} style={{ fontSize: 10, background: '#1a1730', border: '1px solid #2e2860', borderRadius: 4, padding: '3px 8px', color: '#8b9cc7' }}>{s}</span>
                            ))}
                            {skills.length > 7 && <span style={{ fontSize: 10, color: '#4b5563', padding: '3px 4px' }}>+{skills.length - 7}</span>}
                          </div>
                        )}
                      </div>

                      {/* Client bookmark button */}
                      <button
                        className="bm-btn"
                        onClick={e => { e.stopPropagation(); toggleClientBookmark(c.id) }}
                        title={isClientBookmarked ? 'Remove from your bookmarks' : 'Save to your bookmarks'}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                          fontSize: 18, lineHeight: 1, padding: 4,
                          opacity: isClientBookmarked ? 1 : 0.3,
                          color: isClientBookmarked ? '#a5b4fc' : '#6b7280',
                          transition: 'opacity .15s, color .15s',
                        }}
                      >
                        🔖
                      </button>
                    </div>

                    {/* Summary always visible */}
                    {c.recap_summary && (
                      <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.75, marginTop: 14 }}>{c.recap_summary}</p>
                    )}

                    {/* View links dropdown */}
                    {(c.fathom_recording_url || (c as any).recap_doc_url || c.resume_drive_url || c.social_url) && (
                      <>
                        <div onClick={() => setExpanded(isOpen ? null : c.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 12, cursor: 'pointer', width: 'fit-content' }}>
                          <span style={{ fontSize: 11, color: '#6366f1' }}>{isOpen ? 'Hide links' : 'View links'}</span>
                          <span style={{ fontSize: 10, color: '#6366f1', transform: isOpen ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform .15s' }}>▾</span>
                        </div>
                        {isOpen && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #1e1b4b' }}>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {c.fathom_recording_url && (
                                <a href={c.fathom_recording_url} target="_blank" rel="noreferrer" className="lnk" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#a5b4fc', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, padding: '6px 12px', transition: 'background .15s' }}>
                                  ▶ Screening Recording
                                </a>
                              )}
                              {(c as any).recap_doc_url && (
                                <a href={(c as any).recap_doc_url} target="_blank" rel="noreferrer" className="lnk" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#a5b4fc', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, padding: '6px 12px', transition: 'background .15s' }}>
                                  ☰ Recap Doc
                                </a>
                              )}
                              {c.resume_drive_url && (
                                <a href={c.resume_drive_url} target="_blank" rel="noreferrer" className="lnk" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#a5b4fc', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, padding: '6px 12px', transition: 'background .15s' }}>
                                  ↓ Resume
                                </a>
                              )}
                              {c.social_url && (
                                <a href={c.social_url} target="_blank" rel="noreferrer" className="lnk" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#a5b4fc', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, padding: '6px 12px', transition: 'background .15s' }}>
                                  ↗ LinkedIn
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}

              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#374151', fontSize: 13 }}>
                  No operators match the selected filters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
