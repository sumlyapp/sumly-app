'use client'
import { useRouter, usePathname } from 'next/navigation'

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  
  const isHome = pathname === '/feed' || pathname === '/'
  const isSearch = pathname === '/search'

  return (
    // 🔥 Liquid Glass - Transparent bar with blur, no black background
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
      <div className="flex items-center gap-8 px-6 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
        
        {/* 🔥 HOME BUTTON */}
        <button
          onClick={() => router.push('/feed')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 ${
            isHome 
              ? 'bg-white text-[#0a0a0b] shadow-lg shadow-purple-900/20' 
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={isHome ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span className="text-xs font-medium">Home</span>
        </button>

        {/* 🔥 SEARCH BUTTON */}
        <button
          onClick={() => router.push('/search')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 ${
            isSearch 
              ? 'bg-white text-[#0a0a0b] shadow-lg shadow-purple-900/20' 
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={isSearch ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <span className="text-xs font-medium">Search</span>
        </button>

      </div>
    </div>
  )
}