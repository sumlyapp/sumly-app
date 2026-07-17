'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function SavedPage() {
  const [saved, setSaved] = useState([])
  const [loading, setLoading] = useState(true)
  const [savedIds, setSavedIds] = useState([])
  const router = useRouter()

  const handleUnsave = async (summaryId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    
    await supabase.from('saved_news').delete().eq('user_id', user.id).eq('summary_id', summaryId)
    setSaved(saved.filter(item => item.id !== summaryId))
    setSavedIds(savedIds.filter(id => id !== summaryId))
  }

  useEffect(() => {
    const fetchSaved = async () => {
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

      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .in('id', savedData?.map(d => d.summary_id) || [])
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
      } else {
        setSaved(data || [])
      }
      setLoading(false)
    }

    fetchSaved()
  }, [])

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

  return (
    <div className="min-h-screen bg-[#0a0a0b] overflow-y-scroll relative">
      
      {/* Background Glow */}
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1)_0%,transparent_40%)] pointer-events-none"></div>
      <div aria-hidden="true" className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 🔥 HEADER - Liquid Glass Buttons */}
      <div className="sticky top-0 z-20 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex justify-between items-center px-4 py-3">
          <h1 className="text-white text-lg font-bold">Saved Articles</h1>
          <div className="flex items-center gap-3">
            {/* 🔥 FEED BUTTON - LIQUID GLASS */}
            <button 
              onClick={() => router.push('/feed')} 
              className="px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300"
            >
              Feed
            </button>
            
            {/* 🔥 LOGOUT BUTTON - LIQUID GLASS */}
            <button 
              onClick={handleLogout} 
              className="px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Saved Cards */}
      <div className="max-w-2xl mx-auto px-4 py-4 relative z-10 space-y-4">
        {saved.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
            <p className="text-white/70">No saved articles yet.</p>
            <p className="text-zinc-500 text-sm mt-2">Go to Feed and save articles you like!</p>
          </div>
        ) : (
          saved.map((item, index) => (
            <div 
              key={item.id} 
              className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.15)] border border-white/10 overflow-hidden flex flex-col animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
            >
              {/* Image */}
              {item.image_url && (
                <div className="w-full h-56 lg:h-72 bg-gray-800 flex-shrink-0 overflow-hidden">
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%231e293b'/%3E%3Ctext x='200' y='110' font-family='sans-serif' font-size='20' fill='%2394a3b8' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E"
                    }}
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6 flex flex-col flex-grow">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">{item.category}</span>
                <h3 className="text-xl lg:text-2xl font-bold mt-1 text-white leading-snug">{item.title}</h3>
                <p className="text-sm lg:text-base text-zinc-300 mt-2 leading-relaxed flex-grow">{item.summary}</p>
                
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 flex-shrink-0">
                  <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-zinc-400 hover:text-white transition truncate max-w-[40%]">
                    {item.source_name || 'Unknown Source'}
                  </a>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* 🔥 UNSAVE BUTTON - NO YELLOW, PURE WHITE GLASS */}
                    <button
                      onClick={() => handleUnsave(item.id)}
                      className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/25 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 transition-all duration-300 flex items-center justify-center"
                      aria-label="Unsave article"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={() => handleShare(item.title, item.summary, item.source_url)}
                      className="w-8 h-8 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-zinc-400 hover:text-white hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 flex items-center justify-center"
                      aria-label="Share"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Z" />
                      </svg>
                    </button>

                    {/* Read Button */}
                    <a 
                      href={item.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs text-zinc-400 hover:text-white hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300"
                    >
                      Read ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}