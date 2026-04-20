'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Candidate, FILTER_GROUPS } from '@/lib/types'

const AVATAR_COLORS = [
  { bg: '#ece9fd', text: '#3b2fc4' },
  { bg: '#e1f5ee', text: '#085041' },
  { bg: '#faeeda', text: '#633806' },
  { bg: '#faece7', text: '#712b13' },
  { bg: '#e6f1fb', text: '#0c447c' },
]

function initials(c: Candidate) {
  return `${c.first_name[0] ?? ''}${c.last_name[0] ?? ''}`.toUpperCase()
}

function avatarColor(id: string) {
  const n = id.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[n]
}

export default function BenchPage({ params }: { params: { token: string } }) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [validToken, setValidToken] = useState(false)
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({})
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    crm: true, hubspot_areas: true, automation: true, technical: true, salesops: false, style: false
  })

  useEffect(() => {
    async function load() {
      // Validate token
      const { data: tokenData } = await supabase
        .from('client_tokens')
        .select('id, active')
        .eq('token', params.token)
        .single()

      if (!tokenData?.active) { setLoading(false); return }
      setValidToken(true)

      const { data } = await supabase
        .from('candidates')
        .select('*')
        .order('first_name')
      setCandidates(data ?? [])
      setLoading(false)
    }
    load()
  }, [params.token])

  const toggleFilter = (key: string) => {
    setActiveFilters(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      // Search
      if (search) {
        const q = search.toLowerCase()
        const searchable = `${c.first_name} ${c.last_name} ${c.location ?? ''} ${c.revops_background ?? ''} ${c.crm_experience ?? ''}`.toLowerCase()
        if (!searchable.includes(q)) return false
      }

      // Skills filters
      for (const [key, active] of Object.entries(activeFilters)) {
        if (!active) continue
        // HubSpot area filters
        const hsGroup = FILTER_GROUPS.hubspot_areas.filters.find(f => f.key === key)
        if (hsGroup) {
          if (!c.hubspot_areas?.includes(hsGroup.label)) return false
          continue
        }
        // Time zone filter
        if (key.startsWith('tz_')) {
          const tz = key.replace('tz_', '')
          if (!c.time_zones?.includes(tz)) return false
          continue
        }
        // English filter
        if (key.startsWith('english_')) {
          if (c.english_level !== key.replace('english_', '')) return false
          continue
        }
        // Availability filter
        if (key === 'avail_now') {
          if (c.availability !== 'Available now') return false
          continue
        }
        // Region
        if (key === 'us_based') { if (!c.is_us_based) return false; continue }
        if (key === 'international') { if (c.is_us_based) return false; continue }
        // Boolean skill filters
        if (key in c) {
          if (!(c as any)[key]) return false
        }
      }
      return true
    })
  }, [candidates, search, activeFilters])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div style={{ width: 28, height: 28, border: '2px solid #e0e0e0', borderTopColor: '#5b4de8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (!validToken) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 500, marginBottom: 8 }}>Invalid or expired link</h1>
        <p style={{ color: '#888', fontSize: 14 }}>Please contact your Sales Momentum contact for a valid access link.</p>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f7f7f5' }}>

      {/* Sidebar */}
      <aside style={{ width: 260, minWidth: 260, background: '#fff', borderRight: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #ebebeb' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px' }}>Sales Momentum</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Operator bench</div>
        </div>

        {/* Stats */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #ebebeb', display: 'flex', gap: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>{filtered.length}</div>
            <div style={{ fontSize: 11, color: '#888' }}>showing</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>{candidates.length}</div>
            <div style={{ fontSize: 11, color: '#888' }}>total</div>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={() => setActiveFilters({})} style={{ marginLeft: 'auto', fontSize: 11, color: '#5b4de8', background: '#ece9fd', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              Clear {activeFilterCount}
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0 20px' }}>

          {Object.entries(FILTER_GROUPS).map(([groupKey, group]) => (
            <div key={groupKey} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <button
                onClick={() => setExpandedGroups(p => ({ ...p, [groupKey]: !p[groupKey] }))}
                style={{ width: '100%', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'left' }}
              >
                {group.label}
                <span style={{ fontSize: 10, color: '#ccc' }}>{expandedGroups[groupKey] ? '▲' : '▼'}</span>
              </button>
              {expandedGroups[groupKey] && (
                <div style={{ padding: '4px 20px 12px' }}>
                  {group.filters.map(f => (
                    <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 13, color: activeFilters[f.key] ? '#1a1a1a' : '#555', fontWeight: activeFilters[f.key] ? 500 : 400 }}>
                      <input type="checkbox" checked={!!activeFilters[f.key]} onChange={() => toggleFilter(f.key)} />
                      {f.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Time zones */}
          <div style={{ borderBottom: '1px solid #f0f0f0' }}>
            <button
              onClick={() => setExpandedGroups(p => ({ ...p, timezones: !p.timezones }))}
              style={{ width: '100%', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'left' }}
            >
              Time zone coverage
              <span style={{ fontSize: 10, color: '#ccc' }}>{expandedGroups.timezones ? '▲' : '▼'}</span>
            </button>
            {expandedGroups.timezones && (
              <div style={{ padding: '4px 20px 12px' }}>
                {['Eastern', 'Central', 'Mountain', 'Pacific'].map(tz => (
                  <label key={tz} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 13, color: activeFilters[`tz_${tz}`] ? '#1a1a1a' : '#555', fontWeight: activeFilters[`tz_${tz}`] ? 500 : 400 }}>
                    <input type="checkbox" checked={!!activeFilters[`tz_${tz}`]} onChange={() => toggleFilter(`tz_${tz}`)} />
                    {tz}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* English */}
          <div style={{ borderBottom: '1px solid #f0f0f0' }}>
            <button
              onClick={() => setExpandedGroups(p => ({ ...p, english: !p.english }))}
              style={{ width: '100%', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'left' }}
            >
              English level
              <span style={{ fontSize: 10, color: '#ccc' }}>{expandedGroups.english ? '▲' : '▼'}</span>
            </button>
            {expandedGroups.english && (
              <div style={{ padding: '4px 20px 12px' }}>
                {['Intermediate', 'Advanced', 'Fluent'].map(lvl => (
                  <label key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 13, color: activeFilters[`english_${lvl}`] ? '#1a1a1a' : '#555', fontWeight: activeFilters[`english_${lvl}`] ? 500 : 400 }}>
                    <input type="checkbox" checked={!!activeFilters[`english_${lvl}`]} onChange={() => toggleFilter(`english_${lvl}`)} />
                    {lvl}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Region */}
          <div style={{ borderBottom: '1px solid #f0f0f0' }}>
            <button
              onClick={() => setExpandedGroups(p => ({ ...p, region: !p.region }))}
              style={{ width: '100%', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'left' }}
            >
              Region
              <span style={{ fontSize: 10, color: '#ccc' }}>{expandedGroups.region ? '▲' : '▼'}</span>
            </button>
            {expandedGroups.region && (
              <div style={{ padding: '4px 20px 12px' }}>
                {[{ key: 'us_based', label: 'US-based' }, { key: 'international', label: 'International (LATAM)' }].map(f => (
                  <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 13, color: activeFilters[f.key] ? '#1a1a1a' : '#555', fontWeight: activeFilters[f.key] ? 500 : 400 }}>
                    <input type="checkbox" checked={!!activeFilters[f.key]} onChange={() => toggleFilter(f.key)} />
                    {f.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Availability */}
          <div>
            <button
              onClick={() => setExpandedGroups(p => ({ ...p, avail: !p.avail }))}
              style={{ width: '100%', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'left' }}
            >
              Availability
              <span style={{ fontSize: 10, color: '#ccc' }}>{expandedGroups.avail ? '▲' : '▼'}</span>
            </button>
            {expandedGroups.avail && (
              <div style={{ padding: '4px 20px 12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 13, color: activeFilters.avail_now ? '#1a1a1a' : '#555', fontWeight: activeFilters.avail_now ? 500 : 400 }}>
                  <input type="checkbox" checked={!!activeFilters.avail_now} onChange={() => toggleFilter('avail_now')} />
                  Available now
                </label>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #ebebeb', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="text"
            placeholder="Search by name, location, or background..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, fontSize: 14, border: '1px solid #e0e0e0', borderRadius: 8, padding: '9px 14px', background: '#fafafa', fontFamily: 'var(--font-sans)', color: '#1a1a1a', outline: 'none' }}
          />
          <div style={{ fontSize: 13, color: '#888', whiteSpace: 'nowrap' }}>
            {filtered.length} operator{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>∅</div>
              <div style={{ fontSize: 14 }}>No candidates match these filters</div>
            </div>
          )}
          {filtered.map(c => {
            const color = avatarColor(c.id)
            const skills = [
              c.skill_hubspot && 'HubSpot',
              c.skill_salesforce && 'Salesforce',
              c.skill_sql && 'SQL',
              c.skill_crm_migrations && 'Migrations',
              c.skill_ai_tools && 'AI tools',
              c.skill_automation_tools && 'Automation',
              c.skill_api_integrations && 'API integrations',
              c.skill_data_hygiene && 'Data hygiene',
              c.skill_reporting_dashboards && 'Reporting',
              c.skill_setter_closer && 'Setter/closer',
              c.skill_sales_enablement && 'Sales enablement',
              c.skill_change_management && 'Change mgmt',
              c.skill_forecasting && 'Forecasting',
              c.skill_kpi_reviews && 'KPI reviews',
              c.style_solo_operator && 'Solo operator',
              c.style_client_facing && 'Client-facing',
            ].filter(Boolean) as string[]

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCandidate(c)}
                style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 12, padding: '16px 20px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#5b4de8'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(91,77,232,0.08)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#ebebeb'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: color.bg, color: color.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                    {initials(c)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a' }}>{c.first_name} {c.last_name}</div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{c.location ?? (c.is_us_based ? 'USA' : 'International')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    {c.english_level && (
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#f0f0f0', color: '#555' }}>
                        EN: {c.english_level}
                      </span>
                    )}
                    {c.availability && (
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: c.availability === 'Available now' ? '#e1f5ee' : '#f5f5f5', color: c.availability === 'Available now' ? '#085041' : '#666' }}>
                        {c.availability}
                      </span>
                    )}
                    {c.time_zones?.length > 0 && (
                      <span style={{ fontSize: 11, color: '#888' }}>{c.time_zones.join(', ')}</span>
                    )}
                  </div>
                </div>

                {skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {skills.map(s => (
                      <span key={s} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, border: '1px solid #e8e8e8', color: '#555', background: '#fafafa' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {c.recap_summary && (
                  <p style={{ marginTop: 10, fontSize: 13, color: '#666', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.recap_summary}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </main>

      {/* Detail panel */}
      {selectedCandidate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setSelectedCandidate(null)}>
          <div style={{ width: 520, background: '#fff', height: '100%', overflowY: 'auto', padding: 32 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedCandidate(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#888', lineHeight: 1 }}>×</button>

            {/* Header */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: avatarColor(selectedCandidate.id).bg, color: avatarColor(selectedCandidate.id).text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600 }}>
                {initials(selectedCandidate)}
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{selectedCandidate.first_name} {selectedCandidate.last_name}</h2>
                <div style={{ fontSize: 14, color: '#888', marginTop: 3 }}>{selectedCandidate.location}</div>
              </div>
            </div>

            {/* Quick facts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {[
                { label: 'English', value: selectedCandidate.english_level },
                { label: 'Availability', value: selectedCandidate.availability },
                { label: 'Time zones', value: selectedCandidate.time_zones?.join(', ') },
                { label: 'Salary expectation', value: selectedCandidate.desired_salary },
                { label: 'Based', value: selectedCandidate.is_us_based ? 'USA' : 'International' },
                { label: 'Screened', value: selectedCandidate.date_screened },
              ].filter(f => f.value).map(f => (
                <div key={f.label} style={{ background: '#f7f7f5', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>{f.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{f.value}</div>
                </div>
              ))}
            </div>

            {/* Links */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              {selectedCandidate.fathom_recording_url && (
                <a href={selectedCandidate.fathom_recording_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#5b4de8', background: '#ece9fd', padding: '7px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}>
                  Watch screening call
                </a>
              )}
              {selectedCandidate.resume_drive_url && (
                <a href={selectedCandidate.resume_drive_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#1a1a1a', background: '#f0f0f0', padding: '7px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}>
                  View resume
                </a>
              )}
              {selectedCandidate.social_url && (
                <a href={selectedCandidate.social_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#1a1a1a', background: '#f0f0f0', padding: '7px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}>
                  LinkedIn
                </a>
              )}
            </div>

            {/* Recap */}
            {selectedCandidate.recap_summary && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Screening summary</div>
                <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, margin: 0 }}>{selectedCandidate.recap_summary}</p>
              </div>
            )}

            {/* Background */}
            {selectedCandidate.revops_background && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>RevOps background</div>
                <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, margin: 0 }}>{selectedCandidate.revops_background}</p>
              </div>
            )}

            {/* CRM experience */}
            {selectedCandidate.crm_experience && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>CRM experience</div>
                <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, margin: 0 }}>{selectedCandidate.crm_experience}</p>
              </div>
            )}

            {/* HubSpot areas */}
            {selectedCandidate.hubspot_areas?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>HubSpot areas</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedCandidate.hubspot_areas.map(a => (
                    <span key={a} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: '#ece9fd', color: '#3b2fc4' }}>{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Skills confirmed</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  selectedCandidate.skill_hubspot && 'HubSpot',
                  selectedCandidate.skill_salesforce && 'Salesforce',
                  selectedCandidate.skill_zoho && 'Zoho',
                  selectedCandidate.skill_pipedrive && 'Pipedrive',
                  selectedCandidate.skill_gohighlevel && 'GoHighLevel',
                  selectedCandidate.skill_sql && 'SQL',
                  selectedCandidate.skill_crm_migrations && 'CRM migrations',
                  selectedCandidate.skill_ai_tools && 'AI tools',
                  selectedCandidate.skill_automation_tools && 'Automation tools',
                  selectedCandidate.skill_api_integrations && 'API integrations',
                  selectedCandidate.skill_webhooks && 'Webhooks',
                  selectedCandidate.skill_data_hygiene && 'Data hygiene',
                  selectedCandidate.skill_reporting_dashboards && 'Reporting',
                  selectedCandidate.skill_setter_closer && 'Setter/closer process',
                  selectedCandidate.skill_sales_enablement && 'Sales enablement',
                  selectedCandidate.skill_change_management && 'Change management',
                  selectedCandidate.skill_forecasting && 'Forecasting',
                  selectedCandidate.skill_kpi_reviews && 'KPI reviews',
                  selectedCandidate.style_solo_operator && 'Solo operator',
                  selectedCandidate.style_team_environment && 'Team environment',
                  selectedCandidate.style_client_facing && 'Client-facing',
                ].filter(Boolean).map(s => (
                  <span key={s as string} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid #e0e0e0', color: '#444', background: '#fafafa' }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Proud project */}
            {selectedCandidate.proud_project && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Project they're proud of</div>
                <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, margin: 0 }}>{selectedCandidate.proud_project}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
