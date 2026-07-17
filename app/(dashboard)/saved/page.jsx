'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function SavedPage() {
  const [saved, setSaved] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchSaved = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('saved_news')
        .select('summary_id, summaries(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
      } else {
        setSaved(data?.map(item => item.summaries) || [])
      }
      setLoading(false)
    }

    fetchSaved()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700">
        <p className="text-white text-xl">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center py-4 mb-4">
          <h1 className="text-2xl font-bold text-white">🔖 Saved News</h1>
          <div className="flex gap-4">
            <button onClick={() => router.push('/feed')} className="text-sm text-white/60 hover:text-white transition">
              Feed
            </button>
            <button onClick={handleLogout} className="text-sm text-white/60 hover:text-white transition">
              Logout
            </button>
          </div>
        </div>

        {saved.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center border border-white/20">
            <p className="text-white/70">No saved articles yet.</p>
            <p className="text-white/50 text-sm mt-2">Go to Feed and save articles you like!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {saved.map((item) => (
              <div key={item.id} className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-5 hover:bg-white/20 transition">
                <span className="text-xs font-bold text-teal-300 bg-teal-500/30 px-2 py-1 rounded-full">
                  {item.category}
                </span>
                <h3 className="text-lg font-semibold mt-2 text-white">{item.title}</h3>
                <p className="text-white/70 text-sm mt-1">{item.summary}</p>
                <a href={item.source_url} target="_blank" className="text-teal-300 text-sm font-medium mt-3 inline-block hover:text-white transition">
                  Read Full Article →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}