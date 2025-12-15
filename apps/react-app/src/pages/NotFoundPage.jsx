import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div id="main-content" role="main" aria-label="404 Page Not Found" className="min-h-screen flex items-center justify-center px-4 sm:px-5" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center max-w-2xl" style={{ color: 'var(--text-primary)' }}>
        <div
          className="text-[80px] sm:text-[120px] font-bold leading-none mb-4 sm:mb-5 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent"
          aria-hidden="true"
        >
          404
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6">
          Page Not Found
        </h1>

        <p className="text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <nav className="flex gap-4 justify-center flex-wrap" aria-label="Error page actions">
          <Link
            to="/"
            style={{color: "var(--text-primary)"}} className="px-6 py-3 bg-gradient-to-br from-[#58a6ff] to-[#a371f7]  rounded-xl no-underline font-semibold text-base shadow-lg transition-all hover:scale-105"
            aria-label="Back to Home page"
          >
            ← Back to Home
          </Link>

          <Link
            to="/help"
            className="px-6 py-3 bg-white text-[#58a6ff] border rounded-2xl shadow-sm no-underline font-semibold text-base transition-all"
            style={{ borderColor: 'var(--border-subtle)' }}
            aria-label="Get help"
          >
            Get Help
          </Link>
        </nav>

        <div className="mt-8 sm:mt-10 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p>Lost? Try searching or visit our <Link to="/communities" className="text-[#58a6ff] underline">communities page</Link></p>
        </div>
      </div>
    </div>
  )
}


