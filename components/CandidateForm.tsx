'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Candidate } from '@/lib/types'
import Link from 'next/link'

type Props = {
  candidate?: Partial<Candidate>
  mode: 'new' | 'edit'
}

const HUBSPOT_AREAS = [
  'Workflow automation',
  'Sales pipeline setup',
  'Conditional logic',
  'Custom properties',
  'Lead scoring',
  'Reporting & dashboards',
  'Email/SMS integration',
]

const TIMEZONES = ['Eastern', 'Central', 'Mountain', 'Pacific']

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>{title}</div>
      {children}
    </div>
  )
}

function Field({ label, children, half }: { label: string; children: React.ReactNode; half?: boolean }) {
  return (
    <div style={{ marginBottom: 16, width: half ? 'calc(50% - 6px)' : '100%', display: 'inline-block', verticalAlign: 'top', marginRight: half ? 12 : 0 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#555', display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'var(--font-sans)',
  color: '#1a1a1a',
  background: '#fff',
  outline: 'none',
}

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical' as const,
  minHeight: 80,
}

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
}

function SkillToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
      border: `1px solid ${checked ? '#5b4de8' : '#e0e0e0'}`,
      borderRadius: 8, cursor: 'pointer', fontSize: 13,
      background: checked ? '#ece9fd' : '#fff',
      color: checked ? '#3b2fc4' : '#555',
      marginRight: 8, marginBottom: 8, userSelect: 'none'
    }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
      {checked ? '✓ ' : ''}{label}
    </label>
  )
}

export default function CandidateForm({ candidate = {}, mode }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    first_name: candidate.first_name ?? '',
    last_name: candidate.last_name ?? '',
    email: candidate.email ?? '',
    phone: candidate.phone ?? '',
    social_url: candidate.social_url ?? '',
    location: candidate.location ?? '',
    is_us_based: candidate.is_us_based ?? false,
    time_zones: candidate.time_zones ?? [],
    revops_background: candidate.revops_background ?? '',
    crm_experience: candidate.crm_experience ?? '',
    hubspot_areas: candidate.hubspot_areas ?? [],
    desired_salary: candidate.desired_salary ?? '',
    proud_project: candidate.proud_project ?? '',
    resume_drive_url: candidate.resume_drive_url ?? '',
    fathom_recording_url: candidate.fathom_recording_url ?? '',
    recap_summary: candidate.recap_summary ?? '',
    english_level: candidate.english_level ?? '',
    availability: candidate.availability ?? '',
    internal_notes: candidate.internal_notes ?? '',
    date_screened: candidate.date_screened ?? '',
    // CRM
    skill_hubspot: candidate.skill_hubspot ?? false,
    skill_salesforce: candidate.skill_salesforce ?? false,
    skill_zoho: candidate.skill_zoho ?? false,
    skill_pipedrive: candidate.skill_pipedrive ?? false,
    skill_gohighlevel: candidate.skill_gohighlevel ?? false,
    skill_other_crm: candidate.skill_other_crm ?? false,
    // Automation
    skill_automation_tools: candidate.skill_automation_tools ?? false,
    skill_api_integrations: candidate.skill_api_integrations ?? false,
    skill_webhooks: candidate.skill_webhooks ?? false,
    // Technical
    skill_sql: candidate.skill_sql ?? false,
    skill_data_hygiene: candidate.skill_data_hygiene ?? false,
    skill_crm_migrations: candidate.skill_crm_migrations ?? false,
    skill_reporting_dashboards: candidate.skill_reporting_dashboards ?? false,
    skill_ai_tools: candidate.skill_ai_tools ?? false,
    // Sales ops
    skill_setter_closer: candidate.skill_setter_closer ?? false,
    skill_sales_enablement: candidate.skill_sales_enablement ?? false,
    skill_change_management: candidate.skill_change_management ?? false,
    skill_forecasting: candidate.skill_forecasting ?? false,
    skill_kpi_reviews: candidate.skill_kpi_reviews ?? false,
    // Style
    style_solo_operator: candidate.style_solo_operator ?? false,
    style_team_environment: candidate.style_team_environment ?? false,
    style_client_facing: candidate.style_client_facing ?? false,
  })

  function set(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleArray(key: 'time_zones' | 'hubspot_areas', value: string) {
    setForm(prev => {
      const arr = prev[key] as string[]
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const url = mode === 'new' ? '/api/admin/candidates' : `/api/admin/candidates/${candidate.id}`
    const method = mode === 'new' ? 'POST' : 'PUT'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    if (res.ok) {
      router.push('/admin/candidates')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
    }
    setSaving(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #ebebeb', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/admin/candidates" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Candidates</Link>
        <span style={{ color: '#ddd' }}>/</span>
        <span style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>
          {mode === 'new' ? 'New candidate' : `${candidate.first_name} ${candidate.last_name}`}
        </span>
      </nav>

      <form onSubmit={handleSubmit} style={{ maxWidth: 720, margin: '32px auto', padding: '0 32px 80px' }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #ebebeb', padding: 32 }}>

          <Section title="Contact info">
            <div style={{ display: 'flex', gap: 12 }}>
              <Field label="First name" half><input required style={inputStyle} value={form.first_name} onChange={e => set('first_name', e.target.value)} /></Field>
              <Field label="Last name" half><input required style={inputStyle} value={form.last_name} onChange={e => set('last_name', e.target.value)} /></Field>
            </div>
            <Field label="Email"><input type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} /></Field>
            <Field label="Phone"><input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
            <Field label="LinkedIn / social URL"><input style={inputStyle} value={form.social_url} onChange={e => set('social_url', e.target.value)} placeholder="https://linkedin.com/in/..." /></Field>
            <Field label="Location (city, country)"><input style={inputStyle} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Medellín, Colombia" /></Field>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#555' }}>
                <input type="checkbox" checked={form.is_us_based} onChange={e => set('is_us_based', e.target.checked)} />
                US-based candidate
              </label>
            </div>
            <Field label="Time zones willing to work in">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {TIMEZONES.map(tz => (
                  <SkillToggle key={tz} label={tz} checked={form.time_zones.includes(tz)} onChange={() => toggleArray('time_zones', tz)} />
                ))}
              </div>
            </Field>
          </Section>

          <Section title="Background (from application)">
            <Field label="RevOps / CRM background"><textarea style={textareaStyle} value={form.revops_background} onChange={e => set('revops_background', e.target.value)} /></Field>
            <Field label="CRMs worked with + HubSpot experience"><textarea style={textareaStyle} value={form.crm_experience} onChange={e => set('crm_experience', e.target.value)} /></Field>
            <Field label="HubSpot areas confident in">
              <div style={{ marginTop: 4 }}>
                {HUBSPOT_AREAS.map(a => (
                  <SkillToggle key={a} label={a} checked={form.hubspot_areas.includes(a)} onChange={() => toggleArray('hubspot_areas', a)} />
                ))}
              </div>
            </Field>
            <Field label="Desired yearly salary"><input style={inputStyle} value={form.desired_salary} onChange={e => set('desired_salary', e.target.value)} placeholder="$48,000 / year" /></Field>
            <Field label="Project they're proud of"><textarea style={{ ...textareaStyle, minHeight: 100 }} value={form.proud_project} onChange={e => set('proud_project', e.target.value)} /></Field>
          </Section>

          <Section title="Screening (team-added)">
            <Field label="Fathom recording URL"><input style={inputStyle} value={form.fathom_recording_url} onChange={e => set('fathom_recording_url', e.target.value)} placeholder="https://fathom.video/..." /></Field>
            <Field label="Resume (Google Drive link)"><input style={inputStyle} value={form.resume_drive_url} onChange={e => set('resume_drive_url', e.target.value)} placeholder="https://drive.google.com/..." /></Field>
            <Field label="Screening recap summary"><textarea style={{ ...textareaStyle, minHeight: 120 }} value={form.recap_summary} onChange={e => set('recap_summary', e.target.value)} placeholder="Paste the AI-generated recap summary here..." /></Field>
            <Field label="Internal notes (not shown to clients)"><textarea style={textareaStyle} value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)} /></Field>
          </Section>

          <Section title="Skills — CRM">
            {[
              { key: 'skill_hubspot', label: 'HubSpot' },
              { key: 'skill_salesforce', label: 'Salesforce' },
              { key: 'skill_zoho', label: 'Zoho' },
              { key: 'skill_pipedrive', label: 'Pipedrive' },
              { key: 'skill_gohighlevel', label: 'GoHighLevel' },
              { key: 'skill_other_crm', label: 'Other CRM' },
            ].map(s => <SkillToggle key={s.key} label={s.label} checked={(form as any)[s.key]} onChange={() => set(s.key, !(form as any)[s.key])} />)}
          </Section>

          <Section title="Skills — Automation & integrations">
            {[
              { key: 'skill_automation_tools', label: 'Automation tools (Zapier / Make / n8n)' },
              { key: 'skill_api_integrations', label: 'API integrations' },
              { key: 'skill_webhooks', label: 'Webhooks' },
            ].map(s => <SkillToggle key={s.key} label={s.label} checked={(form as any)[s.key]} onChange={() => set(s.key, !(form as any)[s.key])} />)}
          </Section>

          <Section title="Skills — Technical">
            {[
              { key: 'skill_sql', label: 'SQL' },
              { key: 'skill_data_hygiene', label: 'Data hygiene & deduplication' },
              { key: 'skill_crm_migrations', label: 'CRM migrations' },
              { key: 'skill_reporting_dashboards', label: 'Custom reporting & dashboards' },
              { key: 'skill_ai_tools', label: 'AI tools' },
            ].map(s => <SkillToggle key={s.key} label={s.label} checked={(form as any)[s.key]} onChange={() => set(s.key, !(form as any)[s.key])} />)}
          </Section>

          <Section title="Skills — Sales operations">
            {[
              { key: 'skill_setter_closer', label: 'Setter/closer process' },
              { key: 'skill_sales_enablement', label: 'Sales team enablement' },
              { key: 'skill_change_management', label: 'Change management' },
              { key: 'skill_forecasting', label: 'Forecasting & pipeline visibility' },
              { key: 'skill_kpi_reviews', label: 'KPI reviews with leadership' },
            ].map(s => <SkillToggle key={s.key} label={s.label} checked={(form as any)[s.key]} onChange={() => set(s.key, !(form as any)[s.key])} />)}
          </Section>

          <Section title="Working style">
            {[
              { key: 'style_solo_operator', label: 'Solo operator (no eng support)' },
              { key: 'style_team_environment', label: 'Team environment' },
              { key: 'style_client_facing', label: 'Client-facing / stakeholder comms' },
            ].map(s => <SkillToggle key={s.key} label={s.label} checked={(form as any)[s.key]} onChange={() => set(s.key, !(form as any)[s.key])} />)}
          </Section>

          {error && <div style={{ fontSize: 13, color: '#d85a30', marginBottom: 16, padding: '10px 14px', background: '#fff5f2', borderRadius: 8 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '10px 28px', background: '#5b4de8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-sans)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving...' : mode === 'new' ? 'Add candidate' : 'Save changes'}
            </button>
            <Link href="/admin/candidates" style={{ padding: '10px 20px', color: '#666', fontSize: 14, textDecoration: 'none' }}>Cancel</Link>
          </div>
        </div>
      </form>
    </div>
  )
}
