'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const passwordRef = useRef(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      alert(error.message)
    } else {
      router.push('/interests') // 🔥 FIX: Interests par bhejo
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/interests' }
    })
  }

  const handleEmailKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      passwordRef.current?.focus()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-sans antialiased relative overflow-hidden bg-[#0a0a0b]">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1)_0%,transparent_40%)] pointer-events-none"></div>
      <div aria-hidden="true" className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

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
          <header className="text-center mb-8">
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
            <h1 className="text-white text-2xl font-bold mb-2 tracking-tight">Sign In</h1>
            <p className="text-zinc-400 text-sm">Please enter your details to sign in.</p>
          </header>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#2a2a2e]/50 border-none rounded-xl py-3.5 px-4 text-white placeholder-zinc-500 focus:ring-2 focus:ring-purple-500 transition-all outline-none"
                onKeyDown={handleEmailKeyDown}
                enterKeyHint="next"
              />
            </div>

            <div className="space-y-2">
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#2a2a2e]/50 border-none rounded-xl py-3.5 px-4 text-white placeholder-zinc-500 focus:ring-2 focus:ring-purple-500 transition-all outline-none pr-12"
                  enterKeyHint="go"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="text-right">
                <Link href="/forgot-password" className="text-zinc-400 text-xs hover:text-white transition-colors">Forgot Password?</Link>
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="w-full bg-white text-[#0a0a0b] hover:bg-zinc-200 font-semibold py-3.5 rounded-full transition-all duration-300 shadow-lg shadow-purple-900/20 disabled:opacity-50">
                {loading ? 'Loading...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="w-full mt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] flex-1 bg-zinc-800"></div>
              <span className="text-zinc-600 text-[10px] uppercase tracking-widest font-medium">OR</span>
              <div className="h-[1px] flex-1 bg-zinc-800"></div>
            </div>

            <button onClick={handleGoogleLogin} className="w-full bg-[#2a2a2e]/50 border border-zinc-800 hover:bg-[#2a2a2e] transition-colors py-3 rounded-xl flex items-center justify-center gap-3">
              <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-zinc-300 text-sm font-medium">Continue with Google</span>
            </button>

            <p className="text-center mt-8 text-sm text-zinc-500">
              Don't have an account? <Link href="/signup" className="text-white hover:underline transition-all">Sign up</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}