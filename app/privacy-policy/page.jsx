import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700 p-6 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 text-white">
        <h1 className="text-3xl font-bold mb-6">🔒 Privacy Policy</h1>
        <p className="text-white/70 text-sm mb-6">Last updated: July 17, 2026</p>

        <div className="space-y-4 text-white/80 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Information We Collect</h2>
            <p>We collect only the email address you provide during sign-up. No other personal information is stored.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. How We Use Your Data</h2>
            <p>Your email is used solely for authentication (login) and to personalize your feed based on your selected interests.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Supabase</strong> — Authentication and database hosting</li>
              <li><strong>Groq</strong> — AI-powered article summarization</li>
              <li><strong>NewsData.io</strong> — Fetching news articles</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Data Security</h2>
            <p>Your data is stored securely with Supabase. We do not share your email with any third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Contact</h2>
            <p>If you have any questions, please contact us at: <strong>autobyteinsights@gmail.com</strong></p>
          </section>
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/login" className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white font-medium transition">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}