'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function DeviceSelectPage() {
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login')
      } else {
        setLoading(false)
      }
    })
  }, [])

  const selectDevice = (device) => {
    setSelected(device)
    localStorage.setItem('device_preference', device)
    // Thoda delay taake user ko feedback mile
    setTimeout(() => {
      router.push('/interests')
    }, 400)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-sans antialiased relative overflow-hidden bg-[#0a0a0b]">
      
      {/* Background Beams */}
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1)_0%,transparent_40%)] pointer-events-none"></div>
      <div aria-hidden="true" className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Card */}
      <main className="w-full max-w-[420px] px-6 z-10">
        <div 
          className="rounded-[40px] px-8 py-12 flex flex-col items-center"
          style={{
            background: 'linear-gradient(165deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 40%, rgba(255, 255, 255, 0.05) 100%)',
            backdropFilter: 'blur(64px) saturate(220%)',
            WebkitBackdropFilter: 'blur(64px) saturate(220%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: 'rgba(139, 92, 246, 0.15) 0px 0px 80px, rgba(255, 255, 255, 0.1) 0px 0px 30px inset, rgba(255, 255, 255, 0.4) 0px 1px 0px inset, rgba(255, 255, 255, 0.1) 0px -1px 0px inset'
          }}
        >
          {/* Header */}
          <header className="text-center mb-8">
            {/* Logo */}
            <div className="mb-4 flex justify-center">
              <svg className="text-white" fill="none" height="40" viewBox="0 0 40 40" width="40" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4C20.5523 4 21 4.44772 21 5C21 5.55228 20.5523 6 20 6C19.4477 6 19 5.55228 19 5C19 4.44772 19.4477 4 20 4Z" fill="currentColor" />
                <path d="M28 6.14355C28.2761 6.14355 28.5 6.36741 28.5 6.64355C28.5 6.9197 28.2761 7.14355 28 7.14355C27.7239 7.14355 27.5 6.9197 27.5 6.64355C27.5 6.36741 27.7239 6.14355 28 6.14355Z" fill="currentColor" />
                <path d="M12 6.14355C12.2761 6.14355 12.5 6.36741 12.5 6.64355C12.5 6.9197 12.2761 7.14355 12 7.14355C11.7239 7.14355 11.5 6.9197 11.5 6.64355C11.5 6.36741 11.7239 6.14355 12 6.14355Z" fill="currentColor" />
                <circle cx="20" cy="20" fill="currentColor" r="2" />
                <circle cx="28" cy="12" fill="currentColor" r="1.5" />
                <circle cx="12" cy="12" fill="currentColor" r="1.5" />
                <circle cx="32" cy="20" fill="currentColor" r="1.5" />
                <circle cx="8" cy="20" fill="currentColor" r="1.5" />
                <circle cx="28" cy="28" fill="currentColor" r="1.5" />
                <circle cx="12" cy="28" fill="currentColor" r="1.5" />
                <circle cx="20" cy="32" fill="currentColor" r="1.5" />
              </svg>
            </div>
            <h1 className="text-white text-2xl font-bold mb-2 tracking-tight">Select Device</h1>
            <p className="text-zinc-400 text-sm">Choose how you want to view your feed.</p>
          </header>

          {/* Device Options */}
          <div className="w-full space-y-4">
            {/* Mobile Option */}
            <button
              onClick={() => selectDevice('mobile')}
              className={`w-full flex items-center justify-center gap-4 py-4 rounded-xl transition-all duration-300 ${
                selected === 'mobile'
                  ? 'bg-white text-[#0a0a0b] shadow-lg shadow-purple-900/20'
                  : 'bg-[#2a2a2e]/50 text-zinc-300 hover:bg-[#2a2a2e] border border-zinc-800'
              }`}
            >
              <span className="text-2xl"></span>
              <span className="font-medium">Mobile View</span>
              <span className="text-xs text-zinc-500">(1 column)</span>
            </button>

            {/* Desktop Option */}
            <button
              onClick={() => selectDevice('desktop')}
              className={`w-full flex items-center justify-center gap-4 py-4 rounded-xl transition-all duration-300 ${
                selected === 'desktop'
                  ? 'bg-white text-[#0a0a0b] shadow-lg shadow-purple-900/20'
                  : 'bg-[#2a2a2e]/50 text-zinc-300 hover:bg-[#2a2a2e] border border-zinc-800'
              }`}
            >
              <span className="text-2xl"></span>
              <span className="font-medium">Desktop View</span>
              <span className="text-xs text-zinc-500">(3 columns)</span>
            </button>

            {/* Footer Note */}
            <p className="text-center text-xs text-zinc-500 mt-4">
              You can change this later from settings
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}