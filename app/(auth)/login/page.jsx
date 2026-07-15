'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import Button from '../../../components/ui/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    
    if (error) {
      alert(error.message)
    } else {
      router.push('/interests')
    }
  }

  const handleSignUp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    
    if (error) {
      alert(error.message)
    } else {
      alert('✅ Check your email for confirmation!')
      router.push('/interests')
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      alert('Please enter your email address first.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    
    if (error) {
      alert(error.message)
    } else {
      alert('📧 Password reset email sent! Check your inbox.')
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
          
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" 
          />

          <div className="text-right">
            <button 
              onClick={handleForgotPassword}
              className="text-sm text-white/50 hover:text-white transition"
              disabled={loading}
            >
              Forgot password?
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleLogin} className="flex-1" disabled={loading}>
              {loading ? 'Loading...' : 'Login'}
            </Button>
            <Button onClick={handleSignUp} variant="outline" className="flex-1" disabled={loading}>
              {loading ? 'Loading...' : 'Sign Up'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}