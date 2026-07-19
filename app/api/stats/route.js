import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// 🔥 Pakistan Timezone (UTC+5)
const PKT_OFFSET = 5 * 60 * 60 * 1000 // 5 hours in milliseconds

function getPKTDate() {
  const now = new Date()
  const pktTime = new Date(now.getTime() + PKT_OFFSET)
  return pktTime.toISOString().split('T')[0] // YYYY-MM-DD
}

function getPKTYesterday() {
  const now = new Date()
  const pktTime = new Date(now.getTime() + PKT_OFFSET - 24 * 60 * 60 * 1000)
  return pktTime.toISOString().split('T')[0]
}

export async function POST(request) {
  console.log("🔄 Stats API called")

  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          // No-op for API routes
        },
        remove(name, options) {
          // No-op for API routes
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log("❌ No user found")
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log(`👤 User: ${user.email}`)

  const today = getPKTDate()
  const yesterday = getPKTYesterday()

  console.log(`📅 Today (PKT): ${today}, Yesterday (PKT): ${yesterday}`)

  // 🔥 Fetch or create profile
  let { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code === 'PGRST116') {
    console.log("🆕 Profile not found, creating...")
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([{ 
        user_id: user.id, 
        username: user.email.split('@')[0],
        score: 1,
        streak: 1,
        daily_count: 1,
        last_active: today
      }])
      .select()
      .single()
    
    if (insertError) {
      console.error("❌ Insert error:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
    console.log("✅ Profile created!")
    return NextResponse.json({ success: true, profile: newProfile })
  }

  if (error) {
    console.error("❌ Fetch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const lastActive = profile.last_active || today
  let newStreak = profile.streak || 0
  let newScore = profile.score || 0
  let newDailyCount = profile.daily_count || 0

  console.log(`📊 Current: Score=${newScore}, Streak=${newStreak}, Daily=${newDailyCount}, LastActive=${lastActive}`)

  // 🔥 Streak Logic (PKT Timezone)
  if (lastActive === today) {
    // Same day: +1 score, +1 daily count
    newScore += 1
    newDailyCount += 1
    console.log("🔄 Same day visit")
  } else if (lastActive === yesterday) {
    // Next day: +1 streak, +1 score, reset daily count to 1
    newStreak += 1
    newScore += 1
    newDailyCount = 1
    console.log("🔄 New day visit (streak continued!)")
  } else {
    // Gap > 1 day: reset streak to 1, +1 score, reset daily count to 1
    newStreak = 1
    newScore += 1
    newDailyCount = 1
    console.log("🔄 Gap detected, streak reset to 1")
  }

  console.log(`📊 Updated: Score=${newScore}, Streak=${newStreak}, Daily=${newDailyCount}`)

  // 🔥 Update profile
  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({
      score: newScore,
      streak: newStreak,
      daily_count: newDailyCount,
      last_active: today,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .select()
    .single()

  if (updateError) {
    console.error("❌ Update error:", updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  console.log("✅ Stats updated successfully!")
  return NextResponse.json({ success: true, profile: updated })
}