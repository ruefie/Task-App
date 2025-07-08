import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import styles from '../styles/ForgotPassword.module.scss'
import { Link } from 'react-router-dom'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage(
        'If that email is in our system, you’ll receive a reset link shortly.'
      )
    }
    setLoading(false)
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

export default ForgotPassword;
