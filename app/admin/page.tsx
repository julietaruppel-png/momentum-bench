'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
    if (res.ok) {
      router.push('/admin/candidates')
    } else {
      setError('Incorrect password')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f5' }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ebebeb', padding: '40px 48px', width: 380 }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', fontFamily: 'var(--font-sans)' }}>Sales Momentum</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Admin panel</div>
        </div>
        <form onSubmit={handleLogin}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#666', display: 'block', marginBottom: 6 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter admin password"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none', marginBottom: 16 }}
            required
          />
          {error && <div style={{ fontSize: 13, color: '#d85a30', marginBottom: 12 }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '11px', background: '#5b4de8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-sans)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}
