import React, { useState, useEffect } from 'react';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f8ff] via-white to-[#f5f0ff] text-gray-900 pb-10 relative overflow-hidden">
      {/* Colorful background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-96 h-96 bg-gradient-to-br from-[#a371f7] to-[#58a6ff] rounded-full opacity-25 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] rounded-full opacity-30 blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className={`sticky top-0 z-[1000] transition-all duration-300 p-6 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-lg'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-3xl font-black bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">CRYB</span>
          </div>
          <div className="flex gap-4">
            <a href="/login" className="text-gray-700 hover:text-[#58a6ff] no-underline px-6 py-3 transition-colors font-semibold">Login</a>
            <a href="/register" className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white no-underline px-8 py-3 rounded-full font-bold shadow-[0_8px_30px_rgba(88,166,255,0.6)] hover:shadow-[0_12px_40px_rgba(88,166,255,0.8)] hover:scale-105 transition-all">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto text-center pt-32 pb-32 px-4 relative z-10">
        <div className="inline-block mb-8 px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-full shadow-lg">
          <span className="text-white font-bold text-lg">✨ Decentralized Social, Reimagined</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black leading-tight mb-10 bg-gradient-to-r from-[#58a6ff] via-[#7d8fff] to-[#a371f7] bg-clip-text text-transparent">
          Where Communities<br/>Own Themselves
        </h1>

        <p className="text-2xl md:text-3xl text-gray-700 max-w-4xl mx-auto mb-14 leading-relaxed font-medium">
          The first truly <span className="text-[#58a6ff] font-bold">decentralized social platform.</span><br/>
          Crypto-native communities with NFT membership, DAO governance, and real ownership.
        </p>

        <div className="flex gap-6 justify-center flex-wrap">
          <a href="/register" className="inline-block bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white no-underline px-12 py-5 rounded-full text-xl font-black shadow-[0_20px_60px_rgba(88,166,255,0.5)] hover:shadow-[0_25px_80px_rgba(88,166,255,0.7)] hover:scale-110 transition-all">
            Get Started Free →
          </a>
          <a href="/login" className="inline-block bg-white border-4 border-[#58a6ff] text-[#58a6ff] no-underline px-12 py-5 rounded-full text-xl font-black shadow-lg hover:bg-[#58a6ff] hover:text-white hover:scale-110 transition-all">
            Explore Platform
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-20 px-4 relative z-10">
        <div className="text-center bg-white rounded-3xl p-10 shadow-2xl border-4 border-[#58a6ff] hover:scale-110 transition-all">
          <div className="text-5xl md:text-6xl font-black text-[#58a6ff] mb-3">100K+</div>
          <div className="text-gray-700 text-lg font-bold">Active Users</div>
        </div>
        <div className="text-center bg-white rounded-3xl p-10 shadow-2xl border-4 border-[#a371f7] hover:scale-110 transition-all">
          <div className="text-5xl md:text-6xl font-black text-[#a371f7] mb-3">5K+</div>
          <div className="text-gray-700 text-lg font-bold">Communities</div>
        </div>
        <div className="text-center bg-white rounded-3xl p-10 shadow-2xl border-4 border-[#58a6ff] hover:scale-110 transition-all">
          <div className="text-5xl md:text-6xl font-black text-[#58a6ff] mb-3">10M+</div>
          <div className="text-gray-700 text-lg font-bold">Messages/Day</div>
        </div>
        <div className="text-center bg-white rounded-3xl p-10 shadow-2xl border-4 border-[#a371f7] hover:scale-110 transition-all">
          <div className="text-5xl md:text-6xl font-black text-[#a371f7] mb-3">99.99%</div>
          <div className="text-gray-700 text-lg font-bold">Uptime</div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto mt-32 text-center px-4 relative z-10">
        <h2 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">Built Different</h2>
        <p className="text-2xl md:text-3xl text-gray-700 mb-20 font-bold">Not your average social platform</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[
            { title: 'True Ownership', desc: 'Your communities, your data, your keys. On-chain forever.', icon: '🔐', color: '#58a6ff' },
            { title: 'NFT Membership', desc: 'Tokenized access. Tradeable invites. Programmable perms.', icon: '🎨', color: '#a371f7' },
            { title: 'DAO Governance', desc: 'Communities vote on everything. No centralized control.', icon: '🗳️', color: '#58a6ff' },
            { title: 'Crypto-Native', desc: 'Built-in wallets, token gates, airdrops, and DeFi.', icon: '💎', color: '#a371f7' },
            { title: 'E2E Encrypted', desc: 'Zero-knowledge proofs. Messages only you can read.', icon: '🔒', color: '#58a6ff' },
            { title: 'Earn While You Vibe', desc: 'Creator rewards, staking, yield farming on your social graph.', icon: '💰', color: '#a371f7' }
          ].map((feature, i) => (
            <div key={i} className="bg-white rounded-3xl shadow-2xl p-10 text-left hover:scale-105 transition-all border-4 border-transparent hover:border-[#58a6ff]" style={{borderColor: feature.color}}>
              <div className="text-6xl mb-6">{feature.icon}</div>
              <h3 className="text-2xl md:text-3xl font-black mb-4" style={{color: feature.color}}>{feature.title}</h3>
              <p className="text-gray-700 text-lg leading-relaxed font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-5xl mx-auto mt-32 mb-20 text-center px-4 relative z-10">
        <div className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-[3rem] p-16 shadow-[0_30px_80px_rgba(88,166,255,0.5)]">
          <h2 className="text-5xl md:text-7xl font-black mb-8 text-white">
            Ready to Own Your Space?
          </h2>
          <p className="text-2xl md:text-3xl text-white/90 mb-12 font-medium max-w-3xl mx-auto">
            Join thousands of communities building the future of social.
          </p>
          <a href="/register" className="inline-block bg-white text-[#58a6ff] no-underline px-16 py-6 rounded-full text-2xl font-black shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:scale-110 transition-all">
            Get Started Free →
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-4 border-[#58a6ff] py-12 text-center text-gray-700 text-lg font-bold mt-32 relative z-10 bg-white/80 backdrop-blur-lg">
        <p className="mb-2">© 2025 Cryb.ai</p>
        <p className="text-[#58a6ff] font-black">Building the decentralized future of social</p>
      </div>
    </div>
  );
}

