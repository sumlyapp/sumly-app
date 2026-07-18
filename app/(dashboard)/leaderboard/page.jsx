'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function LeaderboardPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, score, streak')
        .order('score', { ascending: false })
        .limit(50)

      if (error) {
        console.error(error)
      } else {
        setUsers(data || [])
      }
      setLoading(false)
    }

    fetchLeaderboard()
  }, [])

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
          <h1 className="text-2xl font-bold text-white">🏆 Leaderboard</h1>
          <button onClick={() => router.push('/feed')} className="px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-sm text-zinc-400 hover:text-white transition">
            Feed
          </button>
        </div>

        <div className="space-y-3">
          {users.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
              <p className="text-white/70">No users yet. Be the first!</p>
            </div>
          ) : (
            users.map((user, index) => (
              <div key={user.user_id} className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 flex items-center gap-4 hover:bg-white/10 transition">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-sm font-bold text-zinc-400">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{user.username || 'Anonymous'}</p>
                  <p className="text-xs text-zinc-500">🔥 {user.streak || 0} day streak</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-purple-400">{user.score || 0}</p>
                  <p className="text-[10px] text-zinc-500">points</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}