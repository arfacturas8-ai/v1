import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <div style={{background: "var(--bg-primary)"}} className="min-h-screen flex items-center justify-center  px-3 sm:px-4" role="main" aria-label="Forbidden page">
      <div style={{color: "var(--text-primary)"}} className="text-center  max-w-2xl">
        <div className="text-[80px] sm:text-[120px] font-bold leading-none mb-5 sm:mb-6 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent" aria-hidden="true">
          403
        </div>

        <h1 style={{color: "var(--text-primary)"}} className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 ">
          Access Forbidden
        </h1>

        <p style={{color: "var(--text-primary)"}} className="text-base sm:text-lg  mb-6 sm:mb-8 leading-relaxed">
          You don't have permission to access this page.
        </p>

        <nav className="flex gap-4 justify-center flex-wrap" aria-label="Navigation">
          <button
            onClick={() => navigate(-1)}
            style={{color: "var(--text-primary)"}} className="px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  border-none rounded-xl font-semibold text-base  cursor-pointer transition-transform hover:scale-105"
          >
            Go Back
          </button>

          <Link
            to="/"
            style={{borderColor: "var(--border-subtle)"}} className="card card px-6 sm:px-8 py-3 sm:py-3.5 /60   text-[#58a6ff] border  rounded-2xl  no-underline font-semibold text-base transition-all inline-block hover: "
          >
            Go Home
          </Link>
        </nav>
      </div>
    </div>
  )
}

