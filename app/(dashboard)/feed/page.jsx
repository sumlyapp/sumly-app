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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700">
        <p className="text-white text-xl">Loading your feed...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700 p-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center py-4 mb-4">
          <h1 className="text-2xl font-bold text-white">📰 Your Feed</h1>
          <button 
            onClick={handleLogout}
            className="text-sm text-white/60 hover:text-white transition"
          >
            Logout
          </button>
        </div>

        {summaries.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center border border-white/20">
            <p className="text-white/70">No summaries found for your interests yet.</p>
            <p className="text-white/50 text-sm mt-2">Check back later or try different interests!</p>
          </div>
        ) : (
          // 🔥 VERTICAL CARDS: space-y-4 ensures they stack vertically
          <div className="space-y-4">
            {summaries.map((item) => (
              <div 
                key={item.id} 
                className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 hover:bg-white/20 transition overflow-hidden"
              >
                {/* 🔥 IMAGE ON TOP (Vertical Card) */}
                {item.image_url && (
                  <div className="w-full h-48 bg-gray-800">
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // 🔥 Agar image fail ho toh fallback show karo
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%231e293b'/%3E%3Ctext x='200' y='110' font-family='sans-serif' font-size='20' fill='%2394a3b8' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E"
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  <span className="text-xs font-bold text-teal-300 bg-teal-500/30 px-2 py-1 rounded-full">
                    {item.category}
                  </span>
                  
                  <h3 className="text-lg font-semibold mt-2 text-white">{item.title}</h3>
                  <p className="text-white/70 text-sm mt-1">{item.summary}</p>
                  
                  {/* 🔥 SOURCE NAME AS CLICKABLE LINK */}
                  <div className="mt-3 flex items-center justify-between">
                    <a 
                      href={item.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-teal-300 hover:text-white hover:underline transition"
                    >
                      {item.source_name || 'Unknown Source'} →
                    </a>
                    
                    {/* Alternative "Read Full Article" if you still want it */}
                    <a 
                      href={item.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-white/40 hover:text-white transition underline"
                    >
                      Read
                    </a>
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
