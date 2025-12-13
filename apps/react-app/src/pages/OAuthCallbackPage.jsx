import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('processing') // processing, success, error
  const [message, setMessage] = useState('Completing authentication...')

  useEffect(() => {
    handleOAuthCallback()
  }, [])

  const handleOAuthCallback = async () => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const provider = searchParams.get('provider') || 'oauth'

    if (error) {
      setStatus('error')
      setMessage(`Authentication failed: ${error}`)
      setTimeout(() => navigate('/login'), 3000)
      return
    }

    if (!code) {
      setStatus('error')
      setMessage('Missing authentication code')
      setTimeout(() => navigate('/login'), 3000)
      return
    }

    try {
      const response = await fetch('/api/auth/oauth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code,
          state,
          provider
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setStatus('success')
        setMessage('Authentication successful! Redirecting...')

        // Check if this is a new user that needs onboarding
        if (data.isNewUser) {
          setTimeout(() => navigate('/onboarding'), 1500)
        } else {
          setTimeout(() => navigate('/home'), 1500)
        }
      } else {
        const data = await response.json()
        setStatus('error')
        setMessage(data.message || 'Authentication failed')
        setTimeout(() => navigate('/login'), 3000)
      }
    } catch (err) {
      console.error('OAuth callback error:', err)
      setStatus('error')
      setMessage('An error occurred during authentication')
      setTimeout(() => navigate('/login'), 3000)
    }
  }
  const bgGradient = status === 'success'
    ? 'from-emerald-600 to-emerald-700'
    : status === 'error'
    ? 'from-red-600 to-red-700'
    : 'from-[#58a6ff] to-[#a371f7]'

  return (
    <div role="main" aria-label="OAuth callback page" className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${bgGradient} p-4 md:p-5 transition-all duration-500`}>
      <div className="text-center text-white max-w-md mx-auto">
        <div className="relative inline-flex items-center justify-center w-20 md:w-[100px] h-20 md:h-[100px] bg-white/20 backdrop-blur-xl rounded-full mb-6 md:mb-8 backdrop-blur-md">
          {status === 'processing' && (
            <>
              <Loader className="w-9 md:w-12 h-9 md:h-12 " />
              <div className="absolute inset-0 rounded-full border-4 border-white/10 border-t-white " style={{ animationDuration: '2s' }} />
            </>
          )}
          {status === 'success' && (
            <CheckCircle className="w-12 h-12 animate-scale-in" />
          )}
          {status === 'error' && (
            <XCircle className="w-12 h-12 animate-scale-in" />
          )}
        </div>

        <h1 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 drop-shadow-lg">
          {status === 'processing' && 'Authenticating...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Authentication Failed'}
        </h1>

        <p className="text-base md:text-lg opacity-95 leading-relaxed mb-6 md:mb-8">
          {message}
        </p>

        {status === 'processing' && (
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-2 h-2 rounded-full bg-[#141414] animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 rounded-full bg-[#141414] animate-bounce" style={{ animationDelay: '0.16s' }} />
            <div className="w-2 h-2 rounded-full bg-[#141414] animate-bounce" style={{ animationDelay: '0.32s' }} />
          </div>
        )}

        {status === 'error' && (
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-white text-red-500 border-0 rounded-xl text-base font-semibold cursor-pointer shadow-lg transition-transform hover:scale-105"
            aria-label="Return to login"
          >
            Return to Login
          </button>
        )}

        <div className="mt-8 md:mt-10 text-xs md:text-sm opacity-80">
          <p>Please do not close this window</p>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease;
        }
      `}</style>
    </div>
  )
}

