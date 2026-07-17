'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import Button from '../../../components/ui/Button'

const categories = ['Tech', 'Health', 'Finance', 'Sports', 'AI', 'Business', 'Science', 'Lifestyle']

export default function InterestsPage() {
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Check if user is logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
    })
  }, [])

  const toggle = (cat) => {
    if (selected.includes(cat)) {
      setSelected(selected.filter(c => c !== cat))
    } else {
      setSelected([...selected, cat])
    }
  }

  const handleContinue = async () => {
    if (selected.length < 3) {
      alert('Please select at least 3 categories!')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const entries = selected.map(cat => ({ user_id: user.id, category: cat }))
      const { error } = await supabase.from('user_interests').insert(entries)
      
      setLoading(false)
      if (error) {
        alert(error.message)
      } else {
        router.push('/feed')
      }
    } else {
      setLoading(false)
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
        <h1 className="text-3xl font-bold text-white text-center mb-2">Select Interests</h1>
        <p className="text-white/70 text-center mb-6">Pick at least 3 topics you love.</p>
        
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => toggle(cat)}
              className={`px-5 py-2 rounded-full border-2 text-sm font-medium transition-all duration-200 ${
                selected.includes(cat)
                  ? 'bg-teal-500 text-white border-teal-500 shadow-lg scale-105'
                  : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="mt-8 flex justify-center">
          <Button onClick={handleContinue} className="px-10" disabled={loading}>
            {loading ? 'Saving...' : 'Continue →'}
          </Button>
        </div>
      </div>
    </div>
  )
}