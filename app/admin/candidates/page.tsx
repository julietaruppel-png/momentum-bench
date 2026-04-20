'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Candidate } from '@/lib/types'
import Link from 'next/link'

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase.from('candidates').select('*').order('created_at', { ascending: false })
    setCandidates(data ?? [])
    setLoading(false)
  }

  async function deleteCandidate(id: string) {
    if (!confirm('Delete this candidate? This cannot be undone.')) return
    await fetch(`/api/admin/candidates/${id}`, { method: 'DELETE' })
    setCandidates(prev => prev.filter(c => c.id !== id))
  }

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase()
    return !q || `${c.first_name} ${c.last_name} ${c.location ?? ''} ${c.email ?? ''}`.toLowerCase().includes(q)
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5' }}>
      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #ebebeb', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>Sales Momentum Admin</span>
        <Link href="/admin/candidates" style={{ fontSize: 13, color: '#5b4de8', textDecoration: 'none', fontWeight: 500 }}>Candidates</Link>
        <Link href="/admin/tokens" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Client links</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <Link
            href="/admin/candidates/new"
            style={{ fontSize: 13, background: '#5b4de8', color: '#fff', padding: '7px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}
          >
            + Add candidate
          </Link>
        </div>
      </nav>

      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Search candidates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 320, padding: '9px 14px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none', background: '#fff' }}
          />
          <span style={{ fontSize: 13, color: '#888' }}>{filtered.length} candidates</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Loading...</div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #ebebeb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ebebeb' }}>
                  {['Name', 'Location', 'English', 'Availability', 'Screened', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f5f5f5' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#fafafa'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500 }}>{c.first_name} {c.last_name}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{c.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>{c.location}</td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>{c.english_level ?? '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {c.availability ? (
                        <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: c.availability === 'Available now' ? '#e1f5ee' : '#f5f5f5', color: c.availability === 'Available now' ? '#085041' : '#666' }}>
                          {c.availability}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#555', fontSize: 13 }}>{c.date_screened ?? '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link href={`/admin/candidates/${c.id}`} style={{ fontSize: 12, color: '#5b4de8', textDecoration: 'none' }}>Edit</Link>
                        <button onClick={() => deleteCandidate(c.id)} style={{ fontSize: 12, color: '#d85a30', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: 0 }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#aaa' }}>No candidates yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
