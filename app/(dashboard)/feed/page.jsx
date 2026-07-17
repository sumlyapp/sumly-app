'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function FeedPage() {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [allCategories, setAllCategories] = useState([])
  const [device, setDevice] = useState('mobile')
  const [savedIds, setSavedIds] = useState([]) // 🔥 STATE UPAR
  const router = useRouter()

  // 🔥 SAVE FUNCTION
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
    const savedDevice = localStorage.getItem('device_preference') || 'mobile'
    setDevice(savedDevice)

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch saved IDs
      const { data: savedData } = await supabase
        .from('saved_news')
        .select('summary_id')
        .eq('user_id', user.id)
      setSavedIds(savedData?.map(d => d.summary_id) || [])

      // Fetch interests
      const { data: interests } = await supabase
        .from('user_interests')
        .select('category')
        .eq('user_id', user.id)

      const categories = interests?.map(i => i.category) || []
      setAllCategories(['All', ...categories])

      // Fetch summaries
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

    fetchData()
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700">
        <p className="text-white text-xl">Loading your feed...</p>
      </div>
    )
  }

  const isDesktop = device === 'desktop'
  
  const containerClasses = isDesktop 
    ? 'h-screen snap-start flex items-center justify-center px-4'
    : 'h-screen snap-start flex items-center justify-center px-0'

  const cardClasses = isDesktop
    ? 'bg-white rounded-xl shadow-xl overflow-hidden flex flex-col w-full max-w-2xl max-h-[85vh] animate-slide-up'
    : 'bg-white rounded-xl shadow-xl overflow-hidden flex flex-col w-full h-[calc(100vh-80px)] mx-2 animate-slide-up'

  const imageHeight = isDesktop ? 'h-64' : 'h-[60%]'
  const contentMaxHeight = isDesktop ? 'max-h-[calc(85vh-18rem)]' : 'max-h-[40%]'

  return (
    <div className="h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700 overflow-y-scroll snap-y snap-mandatory">
      
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex gap-3 overflow-x-auto pb-1 flex-1 hide-scrollbar">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-white text-blue-900 shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/saved')} className="text-sm text-white/60 hover:text-white transition">
              🔖 Saved
            </button>
            <button onClick={handleLogout} className="text-sm text-white/60 hover:text-white transition">
              Logout
            </button>
          </div>
        </div>
      </div>

      {filteredSummaries.length === 0 ? (
        <div className="h-[80vh] flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center border border-white/20">
            <p className="text-white/70">No summaries found for {selectedCategory}.</p>
          </div>
        </div>
      ) : (
        filteredSummaries.map((item, index) => (
          <div key={item.id} className={containerClasses}>
            <div 
              className={cardClasses}
              style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
            >
              {/* Image */}
              {item.image_url && (
                <div className={`w-full ${imageHeight} bg-gray-100 flex-shrink-0`}>
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
              <div className={`p-6 flex flex-col flex-grow overflow-y-auto ${contentMaxHeight}`}>
                <span className="text-sm font-bold text-blue-600 uppercase tracking-wide">
                  {item.category}
                </span>
                <h3 className={`${isDesktop ? 'text-xl' : 'text-2xl'} font-bold mt-1 text-gray-900 leading-snug`}>
                  {item.title}
                </h3>
                <p className={`${isDesktop ? 'text-sm' : 'text-base'} text-gray-600 mt-2 leading-relaxed flex-grow overflow-y-auto`}>
                  {item.summary}
                </p>
                
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 flex-shrink-0">
                  <a 
                    href={item.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline transition truncate max-w-[50%]"
                  >
                    {item.source_name || 'Unknown Source'}
                  </a>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* 🔥 SAVE BUTTON */}
                    <button
                      onClick={() => handleSave(item.id)}
                      className={`text-lg transition ${savedIds.includes(item.id) ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
                      aria-label="Save article"
                    >
                      {savedIds.includes(item.id) ? '⭐' : '☆'}
                    </button>

                    <button
                      onClick={() => handleShare(item.title, item.summary, item.source_url)}
                      className="text-gray-400 hover:text-blue-600 transition p-1 rounded-full hover:bg-blue-50"
                      aria-label="Share"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
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
          </div>
        ))
      )}
    </div>
  )
}