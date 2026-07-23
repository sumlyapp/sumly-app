import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// 🔥 Pakistan Timezone (UTC+5)
function getPKTDate() {
  const now = new Date()
  const pktTime = new Date(now.getTime() + 5 * 60 * 60 * 1000)
  return pktTime.toISOString().split('T')[0]
}

function getPKTYesterday() {
  const now = new Date()
  const pktTime = new Date(now.getTime() + 5 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000)
  return pktTime.toISOString().split('T')[0]
}

export async function POST(request) {
  console.log("🔄 /api/stats called")

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
          // No-op
        },
        remove(name, options) {
          // No-op
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error("❌ Auth error:", userError?.message || "No user")
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log(`👤 User: ${user.email}`)

  const today = getPKTDate()
  const yesterday = getPKTYesterday()
  console.log(`📅 Today: ${today}, Yesterday: ${yesterday}`)

  // 🔥 1. Fetch or Create Profile
  let { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // 🔥 If no profile, CREATE ONE (auto-create fallback)
  if (fetchError && fetchError.code === 'PGRST116') {
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

  if (fetchError) {
    console.error("❌ Fetch error:", fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const lastActive = profile.last_active || today
  let newStreak = profile.streak || 0
  let newScore = profile.score || 0
  let newDailyCount = profile.daily_count || 0

  // 🔥 2. Streak Logic (PKT)
  if (lastActive === today) {
    newScore += 1
    newDailyCount += 1
    console.log("🔄 Same day visit")
  } else if (lastActive === yesterday) {
    newStreak += 1
    newScore += 1
    newDailyCount = 1
    console.log(`🔄 New day (streak continued! Now ${newStreak})`)
  } else {
    newStreak = 1
    newScore += 1
    newDailyCount = 1
    console.log("🔄 Gap detected, reset to 1")
  }

  console.log(`📊 Updating: Score=${newScore}, Streak=${newStreak}, Daily=${newDailyCount}`)

  // 🔥 3. Update Profile
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

  console.log("✅ Stats updated!")
  return NextResponse.json({ success: true, profile: updated })
}