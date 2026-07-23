'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

const categories = [
  'Tech', 'AI', 'Health', 'Finance', 'Business', 'Science', 'Sports',
  'Games', 'Crypto', 'Stocks', 'Wars', 'History', 'Remedies', 'Startups',
  'AI Tools', 'Reddit'
]

export default function InterestsPage() {
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
    })
  }, [])

  const toggle = (cat) => {
    if (selected.includes(cat)) {
      setSelected(selected.filter(c => c !== cat))
    } else {
      setSelected([...selected, cat])
    }
  }

  const handleContinue = async () => {
    if (selected.length < 3) {
      alert('Please select at least 3 categories!')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const entries = selected.map(cat => ({ user_id: user.id, category: cat }))
      const { error } = await supabase.from('user_interests').insert(entries)
      
      setLoading(false)
      if (error) {
        alert(error.message)
      } else {
        router.push('/feed')
      }
    } else {
      setLoading(false)
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-sans antialiased relative overflow-hidden bg-[#0a0a0b]">
      
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1)_0%,transparent_40%)] pointer-events-none"></div>
      <div aria-hidden="true" className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="w-full max-w-[420px] px-6 z-10">
        <div 
          className="rounded-[40px] px-8 py-12 flex flex-col items-center"
          style={{
            background: 'linear-gradient(165deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 40%, rgba(255, 255, 255, 0.05) 100%)',
            backdropFilter: 'blur(64px) saturate(220%)',
            WebkitBackdropFilter: 'blur(64px) saturate(220%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: 'rgba(139, 92, 246, 0.15) 0px 0px 80px, rgba(255, 255, 255, 0.1) 0px 0px 30px inset, rgba(255, 255, 255, 0.4) 0px 1px 0px inset, rgba(255, 255, 255, 0.1) 0px -1px 0px inset'
          }}
        >
          {/* 🔥 SIRF LOGO + SUMLY (Tagline Hata Diya) */}
          <header className="text-center mb-6">
            <div className="mb-3 flex justify-center">
              <svg width="60" height="60" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="glassGradInterest" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#4f46e5" />
                    <stop offset="50%" stop-color="#8b5cf6" />
                    <stop offset="100%" stop-color="#06b6d4" />
                  </linearGradient>
                  <filter id="glowInterest" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur"/>
                    <feMerge>
                      <feMergeNode in="blur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <circle cx="40" cy="40" r="35" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <text x="40" y="52" fontFamily="Georgia, serif" fontSize="40" fontWeight="bold" fill="url(#glassGradInterest)" textAnchor="middle" filter="url(#glowInterest)">
                  S
                </text>
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-white drop-shadow-lg tracking-tight">Sumly</h1>
          </header>

          <div className="w-full">
            <h2 className="text-white text-2xl font-bold mb-1 text-center">Select Interests</h2>
            <p className="text-zinc-400 text-sm text-center mb-6">Pick at least 3 topics you love.</p>
          </div>

          <div className="w-full space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggle(cat)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    selected.includes(cat)
                      ? 'bg-white text-[#0a0a0b] shadow-lg shadow-purple-900/20'
                      : 'bg-[#2a2a2e]/50 text-zinc-300 hover:bg-[#2a2a2e] border border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={handleContinue}
                disabled={loading}
                className="w-full bg-white text-[#0a0a0b] hover:bg-zinc-200 font-semibold py-3.5 rounded-full transition-all duration-300 shadow-lg shadow-purple-900/20 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Continue →'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}