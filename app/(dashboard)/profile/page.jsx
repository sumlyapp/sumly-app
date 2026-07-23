'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

const ALL_CATEGORIES = [
  'Tech', 'AI', 'Health', 'Finance', 'Business', 'Science', 'Sports',
  'Games', 'Crypto', 'Stocks', 'Wars', 'History', 'Remedies', 'Startups',
  'AI Tools', 'Reddit'
]

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [interests, setInterests] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [tempInterests, setTempInterests] = useState([])
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const { data: interestsData } = await supabase
        .from('user_interests')
        .select('category')
        .eq('user_id', user.id)

      const uniqueInterests = [...new Set(interestsData?.map(i => i.category) || [])]
      
      setProfile(profileData)
      setInterests(uniqueInterests)
      setTempInterests(uniqueInterests)
      setLoading(false)
    }

    fetchProfile()
  }, [])

  const toggleInterest = (category) => {
    if (tempInterests.includes(category)) {
      setTempInterests(tempInterests.filter(c => c !== category))
    } else {
      setTempInterests([...tempInterests, category])
    }
  }

  const saveInterests = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', user.id)

    if (tempInterests.length > 0) {
      const entries = tempInterests.map(cat => ({ user_id: user.id, category: cat }))
      await supabase.from('user_interests').insert(entries)
    }

    setInterests(tempInterests)
    setIsEditing(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1)_0%,transparent_40%)] pointer-events-none"></div>
      <div aria-hidden="true" className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <div className="flex gap-2">
            <button onClick={() => router.push('/feed')} className="px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300">
              Feed
            </button>
            <button onClick={() => router.push('/saved')} className="px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300">
              Saved
            </button>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.15)] border border-white/10 p-6 space-y-4">
          
          {/* 🔥 Avatar + Email (Username hata diya) */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-600/30 flex items-center justify-center text-3xl">
              {profile?.user_id?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm text-zinc-400">{profile?.user_id}</p>
            </div>
          </div>

          {/* 🔥 Stats Grid - Streak Coming Soon */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{profile?.score || 0}</p>
              <p className="text-xs text-zinc-500">Total Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-400">🔥</p>
              <p className="text-xs text-zinc-500">Streak</p>
              <p className="text-[10px] text-zinc-600">Coming Soon</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{profile?.daily_count || 0}</p>
              <p className="text-xs text-zinc-500">Today's Reads</p>
            </div>
          </div>

          {/* Interests */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-zinc-400">📌 Your Interests</p>
              {!isEditing ? (
                <button
                  onClick={() => {
                    setTempInterests(interests)
                    setIsEditing(true)
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 transition"
                >
                  ✏️ Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={saveInterests}
                    className="text-xs text-teal-400 hover:text-teal-300 transition"
                  >
                    💾 Save
                  </button>
                  <button
                    onClick={() => {
                      setTempInterests(interests)
                      setIsEditing(false)
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {isEditing ? (
                ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleInterest(cat)}
                    className={`px-3 py-1 rounded-full text-xs transition-all duration-200 ${
                      tempInterests.includes(cat)
                        ? 'bg-purple-600 text-white border border-purple-500'
                        : 'bg-white/10 text-zinc-400 border border-white/10 hover:bg-white/20'
                    }`}
                  >
                    {cat}
                    {tempInterests.includes(cat) && ' ✓'}
                  </button>
                ))
              ) : (
                interests.length > 0 ? (
                  interests.map((cat, index) => (
                    <span key={`${cat}-${index}`} className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-zinc-300">
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500">No interests selected</span>
                )
              )}
            </div>

            {!isEditing && interests.length > 0 && (
              <p className="text-[10px] text-zinc-500 mt-2">
                {interests.length} interests • Click Edit to change
              </p>
            )}
          </div>

          <button onClick={handleLogout} className="w-full mt-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/10 transition">
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}