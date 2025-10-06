import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import styles from '../styles/ForgotPassword.module.scss'
import { Link } from 'react-router-dom'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null) // success text
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Compute the site URL in a way that works on GH Pages (HashRouter) and locally.
  // Prefer VITE_SITE_URL if you add it as a secret; otherwise derive from BASE_URL.
  const baseUrl = (import.meta.env.VITE_SITE_URL ||
    new URL(import.meta.env.BASE_URL || '/', window.location.origin).href
  ).replace(/\/+$/, '') // no trailing slash

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (!supabase) {
        throw new Error('Supabase is not configured.')
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Important: HashRouter route
        redirectTo: `${baseUrl}/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('If that email is in our system, you’ll receive a reset link shortly.')
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h2>Reset your password</h2>

      {message && <div className={`${styles.message} ${styles.success}`}>{message}</div>}
      {error   && <div className={`${styles.message} ${styles.error}`}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <button disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <div className={styles.backLink}>
        <Link to="/login">← Back to login</Link>
      </div>
    </div>
  )
}

export default ForgotPassword
