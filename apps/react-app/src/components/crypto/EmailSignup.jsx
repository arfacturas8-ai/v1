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
  const inputClasses = isLarge 
    ? 'input text-lg px-lg py-md' 
    : 'input px-md py-sm'
  const buttonClasses = isLarge
    ? 'btn btn-primary text-lg px-lg py-md'
    : 'btn btn-primary px-md py-sm'

  if (status === 'success') {
    return (
      <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center'
}}>
        <Check style={{
  height: '20px',
  width: '20px'
}} />
        <div>
          <div style={{
  fontWeight: '500'
}}>
            Welcome to early access!
          </div>
          <div className="text-success/80 text-xs">
            {message}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={isLarge ? 'w-full max-w-md' : 'w-full max-w-sm'}>
      <form onSubmit={handleSubmit} className="space-y-md">
        {/* Email Input */}
        <div style={{
  position: 'relative'
}}>
          <Mail style={{
  position: 'absolute'
}} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email for early access"
            style={{
  width: '100%'
}}
            disabled={status === 'loading'}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === 'loading' || !email}
          style={{
  width: '100%'
}}
        >
          {status === 'loading' ? (
            <>
              <Loader style={{
  height: '16px',
  width: '16px'
}} />
              <span>Joining...</span>
            </>
          ) : (
            <>
              <Mail style={{
  height: '16px',
  width: '16px'
}} />
              <span>Get Early Access</span>
            </>
          )}
        </button>

        {/* Status Message */}
        {message && status === 'error' && (
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <AlertCircle style={{
  height: '16px',
  width: '16px'
}} />
            <span>{message}</span>
          </div>
        )}
      </form>

      {/* Benefits List - Only shown for large variant */}
      {isLarge && (
        <div style={{
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
          <h4 style={{
  fontWeight: '600'
}}>
            Early Access Benefits:
          </h4>
          <ul className="space-y-xs text-sm text-secondary">
            <li style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div style={{
  borderRadius: '50%'
}}></div>
              <span>First access to Web3 features</span>
            </li>
            <li style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div style={{
  borderRadius: '50%'
}}></div>
              <span>Exclusive beta testing opportunities</span>
            </li>
            <li style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div style={{
  borderRadius: '50%'
}}></div>
              <span>Priority support and feedback</span>
            </li>
            <li style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div style={{
  borderRadius: '50%'
}}></div>
              <span>Special launch rewards and NFTs</span>
            </li>
          </ul>
        </div>
      )}

      {/* Privacy Note */}
      <div style={{
  textAlign: 'center'
}}>
        We respect your privacy. No spam, unsubscribe anytime.
      </div>
    </div>
  )
}




export default EmailSignup
