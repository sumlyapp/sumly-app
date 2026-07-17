'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabaseClient'
import Button from '../../../components/ui/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      alert(error.message)
    } else {
      router.push('/device-select')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">✨ Summarise</h1>
          <p className="text-white/70 text-sm mt-2">Read less, know more</p>
        </div>

        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" 
          />

          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 pr-12" 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-white/50 hover:text-white transition">
              Forgot password?
            </Link>
          </div>

          <Button onClick={handleLogin} className="w-full" disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </Button>

          <p className="text-center text-white/50 text-sm mt-4">
            Don't have an account?{' '}
            <Link href="/signup" className="text-white font-medium hover:underline">
              Sign Up
            </Link>
          </p>

          {/* 🔥 Privacy Policy Link - ANDAR DAALO */}
          <p className="text-center text-white/40 text-xs mt-6">
            By continuing, you agree to our{' '}
            <Link href="/privacy-policy" className="text-white/60 hover:text-white underline transition">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}