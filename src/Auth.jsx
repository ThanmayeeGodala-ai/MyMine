
import { useState } from 'react'
import { supabase } from './supabase'
import './Auth.css'

function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        })

        if (error) throw error

        if (data.session) {
          setMessage('Account created successfully! 🌷')
        } else {
          setMessage('Please check your email to confirm your account.')
        }
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>MyMine ✨</h1>
        <p>Your personal growth space 🌷</p>

        <h2>{isLogin ? 'Welcome Back!' : 'Create Your Account'}</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <button type="submit" disabled={loading}>
            {loading
              ? 'Please wait...'
              : isLogin
              ? 'Login ♡'
              : 'Sign Up ♡'}
          </button>
        </form>

        {message && <p className="auth-message">{message}</p>}

        <p>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          {' '}
          <button
            type="button"
            className="auth-toggle"
            onClick={() => {
              setIsLogin(!isLogin)
              setMessage('')
            }}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default Auth
