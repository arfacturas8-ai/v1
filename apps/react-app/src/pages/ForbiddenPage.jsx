import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] px-3 sm:px-4" role="main" aria-label="Forbidden page">
      <div className="text-center text-white max-w-2xl">
        <div className="text-[80px] sm:text-[120px] font-bold leading-none mb-5 sm:mb-6 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent" aria-hidden="true">
          403
        </div>

        <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-white">
          Access Forbidden
        </h1>

        <p className="text-base sm:text-lg text-[#c9d1d9] mb-6 sm:mb-8 leading-relaxed">
          You don't have permission to access this page.
        </p>

        <nav className="flex gap-4 justify-center flex-wrap" aria-label="Navigation">
          <button
            onClick={() => navigate(-1)}
            className="px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white border-none rounded-xl font-semibold text-base shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-pointer transition-transform hover:scale-105"
          >
            Go Back
          </button>

          <Link
            to="/"
            className="px-6 sm:px-8 py-3 sm:py-3.5 bg-[#161b22]/60 backdrop-blur-xl backdrop-blur-xl text-[#58a6ff] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] no-underline font-semibold text-base transition-all inline-block hover:bg-[#161b22]/60 backdrop-blur-xl"
          >
            Go Home
          </Link>
        </nav>
      </div>
    </div>
  )
}

