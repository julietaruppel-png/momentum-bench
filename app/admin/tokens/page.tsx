'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ClientToken } from '@/lib/types'
import Link from 'next/link'

export default function TokensPage() {
  const [tokens, setTokens] = useState<ClientToken[]>([])
  const [loading, setLoading] = useState(true)
  const [newClientName, setNewClientName] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('client_tokens').select('*').order('created_at', { ascending: false })
    setTokens(data ?? [])
    setLoading(false)
  }

  async function createToken() {
    if (!newClientName.trim()) return
    setCreating(true)
    const res = await fetch('/api/admin/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: newClientName, notes: newNotes })
    })
    if (res.ok) {
      const { token } = await res.json()
      setTokens(prev => [token, ...prev])
      setNewClientName('')
      setNewNotes('')
    }
    setCreating(false)
  }

  async function toggleToken(id: string, active: boolean) {
    await fetch(`/api/admin/tokens/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active })
    })
    setTokens(prev => prev.map(t => t.id === id ? { ...t, active: !active } : t))
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/bench/${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #ebebeb', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>Sales Momentum Admin</span>
        <Link href="/admin/candidates" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Candidates</Link>
        <Link href="/admin/tokens" style={{ fontSize: 13, color: '#5b4de8', textDecoration: 'none', fontWeight: 500 }}>Client links</Link>
      </nav>

      <div style={{ maxWidth: 760, margin: '32px auto', padding: '0 32px' }}>

        {/* Create new */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #ebebeb', padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', marginBottom: 16 }}>Generate new client link</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <input
              placeholder="Client name (e.g. Anna Kloth / Lean Marketing)"
              value={newClientName}
              onChange={e => setNewClientName(e.target.value)}
              style={{ flex: 1, padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none' }}
            />
            <input
              placeholder="Notes (optional)"
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              style={{ width: 220, padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none' }}
            />
          </div>
          <button
            onClick={createToken}
            disabled={creating || !newClientName.trim()}
            style={{ padding: '9px 20px', background: '#5b4de8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-sans)', cursor: creating || !newClientName.trim() ? 'not-allowed' : 'pointer', opacity: creating || !newClientName.trim() ? 0.6 : 1 }}
          >
            {creating ? 'Generating...' : 'Generate link'}
          </button>
        </div>

        {/* Tokens list */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #ebebeb', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Loading...</div>
          ) : tokens.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>No client links yet</div>
          ) : (
            tokens.map((t, i) => (
              <div key={t.id} style={{ padding: '16px 20px', borderBottom: i < tokens.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{t.client_name}</div>
                    {t.notes && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{t.notes}</div>}
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: t.active ? '#e1f5ee' : '#f5f5f5', color: t.active ? '#085041' : '#888' }}>
                    {t.active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{ fontSize: 12, color: '#555', background: '#f7f7f5', padding: '5px 10px', borderRadius: 6, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                    {baseUrl}/bench/{t.token}
                  </code>
                  <button
                    onClick={() => copyLink(t.token)}
                    style={{ fontSize: 12, padding: '6px 14px', border: '1px solid #e0e0e0', borderRadius: 7, background: copied === t.token ? '#e1f5ee' : '#fff', color: copied === t.token ? '#085041' : '#555', cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}
                  >
                    {copied === t.token ? '✓ Copied' : 'Copy link'}
                  </button>
                  <button
                    onClick={() => toggleToken(t.id, t.active)}
                    style={{ fontSize: 12, padding: '6px 14px', border: '1px solid #e0e0e0', borderRadius: 7, background: '#fff', color: '#888', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                  >
                    {t.active ? 'Disable' : 'Enable'}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: '#ccc', marginTop: 6 }}>
                  Created {new Date(t.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
