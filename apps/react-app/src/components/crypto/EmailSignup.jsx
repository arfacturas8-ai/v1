import React, { useState } from 'react'
import { Mail, Check, AlertCircle, Loader } from 'lucide-react'

function EmailSignup({ variant = 'default' }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic email validation
    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      // Simulate API call - In production, this would connect to your backend
      await new Promise(resolve => setTimeout(resolve, 1000))

      // For demo purposes, we'll always show success
      setStatus('success')
      setMessage('Thanks! You\'ll be notified when Web3 features launch.')
      setEmail('')

      // Reset status after 3 seconds
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 3000)

    } catch (error) {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')

      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 3000)
    }
  }

  const isLarge = variant === 'large'

  if (status === 'success') {
    return (
      <div style={{
        background: 'var(--color-success-light)',
        border: '1px solid var(--color-success)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)'
      }}>
        <Check style={{
          height: 'var(--icon-sm)',
          width: 'var(--icon-sm)',
          color: 'var(--color-success-dark)'
        }} />
        <div>
          <div style={{
            fontWeight: 'var(--font-medium)',
            color: 'var(--color-success-dark)',
            marginBottom: 'var(--space-1)'
          }}>
            Welcome to early access!
          </div>
          <div style={{
            color: 'var(--color-success-dark)',
            fontSize: 'var(--text-xs)'
          }}>
            {message}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: isLarge ? '28rem' : '24rem' }}>
      <form onSubmit={handleSubmit} style={{ marginBottom: 'var(--space-4)' }}>
        {/* Email Input */}
        <div style={{
          position: 'relative',
          marginBottom: 'var(--space-3)'
        }}>
          <Mail style={{
            position: 'absolute',
            left: 'var(--space-4)',
            top: '50%',
            transform: 'translateY(-50%)',
            height: 'var(--icon-sm)',
            width: 'var(--icon-sm)',
            color: 'var(--text-tertiary)'
          }} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email for early access"
            className="input"
            style={{
              width: '100%',
              paddingLeft: '44px',
              fontSize: isLarge ? 'var(--text-lg)' : 'var(--text-base)',
              padding: isLarge ? 'var(--space-4) var(--space-4) var(--space-4) 44px' : 'var(--space-3) var(--space-3) var(--space-3) 44px'
            }}
            disabled={status === 'loading'}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={status === 'loading' || !email}
          style={{
            width: '100%',
            fontSize: isLarge ? 'var(--text-lg)' : 'var(--text-base)',
            padding: isLarge ? 'var(--space-4) var(--space-6)' : 'var(--space-3) var(--space-6)'
          }}
        >
          {status === 'loading' ? (
            <>
              <Loader style={{
                height: 'var(--icon-sm)',
                width: 'var(--icon-sm)',
                animation: 'spin 1s linear infinite'
              }} />
              <span>Joining...</span>
            </>
          ) : (
            <>
              <Mail style={{
                height: 'var(--icon-sm)',
                width: 'var(--icon-sm)'
              }} />
              <span>Get Early Access</span>
            </>
          )}
        </button>

        {/* Status Message */}
        {message && status === 'error' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-3)',
            color: 'var(--color-error)',
            fontSize: 'var(--text-sm)'
          }}>
            <AlertCircle style={{
              height: 'var(--icon-sm)',
              width: 'var(--icon-sm)'
            }} />
            <span>{message}</span>
          </div>
        )}
      </form>

      {/* Benefits List - Only shown for large variant */}
      {isLarge && (
        <div style={{
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-4)'
        }}>
          <h4 style={{
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-base)',
            marginBottom: 'var(--space-3)'
          }}>
            Early Access Benefits:
          </h4>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {[
              'First access to Web3 features',
              'Exclusive beta testing opportunities',
              'Priority support and feedback',
              'Special launch rewards and NFTs'
            ].map((benefit, index) => (
              <li key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--brand-primary)',
                  flexShrink: 0
                }}></div>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Privacy Note */}
      <div style={{
        textAlign: 'center',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-tertiary)'
      }}>
        We respect your privacy. No spam, unsubscribe anytime.
      </div>
    </div>
  )
}




export default EmailSignup
