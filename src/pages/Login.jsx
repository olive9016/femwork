import { useState } from 'react'
import * as AuthModule from '../context/AuthContext'

export default function Login() {
  const useAuth = AuthModule.useAuth
  const auth = useAuth()
  const { signIn, signUp, resetPassword } = auth || {}
  const [isSignUp, setIsSignUp] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (!signIn || !signUp) {
      setError('Authentication not initialized')
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        await signUp(email, password)
        setMessage('Check your email to verify your account!')
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (!resetPassword) {
      setError('Password reset not available')
      setLoading(false)
      return
    }

    try {
      await resetPassword(email)
      setMessage('Password reset email sent! Check your inbox.')
      setTimeout(() => {
        setShowForgotPassword(false)
        setMessage('')
      }, 3000)
    } catch (err) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (showForgotPassword) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #c9a87c 0%, #d4a574 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            marginBottom: '8px',
            textAlign: 'center',
            color: '#2C3E50'
          }}>
            Reset Password
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#666',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            Enter your email to receive a password reset link
          </p>

          <form onSubmit={handleForgotPassword}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#2C3E50'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0',
                  fontSize: '15px',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#c9a87c'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px',
                background: '#FFF3CD',
                border: '1px solid #FFE69C',
                borderRadius: '8px',
                color: '#856404',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            {message && (
              <div style={{
                padding: '12px',
                background: '#D4EDDA',
                border: '1px solid #C3E6CB',
                borderRadius: '8px',
                color: '#155724',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? '#999' : 'linear-gradient(135deg, #c9a87c 0%, #d4a574 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '16px',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(201, 168, 124, 0.3)'
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false)
                setError('')
                setMessage('')
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#666'
              }}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #c9a87c 0%, #d4a574 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            marginBottom: '8px',
            color: '#2C3E50'
          }}>
            FemWork
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#666'
          }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#2C3E50'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                fontSize: '15px',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#c9a87c'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#2C3E50'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                fontSize: '15px',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#c9a87c'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
            {!isSignUp && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{
                  marginTop: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#c9a87c',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Forgot password?
              </button>
            )}
          </div>

          {error && (
            <div style={{
              padding: '12px',
              background: '#FFF3CD',
              border: '1px solid #FFE69C',
              borderRadius: '8px',
              color: '#856404',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{
              padding: '12px',
              background: '#D4EDDA',
              border: '1px solid #C3E6CB',
              borderRadius: '8px',
              color: '#155724',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#999' : 'linear-gradient(135deg, #c9a87c 0%, #d4a574 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(201, 168, 124, 0.3)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>

          <div style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#666'
          }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setMessage('')
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#c9a87c',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '14px'
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}