'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

// ========================
// 🔥 FALLBACK FACTS
// ========================
const FALLBACK_FACTS = [
  "A jellyfish is 95% water.",
  "Octopuses have three hearts.",
  "Bananas are berries, but strawberries aren't.",
  "A day on Venus is longer than a year on Venus.",
  "Honey never spoils. Archaeologists found 3,000-year-old honey in Egypt.",
  "A group of flamingos is called a 'flamboyance'.",
  "The average person walks the equivalent of three times around the world in a lifetime.",
  "An octopus has three hearts and blue blood.",
  "The average person reads only 28% of the words on a web page.",
  "AI can summarize a 300-page novel in under 5 seconds.",
  "Reading summaries can double your daily news intake without extra time.",
  "Curated knowledge is 70% more likely to be remembered than random facts.",
  "Over 4.5 billion people use the internet daily, but only 1% read past the headline.",
  "AI-powered summarization reduces information overload by 40%.",
  "People who read summaries daily save over 20 hours per month.",
  "The shortest war in history lasted only 38 minutes.",
  "A single cup of coffee contains over 1,000 different chemical compounds.",
  "The first computer virus was created in 1983 and was called 'Elk Cloner'.",
  "Wombat poop is cube-shaped.",
  "The average person spends about 6 months of their life waiting for red lights to turn green."
]

// ========================
// 🔥 FETCH FACTS FROM APIs
// ========================
async function fetchMixedFacts(count = 10) {
  const facts = []
  const half = Math.ceil(count / 2)

  const uselessPromises = Array.from({ length: half }, () =>
    fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en')
      .then(res => res.ok ? res.json() : null)
      .catch(() => null)
  )

  const usefulPromises = Array.from({ length: count - half }, () =>
    fetch('http://numbersapi.com/random/trivia?json')
      .then(res => res.ok ? res.json() : null)
      .catch(() => null)
  )

  const results = await Promise.allSettled([...uselessPromises, ...usefulPromises])

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const data = result.value
      const text = data.text || data.data || data.fact
      if (text && text.length > 10) {
        facts.push(text)
      }
    }
  }

  if (facts.length === 0) {
    return FALLBACK_FACTS.slice(0, count)
  }

  return facts.sort(() => Math.random() - 0.5).slice(0, count)
}

export default function FeedPage() {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [allCategories, setAllCategories] = useState([])
  const [savedIds, setSavedIds] = useState([])
  const [factCards, setFactCards] = useState([])
  const router = useRouter()

  const handleSave = async (summaryId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    
    if (savedIds.includes(summaryId)) {
      await supabase.from('saved_news').delete().eq('user_id', user.id).eq('summary_id', summaryId)
      setSavedIds(savedIds.filter(id => id !== summaryId))
    } else {
      await supabase.from('saved_news').insert({ user_id: user.id, summary_id: summaryId })
      setSavedIds([...savedIds, summaryId])
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: savedData } = await supabase
        .from('saved_news')
        .select('summary_id')
        .eq('user_id', user.id)
      setSavedIds(savedData?.map(d => d.summary_id) || [])

      const { data: interests } = await supabase
        .from('user_interests')
        .select('category')
        .eq('user_id', user.id)
      const categories = interests?.map(i => i.category) || []
      const uniqueCategories = [...new Set(categories)]
      setAllCategories(['All', ...uniqueCategories])

      let query = supabase.from('summaries').select('*')
      if (uniqueCategories.length > 0) {
        query = query.in('category', uniqueCategories)
      }
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) {
        console.error(error)
      } else {
        setSummaries(data || [])
      }

      setLoading(false)

      if (data && data.length > 0) {
        const needed = Math.ceil(data.length / 2) + 2
        fetchMixedFacts(needed).then(facts => {
          setFactCards(facts)
        })
      }
    }

    fetchData()
  }, [])

// 🔥 UPDATE STATS (Score + Streak) - WITH DEBUG LOGS
useEffect(() => {
  const updateStats = async () => {
    console.log("📡 Sending stats update...")
    try {
      const response = await fetch('/api/stats', { method: 'POST' })
      const data = await response.json()
      console.log("📡 Stats API Response:", data)
      
      if (data.success) {
        console.log('✅ Stats updated successfully!')
      } else {
        console.error('❌ Stats update failed:', data.error)
      }
    } catch (e) {
      console.error('⚠️ Stats update crashed:', e)
    }
  }
  updateStats()
}, [])

  const filteredSummaries = selectedCategory === 'All'
    ? summaries
    : summaries.filter(item => item.category === selectedCategory)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleShare = async (title, summary, url) => {
    const shareData = { title, text: summary, url }
    if (navigator.share) {
      try { await navigator.share(shareData) }
      catch (err) { if (err.name !== 'AbortError') console.error(err) }
    } else {
      try { await navigator.clipboard.writeText(url); alert('✅ Link copied!') }
      catch { alert('Copy this link: ' + url) }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }

  let factIndex = 0

  return (
    // 🔥 pb-24 added to prevent bottom nav overlap
    <div className="min-h-screen bg-[#0a0a0b] overflow-y-scroll relative pb-24">
      
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1)_0%,transparent_40%)] pointer-events-none"></div>
      <div aria-hidden="true" className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 🔥 HEADER - Categories ONLY (Search Bar Hata Diya) */}
      <div className="sticky top-0 z-20 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex justify-between items-center px-4 py-3">
          
          {/* 🔥 Categories - Mobile Fixed (Horizontal Scroll) */}
          <div className="flex gap-3 overflow-x-auto pb-1 flex-1 min-w-0 hide-scrollbar">
            {allCategories.length > 0 ? (
              allCategories.map((cat, index) => (
                <button
                  key={`${cat}-${index}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-white text-[#0a0a0b] shadow-lg shadow-purple-900/20'
                      : 'bg-[#2a2a2e]/50 text-zinc-300 hover:bg-[#2a2a2e] border border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))
            ) : (
              <span className="text-zinc-500 text-sm px-2">No interests selected</span>
            )}
          </div>

          {/* 🔥 Right Side: Profile & Leaderboard */}
          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
            <button onClick={() => router.push('/profile')} className="px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300">
              Profile
            </button>
            <button onClick={() => router.push('/leaderboard')} className="px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300">
              Leaderboard
            </button>
          </div>
        </div>
      </div>

      {/* ========== FEED CONTENT ========== */}
      <div className="max-w-2xl mx-auto px-4 py-4 relative z-10 space-y-4">

        {filteredSummaries.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
            <p className="text-white/70">No summaries found for {selectedCategory}.</p>
          </div>
        ) : (
          filteredSummaries.flatMap((item, index) => {
            const elements = []

            elements.push(
              <div
                key={`summary-${item.id}`}
                className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.15)] border border-white/10 overflow-hidden flex flex-col animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
              >
                <div className="w-full h-56 lg:h-72 bg-gray-800 flex-shrink-0 overflow-hidden relative">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML = `
                          <div class="flex flex-col items-center justify-center w-full h-full bg-[#1e293b] text-zinc-500">
                            <span class="text-5xl mb-2">📰</span>
                            <span class="text-sm">No Image</span>
                          </div>
                        `
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-[#1e293b] text-zinc-500">
                      <span className="text-5xl mb-2">📰</span>
                      <span className="text-sm">No Image</span>
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">{item.category}</span>
                  <h3 className="text-xl lg:text-2xl font-bold mt-1 text-white leading-snug">{item.title}</h3>
                  <p className="text-sm lg:text-base text-zinc-300 mt-2 leading-relaxed flex-grow">{item.summary}</p>
                  
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 flex-shrink-0">
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-zinc-400 hover:text-white transition truncate max-w-[40%]">
                      {item.source_name || 'Unknown Source'}
                    </a>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleSave(item.id)}
                        className={`w-8 h-8 rounded-full backdrop-blur-md transition-all duration-300 flex items-center justify-center border ${
                          savedIds.includes(item.id)
                            ? 'bg-white/20 border-white/30 text-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/20 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                        }`}
                        aria-label="Save article"
                      >
                        {savedIds.includes(item.id) ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                          </svg>
                        )}
                      </button>

                      <button
                        onClick={() => handleShare(item.title, item.summary, item.source_url)}
                        className="w-8 h-8 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-zinc-400 hover:text-white hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 flex items-center justify-center"
                        aria-label="Share"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Z" />
                        </svg>
                      </button>

                      <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs text-zinc-400 hover:text-white hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300">
                        Read ↗
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )

            if ((index + 1) % 2 === 0 && factIndex < factCards.length) {
              const factText = factCards[factIndex]
              factIndex++
              elements.push(
                <div
                  key={`fact-${item.id}-${index}`}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.15)] p-5 animate-slide-up"
                  style={{ animationDelay: `${(index + 0.5) * 0.1}s`, opacity: 0 }}
                >
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">Did you know?</p>
                  <p className="text-base text-zinc-300 leading-relaxed mt-1">{factText}</p>
                </div>
              )
            }

            return elements
          })
        )}
      </div>
    </div>
  )
}