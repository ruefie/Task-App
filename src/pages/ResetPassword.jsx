// src/pages/ResetPassword.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import styles from '../styles/ResetPassword.module.scss'

 function ResetPassword() {
  const navigate = useNavigate()
  const { search, hash } = useLocation()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState(null) // { type: 'error'|'success', text }

  // STEP A: grab tokens from URL and set session
  // useEffect(() => {
  //   const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : search)
  //   const access_token  = params.get('access_token')
  //   const refresh_token = params.get('refresh_token')
  //   if (access_token && refresh_token) {
  //     supabase.auth
  //       .setSession({ access_token, refresh_token })
  //       .then(({ error }) => {
  //         if (error) setMessage({ type: 'error', text: error.message })
  //       })
  //   } else {
  //     setMessage({ type: 'error', text: 'Invalid recovery link.' })
  //   }
  // }, [search, hash])

  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true })
      if (error) {
        setMessage({ type: 'error', text: error.message })
      }
      // if no error, the session is now in memory and you can call updateUser…
    })()
  }, [])

  // STEP B: submit new password
  const handleSubmit = async e => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Password updated! Redirecting to login…' })
      setTimeout(() => navigate('/login'), 3000)
    }
  }

  return (
    <div className={styles.container}>
      <h2>Reset your password</h2>
      {message && (
        <div className={message.type === 'error' ? styles.error : styles.success}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.form}>
        <label>
          New Password
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
        </label>
        <label>
          Confirm Password
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit">Change Password</button>
      </form>
    </div>
  )
}

export default ResetPassword;