// src/pages/Auth.jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  const { signUp, signIn } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
        setMessage('Check your email for the confirmation link!')
      } else {
        await signIn(email, password)
        setMessage('Logging in...')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f0ff 0%, #fff9f0 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        {/* Logo/Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #c9a87c 0%, #d4a574 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            FemWork
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Cycle-aware productivity for everyone
          </p>
        </div>

        {/* Toggle Sign In / Sign Up */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          background: '#f5f5f5',
          borderRadius: '8px',
          padding: '4px'
        }}>
          <button
            onClick={() => setIsSignUp(false)}
            style={{
              flex: 1,
              padding: '10px',
              background: !isSignUp ? 'white' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: !isSignUp ? 600 : 400,
              color: !isSignUp ? '#333' : '#666',
              boxShadow: !isSignUp ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            style={{
              flex: 1,
              padding: '10px',
              background: isSignUp ? 'white' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: isSignUp ? 600 : 400,
              color: isSignUp ? '#333' : '#666',
              boxShadow: isSignUp ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#333'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '15px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#333'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '15px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#c00'
            }}>
              {error}
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div style={{
              padding: '12px',
              background: '#efe',
              border: '1px solid #cfc',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#060'
            }}>
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #c9a87c 0%, #d4a574 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(201, 168, 124, 0.3)'
            }}
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Info Text */}
        <p style={{
          marginTop: '24px',
          fontSize: '12px',
          color: '#999',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          {isSignUp 
            ? 'Your data is securely synced to the cloud. You can sign in from any device.'
            : 'Your cycle data, tasks, and insights are waiting for you.'
          }
        </p>
      </div>
    </div>
  )
}