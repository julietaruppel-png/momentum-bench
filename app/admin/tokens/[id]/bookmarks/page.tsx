'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Candidate, ClientToken } from '@/lib/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function BookmarksPage({ params }: { params: { id: string } }) {
  const [token, setToken] = useState<ClientToken | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [bookmarked, setBookmarked] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const [{ data: tok }, { data: cands }] = await Promise.all([
        supabase.from('client_tokens').select('*').eq('id', params.id).single(),
        supabase.from('candidates').select('id,first_name,last_name,location,skill_hubspot,skill_salesforce,skill_zoho,skill_pipedrive,skill_gohighlevel').order('first_name'),
      ])
      if (tok) {
        setToken(tok)
        setBookmarked((tok as any).bookmarked_candidates ?? [])
      }
      setCandidates(cands ?? [])
      setLoading(false)
    }
    load()
  }, [params.id])

  const toggleBookmark = (id: string) => {
    setBookmarked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const saveBookmarks = async () => {
    setSaving(true)
    await fetch(`/api/admin/tokens/${params.id}/bookmarks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarked_candidates: bookmarked }),
    })
    setSaving(false)
    router.push('/admin/tokens')
  }

  const filtered = candidates.filter(c => {
    if (!search) return true
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
  })

  const crmTags = (c: Candidate) => [
    c.skill_hubspot && 'HubSpot', c.skill_salesforce && 'Salesforce',
    c.skill_zoho && 'Zoho', c.skill_pipedrive && 'Pipedrive', c.skill_gohighlevel && 'GoHighLevel',
  ].filter(Boolean) as string[]

  if (loading) return <div style={{ padding: 40, fontFamily: 'var(--font-sans)' }}>Loading...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5', fontFamily: 'var(--font-sans)' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #ebebeb', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/admin/tokens" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Client links</Link>
        <span style={{ color: '#ddd' }}>/</span>
        <span style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>Bookmarks for {token?.client_name}</span>
      </nav>

      <div style={{ maxWidth: 720, margin: '32px auto', padding: '0 32px 80px' }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #ebebeb', padding: 28 }}>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', marginBottom: 4 }}>
              Select candidates to bookmark for {token?.client_name}
            </div>
            <div style={{ fontSize: 13, color: '#888' }}>
              Bookmarked candidates appear at the top of the bench for this client. {bookmarked.length} selected.
            </div>
          </div>

          <input
            type="text"
            placeholder="Search candidates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 14px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 16 }}
          />

          {/* Bookmarked section */}
          {bookmarked.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#5b4de8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                ★ Bookmarked ({bookmarked.length})
              </div>
              {candidates.filter(c => bookmarked.includes(c.id)).map(c => (
                <CandidateRow key={c.id} c={c} checked={true} toggle={toggleBookmark} crms={crmTags(c)} />
              ))}
              <div style={{ borderBottom: '1px solid #ebebeb', marginBottom: 16, marginTop: 8 }} />
            </div>
          )}

          <div style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
            All candidates
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.filter(c => !bookmarked.includes(c.id)).map(c => (
              <CandidateRow key={c.id} c={c} checked={false} toggle={toggleBookmark} crms={crmTags(c)} />
            ))}
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button
              onClick={saveBookmarks}
              disabled={saving}
              style={{ padding: '10px 28px', background: '#5b4de8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving...' : 'Save bookmarks'}
            </button>
            <Link href="/admin/tokens" style={{ padding: '10px 20px', color: '#666', fontSize: 14, textDecoration: 'none', alignSelf: 'center' }}>Cancel</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function CandidateRow({ c, checked, toggle, crms }: { c: Candidate; checked: boolean; toggle: (id: string) => void; crms: string[] }) {
  return (
    <div
      onClick={() => toggle(c.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
        border: `1px solid ${checked ? '#5b4de8' : '#e8e8e8'}`,
        borderRadius: 8, cursor: 'pointer', background: checked ? '#f5f3ff' : '#fafafa',
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
        border: `1px solid ${checked ? '#5b4de8' : '#ddd'}`,
        background: checked ? '#5b4de8' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{c.first_name} {c.last_name}</div>
        {c.location && <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{c.location}</div>}
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        {crms.map(cr => (
          <span key={cr} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#ece9fd', color: '#3b2fc4', fontWeight: 500 }}>{cr}</span>
        ))}
      </div>
    </div>
  )
}
