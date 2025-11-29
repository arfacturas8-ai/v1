import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div id="main-content" role="main" aria-label="404 Page Not Found" className="min-h-screen flex items-center justify-center bg-[#0d1117] px-4 sm:px-5">
      <div className="text-center text-white max-w-2xl">
        <div
          className="text-[80px] sm:text-[120px] font-bold leading-none mb-4 sm:mb-5 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent"
          aria-hidden="true"
        >
          404
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6">
          Page Not Found
        </h1>

        <p className="text-base sm:text-lg opacity-90 mb-6 sm:mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <nav className="flex gap-4 justify-center flex-wrap" aria-label="Error page actions">
          <Link
            to="/"
            className="px-6 py-3 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] text-white rounded-xl no-underline font-semibold text-base shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all hover:scale-105"
            aria-label="Back to Home page"
          >
            ← Back to Home
          </Link>

          <Link
            to="/help"
            className="px-6 py-3 bg-[#161b22]/60 backdrop-blur-xl backdrop-blur-xl text-[#58a6ff] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] no-underline font-semibold text-base transition-all hover:bg-[#161b22]/60 backdrop-blur-xl"
            aria-label="Get help"
          >
            Get Help
          </Link>
        </nav>

        <div className="mt-8 sm:mt-10 text-sm text-[#8b949e]">
          <p>Lost? Try searching or visit our <Link to="/communities" className="text-[#58a6ff] underline">communities page</Link></p>
        </div>
      </div>
    </div>
  )
}


