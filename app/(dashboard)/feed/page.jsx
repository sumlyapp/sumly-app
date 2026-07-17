'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function FeedPage() {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchFeed = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: interests } = await supabase
        .from('user_interests')
        .select('category')
        .eq('user_id', user.id)

      const categories = interests?.map(i => i.category) || []
      
      let query = supabase.from('summaries').select('*')
      if (categories.length > 0) {
        query = query.in('category', categories)
      }
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) {
        console.error(error)
      } else {
        setSummaries(data || [])
      }
      setLoading(false)
    }

    fetchFeed()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // 🔥 SHARE FUNCTION
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700">
        <p className="text-white text-xl">Loading your feed...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700 p-4 overflow-hidden">
      {/* 🔥 Center container, max width set for readability */}
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center py-4 mb-4">
          <h1 className="text-2xl font-bold text-white">📰 Your Feed</h1>
          <button onClick={handleLogout} className="text-sm text-white/60 hover:text-white transition">Logout</button>
        </div>

        {summaries.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center border border-white/20">
            <p className="text-white/70">No summaries found for your interests yet.</p>
          </div>
        ) : (
          // 🔥 FIX: HAMESHA 1 COLUMN (Mobile aur Desktop dono par)
          <div className="grid grid-cols-1 gap-6">
            {summaries.map((item, index) => (
              <div 
                key={item.id} 
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col animate-slide-up"
                style={{ animationDelay: `${index * 0.08}s`, opacity: 0 }}
              >
                {/* Image */}
                {item.image_url && (
                  <div className="w-full h-64 bg-gray-100 flex-shrink-0">
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23f3f4f6'/%3E%3Ctext x='200' y='110' font-family='sans-serif' font-size='20' fill='%239ca3af' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E"
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <span className="text-sm font-bold text-blue-600 uppercase tracking-wide">
                    {item.category}
                  </span>
                  <h3 className="text-2xl font-bold mt-1 text-gray-900 leading-snug">{item.title}</h3>
                  <p className="text-gray-600 text-base mt-2 leading-relaxed flex-grow">
                    {item.summary}
                  </p>
                  
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <a 
                      href={item.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline transition truncate max-w-[60%]"
                    >
                      {item.source_name || 'Unknown Source'}
                    </a>
                    
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => handleShare(item.title, item.summary, item.source_url)}
                        className="text-gray-400 hover:text-blue-600 transition p-1 rounded-full hover:bg-blue-50"
                        aria-label="Share article"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Z" />
                        </svg>
                      </button>
                      <a 
                        href={item.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-gray-400 hover:text-gray-600 transition hover:underline"
                      >
                        Read ↗
                      </a>
                    </div>
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