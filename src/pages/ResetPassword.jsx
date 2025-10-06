import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import styles from '../styles/ResetPassword.module.scss'

function ResetPassword() {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState(null) // { type: 'error'|'success', text }
  const [ready, setReady] = useState(false)

  // Parse tokens even if the URL has "#/reset-password#access_token=..."
  const parseRecoveryFromUrl = () => {
    const hash = window.location.hash || ''            // e.g. "#/reset-password#access_token=...&..."
    const lastHash = hash.includes('#') ? hash.slice(hash.lastIndexOf('#') + 1) : ''
    // Tokens could also arrive as search params (?access_token=...); merge both
    const params = new URLSearchParams(window.location.search)
    if (lastHash) {
      for (const [k, v] of new URLSearchParams(lastHash).entries()) {
        if (!params.has(k)) params.set(k, v)
      }
    }
    return {
      type: params.get('type'),
      access_token: params.get('access_token'),
      refresh_token: params.get('refresh_token'),
    }
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!supabase) {
        setMessage({ type: 'error', text: 'Supabase is not configured.' })
        setReady(true)
        return
      }

      // 1) Try to parse tokens ourselves (handles the double-hash case)
      const { type, access_token, refresh_token } = parseRecoveryFromUrl()

      try {
        if (type === 'recovery' && access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (error) throw error
          // Clean the URL a bit (optional)
          window.history.replaceState({}, document.title, window.location.href.split('#')[0] + '#/reset-password')
        } else {
          // 2) Fallback: ask Supabase if it can parse (covers other link formats)
          await supabase.auth.getSessionFromUrl({ storeSession: true }).catch(() => {})
        }
      } catch (err) {
        if (alive) setMessage({ type: 'error', text: err.message || 'Failed to restore session from link.' })
      }

      // 3) Ensure we have a session now
      const { data, error: sessErr } = await supabase.auth.getSession()
      if (!alive) return
      if (sessErr) {
        setMessage({ type: 'error', text: sessErr.message })
      } else if (!data?.session) {
        setMessage({ type: 'error', text: 'Invalid or expired recovery link.' })
      }
      setReady(true)
    })()
    return () => { alive = false }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    if (!supabase) {
      setMessage({ type: 'error', text: 'Supabase is not configured.' })
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Password updated! Redirecting to login…' })
      setTimeout(() => navigate('/login'), 2500)
    }
  }

  return (
    <div className={styles.container}>
      <h2>Set a new password</h2>

      {message && (
        <div className={message.type === 'error' ? styles.error : styles.success}>
          {message.text}
        </div>
      )}

      {ready ? (
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            New Password
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </label>
          <button type="submit">Change Password</button>
        </form>
      ) : (
        <p style={{ marginTop: 8 }}>Preparing reset form…</p>
      )}
    </div>
  )
}

export default ResetPassword
