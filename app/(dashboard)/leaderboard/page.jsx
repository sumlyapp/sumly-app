'use client'
import { useRouter } from 'next/navigation'

export default function LeaderboardPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0a0a0b] relative overflow-hidden flex items-center justify-center">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1)_0%,transparent_40%)] pointer-events-none"></div>
      <div aria-hidden="true" className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10 text-center">
        <button onClick={() => router.push('/feed')} className="absolute top-0 right-4 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-sm text-zinc-400 hover:text-white transition">
          Feed
        </button>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.15)] border border-white/10 p-12">
          <div className="text-7xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-zinc-400 text-lg">Coming Soon!</p>
          <p className="text-zinc-500 text-sm mt-2">We're building something amazing. Stay tuned!</p>
        </div>
      </div>
    </div>
  )
}