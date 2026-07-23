'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const router = useRouter()

  // 🔥 Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sumly_recent_searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5))
    }
  }, [])

  const handleSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      alert('Please enter at least 2 characters')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setResults(data)
        // Save to recent searches
        const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
        setRecentSearches(updated)
        localStorage.setItem('sumly_recent_searches', JSON.stringify(updated))
      } else {
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSearch(query)
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
  }

  const handleSave = async (summaryId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    
    // Simple toggle save (will optimize later)
    const { data: existing } = await supabase
      .from('saved_news')
      .select('id')
      .eq('user_id', user.id)
      .eq('summary_id', summaryId)
      .single()

    if (existing) {
      await supabase.from('saved_news').delete().eq('id', existing.id)
    } else {
      await supabase.from('saved_news').insert({ user_id: user.id, summary_id: summaryId })
    }
    // Refresh results to update save state
    handleSearch(query)
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

  return (
    <div className="min-h-screen bg-[#0a0a0b] pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        
        {/* 🔥 Header */}
        <h1 className="text-2xl font-bold text-white mb-4">🔍 Search</h1>

        {/* 🔥 Search Bar */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Search articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-3 rounded-full bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            autoFocus
          />
          <button
            onClick={() => handleSearch(query)}
            className="px-4 py-3 rounded-full bg-purple-600/30 hover:bg-purple-600/50 text-white text-sm font-medium transition border border-purple-500/30"
          >
            Search
          </button>
          {query && (
            <button
              onClick={handleClear}
              className="px-3 py-3 rounded-full bg-white/5 text-zinc-400 hover:text-white transition"
            >
              ✕
            </button>
          )}
        </div>

        {/* 🔥 Recent Searches */}
        {!loading && results.length === 0 && recentSearches.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-zinc-500 mb-2">Recent searches</p>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(item)
                    handleSearch(item)
                  }}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 🔥 Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}

        {/* 🔥 Results */}
        {!loading && results.length === 0 && query && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
            <p className="text-white/70">No results found for "{query}"</p>
            <p className="text-zinc-500 text-sm mt-2">Try different keywords</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 mb-2">{results.length} results found</p>
            {results.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 hover:bg-white/10 transition"
              >
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">{item.category}</span>
                <h3 className="text-lg font-semibold mt-1 text-white">{item.title}</h3>
                <p className="text-sm text-zinc-300 mt-1 line-clamp-2">{item.summary}</p>
                <div className="mt-3 flex items-center justify-between">
                  <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-white transition">
                    {item.source_name || 'Unknown Source'}
                  </a>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSave(item.id)}
                      className="text-zinc-400 hover:text-yellow-400 transition"
                    >
                      ☆
                    </button>
                    <button
                      onClick={() => handleShare(item.title, item.summary, item.source_url)}
                      className="text-zinc-400 hover:text-white transition"
                    >
                      ↗
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}