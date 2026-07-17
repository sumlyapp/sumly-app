'use client'
import { useState } from 'react'
import Link from 'next/link'
import Button from '../../../components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendReset = async () => {
    // 🔥 Abhi sirf UI hai, functionality baad mein likhenge
    setLoading(true)
    setTimeout(() => {
      alert(`📧 Password reset link would be sent to: ${email}`)
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">🔑 Reset Password</h1>
          <p className="text-white/70 text-sm mt-2">Enter your email to receive a reset link</p>
        </div>

        <div className="space-y-4">
          {/* Email Input */}
          <input 
            type="email" 
            placeholder="Enter your email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" 
          />

          {/* Send Button */}
          <Button onClick={handleSendReset} className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          {/* Back to Login Link */}
          <p className="text-center text-white/50 text-sm mt-4">
            Remember your password?{' '}
            <Link href="/login" className="text-white font-medium hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}