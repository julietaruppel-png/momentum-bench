'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Candidate } from '@/lib/types'

const AVATAR_PALETTE = [
  { bg: '#2a1f5e', text: '#a89ff5' },
  { bg: '#0f3d2e', text: '#4ecf9a' },
  { bg: '#3d1f0f', text: '#f5a05a' },
  { bg: '#3d0f1f', text: '#f57a9a' },
  { bg: '#0f2a3d', text: '#5ab4f5' },
  { bg: '#2e1f0f', text: '#d4a96a' },
]

function initials(c: Candidate) {
  return `${c.first_name?.[0] ?? ''}${c.last_name?.[0] ?? ''}`.toUpperCase()
}
function avatarColor(id: string) {
  return AVATAR_PALETTE[id.charCodeAt(0) % AVATAR_PALETTE.length]
}

const CRM_FILTERS = [
  { key: 'skill_hubspot', label: 'HubSpot' },
  { key: 'skill_salesforce', label: 'Salesforce' },
  { key: 'skill_zoho', label: 'Zoho' },
  { key: 'skill_pipedrive', label: 'Pipedrive' },
  { key: 'skill_gohighlevel', label: 'GoHighLevel' },
]

const SKILL_FILTERS = [
  { key: 'skill_sql', label: 'SQL' },
  { key: 'skill_api_integrations', label: 'APIs' },
  { key: 'skill_automation_tools', label: 'n8n / Make / Zapier' },
  { key: 'skill_ai_tools', label: 'AI tools' },
  { key: 'skill_crm_migrations', label: 'Migrations' },
  { key: 'skill_reporting_dashboards', label: 'Reporting & dashboards' },
  { key: 'skill_data_hygiene', label: 'Data hygiene' },
  { key: 'skill_webhooks', label: 'Webhooks' },
  { key: 'skill_sales_enablement', label: 'Sales enablement' },
  { key: 'style_client_facing', label: 'Stakeholder-facing' },
]

const REGION_FILTERS = [
  { key: 'us_based', label: 'US-based' },
  { key: 'international', label: 'International (LATAM)' },
  { key: 'region_europe', label: 'Europe' },
  { key: 'region_asia', label: 'Asia' },
  { key: 'region_canada', label: 'Canada' },
]

const TZ_FILTERS = [
  { key: 'tz_Eastern', label: 'Eastern' },
  { key: 'tz_Central', label: 'Central' },
  { key: 'tz_Mountain', label: 'Mountain' },
  { key: 'tz_Pacific', label: 'Pacific' },
]

const FILTER_GROUPS = [
  { label: 'CRM experience', filters: CRM_FILTERS },
  { label: 'Skills', filters: SKILL_FILTERS },
  { label: 'Region', filters: REGION_FILTERS },
  { label: 'Time zone', filters: TZ_FILTERS },
]

const AVAIL_COLOR: Record<string, string> = {
  'Available now': '#4ecf9a',
  '2 weeks notice': '#a89ff5',
  'Part-time only': '#f5c842',
  'Not available': '#555',
}

const AVAIL_LABEL: Record<string, string> = {
  'Available now': 'Available now',
  '2 weeks notice': 'Available soon',
  'Part-time only': 'Part-time',
  'Not available': 'Unavailable',
}

export default function BenchPage({ params }: { params: { token: string } }) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [validToken, setValidToken] = useState(false)
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function load() {
      const { data: tokenData } = await supabase
        .from('client_tokens').select('id,active').eq('token', params.token).single()
      if (!tokenData?.active) { setLoading(false); return }
      setValidToken(true)
      const { data } = await supabase.from('candidates').select('*').order('first_name')
      setCandidates(data ?? [])
      setLoading(false)
    }
    load()
  }, [params.token])

  const toggleFilter = (key: string) => setActiveFilters(p => ({ ...p, [key]: !p[key] }))
  const toggleCollapse = (label: string) => setCollapsed(p => ({ ...p, [label]: !p[label] }))
  const activeCount = Object.values(activeFilters).filter(Boolean).length

  const filtered = useMemo(() => candidates.filter(c => {
    if (search) {
      const q = search.toLowerCase()
      if (!`${c.first_name} ${c.last_name} ${c.location ?? ''} ${c.revops_background ?? ''}`.toLowerCase().includes(q)) return false
    }
    for (const [key, on] of Object.entries(activeFilters)) {
      if (!on) continue
      if (key.startsWith('tz_')) { if (!c.time_zones?.includes(key.replace('tz_', ''))) return false; continue }
      if (key === 'us_based') { if (!c.is_us_based) return false; continue }
      if (key === 'international') { if (c.is_us_based || !c.location) return false; const loc = c.location.toLowerCase(); if (['portugal','spain','italy','france','germany','uk','england','ireland','netherlands','poland','europe','india','pakistan','philippines','asia','canada'].some(r => loc.includes(r))) return false; continue }
      if (key === 'region_europe') { if (!c.location || !['portugal','spain','italy','france','germany','uk','england','ireland','netherlands','poland','lisbon','madrid','rome','paris','berlin','amsterdam'].some(r => c.location!.toLowerCase().includes(r))) return false; continue }
      if (key === 'region_asia') { if (!c.location || !['india','pakistan','philippines','bangladesh','sri lanka','nepal','singapore','malaysia','indonesia','vietnam','thailand','japan','korea','china','taipei','manila','delhi','mumbai','bangalore','karachi','lahore','islamabad'].some(r => c.location!.toLowerCase().includes(r))) return false; continue }
      if (key === 'region_canada') { if (!c.location || !['canada','toronto','vancouver','montreal','calgary','ottawa','edmonton'].some(r => c.location!.toLowerCase().includes(r))) return false; continue }
      if (key in c && !(c as any)[key]) return false
    }
    return true
  }), [candidates, search, activeFilters])

  const crmTags = (c: Candidate) => [
    c.skill_hubspot && 'HubSpot',
    c.skill_salesforce && 'Salesforce',
    c.skill_zoho && 'Zoho',
    c.skill_pipedrive && 'Pipedrive',
    c.skill_gohighlevel && 'GoHighLevel',
  ].filter(Boolean) as string[]

  const skillTags = (c: Candidate) => [
    c.skill_sql && 'SQL',
    c.skill_automation_tools && 'Automation tools',
    c.skill_api_integrations && 'APIs',
    c.skill_ai_tools && 'AI tools',
    c.skill_crm_migrations && 'Migrations',
    c.skill_reporting_dashboards && 'Reporting',
    c.skill_data_hygiene && 'Data hygiene',
    c.skill_webhooks && 'Webhooks',
    c.skill_sales_enablement && 'Sales enablement',
    c.skill_forecasting && 'Forecasting',
    c.skill_change_management && 'Change mgmt',
    c.style_client_facing && 'Stakeholder-facing',
  ].filter(Boolean) as string[]

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0e0e10' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #2a2a35', borderTopColor: '#7c6fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!validToken) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0e0e10', color: '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Invalid or expired link</h1>
        <p style={{ color: '#555', fontSize: 14 }}>Contact your Sales Momentum representative.</p>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0e0e10', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#e8e8ec' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#2a2a35;border-radius:2px}
        input[type=checkbox]{accent-color:#7c6fff;width:14px;height:14px;cursor:pointer;flex-shrink:0}
        .card:hover{border-color:#7c6fff !important;background:#16161e !important}
        .tag{display:inline-flex;align-items:center;padding:3px 9px;border-radius:5px;font-size:11px;font-weight:500;border:1px solid #2a2a35;color:#9090a8;background:#18181f;white-space:nowrap}
        .tag-crm{background:#1e1a3a !important;border-color:#3a3060 !important;color:#a89ff5 !important}
        .lnk{font-size:12px;color:#7c6fff;text-decoration:none;padding:5px 12px;border-radius:6px;background:#1a1730;border:1px solid #2e2860;font-weight:500;white-space:nowrap}
        .lnk:hover{background:#221f40}
        .fl{display:flex;align-items:center;gap:8px;font-size:13px;color:#7070888;cursor:pointer;padding:4px 0;user-select:none}
        .fl:hover{color:#c8c8d8}
        .fl.on{color:#e8e8ec;font-weight:500}
        .sh{display:flex;align-items:center;justify-content:space-between;padding:10px 0 6px;cursor:pointer}
        .sh span{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#444455}
        .sh:hover span{color:#888899}
        @keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        .panel{animation:slideIn .18s ease}
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: 236, minWidth: 236, background: '#12121a', borderRight: '1px solid #1a1a24', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid #1a1a24' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8ec' }}>Candidate bench</div>
          <div style={{ fontSize: 11, color: '#444455', marginTop: 2 }}>Sales Momentum</div>
        </div>
        <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid #1a1a24', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div><div style={{ fontSize: 20, fontWeight: 600, color: '#e8e8ec', lineHeight: 1 }}>{filtered.length}</div><div style={{ fontSize: 10, color: '#444455', marginTop: 1 }}>showing</div></div>
          <div style={{ width: 1, height: 24, background: '#1a1a24' }} />
          <div><div style={{ fontSize: 20, fontWeight: 600, color: '#444455', lineHeight: 1 }}>{candidates.length}</div><div style={{ fontSize: 10, color: '#444455', marginTop: 1 }}>total</div></div>
          {activeCount > 0 && <button onClick={() => setActiveFilters({})} style={{ marginLeft: 'auto', fontSize: 11, color: '#7c6fff', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Clear {activeCount}</button>}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 24px' }}>
          {FILTER_GROUPS.map(group => (
            <div key={group.label} style={{ borderBottom: '1px solid #1a1a24' }}>
              <div className="sh" onClick={() => toggleCollapse(group.label)}>
                <span>{group.label}</span>
                <span style={{ fontSize: 9, color: '#333344' }}>{collapsed[group.label] ? '▼' : '▲'}</span>
              </div>
              {!collapsed[group.label] && (
                <div style={{ paddingBottom: 8 }}>
                  {group.filters.map(f => (
                    <label key={f.key} className={`fl${activeFilters[f.key] ? ' on' : ''}`} style={{ color: activeFilters[f.key] ? '#e8e8ec' : '#606070' }}>
                      <input type="checkbox" checked={!!activeFilters[f.key]} onChange={() => toggleFilter(f.key)} />
                      {f.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: '#12121a', borderBottom: '1px solid #1a1a24', padding: '11px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="text" placeholder="Search by name, location, or background..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, fontSize: 13, border: '1px solid #2a2a35', borderRadius: 9, padding: '9px 14px', background: '#18181f', fontFamily: 'inherit', color: '#e8e8ec', outline: 'none' }}
          />
          <span style={{ fontSize: 12, color: '#444455', whiteSpace: 'nowrap' }}>{filtered.length} operator{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {activeCount > 0 && (
          <div style={{ padding: '7px 18px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid #1a1a24', background: '#0e0e10' }}>
            {Object.entries(activeFilters).filter(([,v]) => v).map(([key]) => {
              const label = FILTER_GROUPS.flatMap(g => g.filters).find(f => f.key === key)?.label ?? key
              return (
                <button key={key} onClick={() => toggleFilter(key)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: '#1a1730', color: '#a89ff5', border: '1px solid #2e2860', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {label} <span style={{ opacity: .5 }}>×</span>
                </button>
              )
            })}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#333344' }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>∅</div>
              <div style={{ fontSize: 13 }}>No candidates match these filters</div>
            </div>
          )}
          {filtered.map(c => {
            const col = avatarColor(c.id)
            const crms = crmTags(c)
            const skills = skillTags(c)
            return (
              <div key={c.id} className="card" onClick={() => setSelected(c)}
                style={{ background: '#12121a', border: '1px solid #1a1a24', borderRadius: 11, padding: '13px 16px', cursor: 'pointer', transition: 'border-color .15s, background .15s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 9 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: col.bg, color: col.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                    {initials(c)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#e8e8ec' }}>{c.first_name} {c.last_name}</div>
                    <div style={{ fontSize: 12, color: '#444455', marginTop: 1 }}>{c.location ?? (c.is_us_based ? 'USA' : 'International')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    {c.availability && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: AVAIL_COLOR[c.availability] ?? '#555', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: '#666677' }}>{AVAIL_LABEL[c.availability] ?? c.availability}</span>
                      </div>
                    )}

                  </div>
                </div>

                {crms.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 5 }}>
                    {crms.map(t => <span key={t} className="tag tag-crm">{t}</span>)}
                  </div>
                )}

                {skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 9 }}>
                    {skills.slice(0, 6).map(t => <span key={t} className="tag">{t}</span>)}
                    {skills.length > 6 && <span className="tag" style={{ color: '#333344' }}>+{skills.length - 6}</span>}
                  </div>
                )}

                {c.recap_summary && (
                  <p style={{ fontSize: 12, color: '#484858', lineHeight: 1.6, marginBottom: 9 }}>
                    {c.recap_summary.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ')}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                  {c.fathom_recording_url && (
                    <a href={c.fathom_recording_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="lnk">Watch screening ↗</a>
                  )}
                  {(c as any).recap_doc_url && (
                    <a href={(c as any).recap_doc_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="lnk">Recap doc ↗</a>
                  )}
                  {c.time_zones?.length > 0 && (
                    <span style={{ fontSize: 11, color: '#333344', marginLeft: 'auto' }}>{c.time_zones.join(' · ')}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Detail panel */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setSelected(null)}>
          <div className="panel" style={{ width: 490, background: '#12121a', height: '100%', overflowY: 'auto', borderLeft: '1px solid #1a1a24', padding: '26px 26px 60px' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 16, right: 16, background: '#1e1e28', border: 'none', cursor: 'pointer', color: '#555566', width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>×</button>

            <div style={{ display: 'flex', gap: 13, alignItems: 'center', marginBottom: 20 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: avatarColor(selected.id).bg, color: avatarColor(selected.id).text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600 }}>
                {initials(selected)}
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: '#e8e8ec', margin: 0, letterSpacing: '-.3px' }}>{selected.first_name} {selected.last_name}</h2>
                <div style={{ fontSize: 12, color: '#444455', marginTop: 2 }}>{selected.location}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 20 }}>
              {[
                { label: 'Time zones', value: selected.time_zones?.join(', ') },
                { label: 'Salary expectation', value: selected.desired_salary },
                { label: 'Based', value: selected.is_us_based ? 'USA' : 'International' },
                { label: 'Screened', value: selected.date_screened },
              ].filter(f => f.value).map(f => (
                <div key={f.label} style={{ background: '#0e0e10', borderRadius: 7, padding: '8px 12px', border: '1px solid #1a1a22' }}>
                  <div style={{ fontSize: 10, color: '#3a3a4a', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.06em' }}>{f.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#b0b0c8' }}>{f.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 20 }}>
              {selected.fathom_recording_url && <a href={selected.fathom_recording_url} target="_blank" rel="noreferrer" className="lnk">Watch screening ↗</a>}
              {(selected as any).recap_doc_url && <a href={(selected as any).recap_doc_url} target="_blank" rel="noreferrer" className="lnk">Recap doc ↗</a>}
              {selected.resume_drive_url && <a href={selected.resume_drive_url} target="_blank" rel="noreferrer" className="lnk">Resume ↗</a>}
              {selected.social_url && <a href={selected.social_url} target="_blank" rel="noreferrer" className="lnk">LinkedIn ↗</a>}
            </div>

            {[
              { title: 'Screening summary', value: selected.recap_summary },
              { title: 'RevOps background', value: selected.revops_background },
              { title: 'CRM experience', value: selected.crm_experience },
              { title: "Project they're proud of", value: selected.proud_project },
            ].filter(s => s.value).map(s => (
              <div key={s.title} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#3a3a4a', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>{s.title}</div>
                <p style={{ fontSize: 13, color: '#7070888', lineHeight: 1.7, margin: 0 }}>{s.value}</p>
              </div>
            ))}

            {crmTags(selected).length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#3a3a4a', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>CRM experience</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {crmTags(selected).map(t => <span key={t} className="tag tag-crm">{t}</span>)}
                </div>
              </div>
            )}

            {selected.hubspot_areas?.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#3a3a4a', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>HubSpot areas</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {selected.hubspot_areas.map(a => <span key={a} className="tag" style={{ background: '#1a1730', borderColor: '#2e2860', color: '#a89ff5' }}>{a}</span>)}
                </div>
              </div>
            )}

            {skillTags(selected).length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#3a3a4a', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>Skills confirmed</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {skillTags(selected).map(t => <span key={t} className="tag">{t}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
