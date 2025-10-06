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

  useEffect(() => {
    let mounted = true

    ;(async () => {
      if (!supabase) {
        setMessage({ type: 'error', text: 'Supabase is not configured.' })
        setReady(true)
        return
      }

      // Ask Supabase to parse the recovery token from the URL and store the session.
      // Works for links like: /#/reset-password?type=recovery&access_token=...&refresh_token=...
      try {
        const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true })
        if (error) {
          // It’s OK if there’s no token to parse (e.g., user navigated here directly).
          // We check for an existing session below.
          // If the link is invalid/expired, show a friendly error.
          // console.warn('getSessionFromUrl:', error.message)
        }
      } catch {
        // ignore
      }

      // Verify we have a session (either from the token or already logged in).
      const { data, error: sessErr } = await supabase.auth.getSession()
      if (!mounted) return
      if (sessErr) {
        setMessage({ type: 'error', text: sessErr.message })
      } else if (!data?.session) {
        setMessage({ type: 'error', text: 'Invalid or expired recovery link.' })
      }
      setReady(true)
    })()

    return () => { mounted = false }
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
      setTimeout(() => navigate('/login'), 2500) // HashRouter will resolve to #/login
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

      {/* Only show the form once we’ve tried to establish a session */}
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
        <p style={{marginTop: 8}}>Preparing reset form…</p>
      )}
    </div>
  )
}

export default ResetPassword
