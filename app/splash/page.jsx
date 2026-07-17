'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SplashPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    // 🔥 Countdown timer (3, 2, 1, then redirect)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700">
      {/* Logo */}
      <div className="text-8xl mb-4">📰</div>
      
      {/* App Name */}
      <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">Summarise</h1>
      
      {/* Tagline */}
      <p className="text-white/70 text-lg mt-3">Read less, know more</p>
      
      {/* Countdown Spinner */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        <p className="text-white/50 text-sm">Redirecting in {countdown}s</p>
      </div>
    </div>
  )
}