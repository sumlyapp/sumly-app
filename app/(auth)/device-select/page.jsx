'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function DeviceSelectPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check karo ke user logged in hai ya nahi
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login')
      } else {
        setLoading(false)
      }
    })
  }, [])

  // User ne device select kiya
  const selectDevice = (device) => {
 localStorage.setItem('device_preference', device)
   router.push('/interests') // 🔥 Interests par bhejo

  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700">
        <p className="text-white text-xl">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
        <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">📱 Select Your Device</h1>
        <p className="text-white/70 text-sm mt-2">Choose how you want to view your feed</p>

        <div className="mt-8 space-y-4">
          {/* Mobile Option */}
          <button
            onClick={() => selectDevice('mobile')}
            className="w-full py-4 px-6 bg-white/20 hover:bg-white/30 rounded-xl border border-white/30 text-white font-medium transition flex items-center justify-center gap-3"
          >
            <span className="text-3xl">📱</span>
            <span>Mobile View</span>
            <span className="text-xs text-white/50">(1 column)</span>
          </button>

          {/* Desktop Option */}
          <button
            onClick={() => selectDevice('desktop')}
            className="w-full py-4 px-6 bg-white/20 hover:bg-white/30 rounded-xl border border-white/30 text-white font-medium transition flex items-center justify-center gap-3"
          >
            <span className="text-3xl">💻</span>
            <span>Desktop View</span>
            <span className="text-xs text-white/50">(3 columns)</span>
          </button>
        </div>

        <p className="text-white/40 text-xs mt-6">You can change this later from settings</p>
      </div>
    </div>
  )
}