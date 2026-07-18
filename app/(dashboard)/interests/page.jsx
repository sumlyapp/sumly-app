'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import Button from '../../../components/ui/Button'

// 🔥 CATEGORIES LIST
const categories = [
  'Tech', 'AI', 'Health', 'Finance', 'Business', 'Science', 'Sports',
  'Games', 'Crypto', 'Stocks', 'Wars', 'History', 'Remedies', 'Startups',
  'AI Tools',   // 🔥 NEW
  'Reddit'      // 🔥 NEW
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
          {/* 🔥 HEADER - No Dots, Simple Emoji */}
          <header className="text-center mb-8">
            <div className="text-4xl mb-3">🎯</div>
            <h1 className="text-white text-2xl font-bold mb-2 tracking-tight">Select Interests</h1>
            <p className="text-zinc-400 text-sm">Pick at least 3 topics you love.</p>
          </header>

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