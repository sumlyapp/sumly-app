import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  // 🔥 Fetch current profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // 🔥 If no profile exists, create one (fallback)
  if (error && error.code === 'PGRST116') {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([{ 
        user_id: user.id, 
        username: user.email.split('@')[0] 
      }])
      .select()
      .single()
    
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, profile: newProfile })
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const lastActive = profile.last_active || today
  let newStreak = profile.streak || 0
  let newScore = profile.score || 0
  let newDailyCount = profile.daily_count || 0

  // 🔥 Streak Logic
  if (lastActive === today) {
    // Same day: +1 score, +1 daily count
    newScore += 1
    newDailyCount += 1
  } else if (lastActive === yesterdayStr) {
    // Next day: +1 streak, +1 score, reset daily count to 1
    newStreak += 1
    newScore += 1
    newDailyCount = 1
  } else {
    // Gap > 1 day: reset streak to 1, +1 score, reset daily count to 1
    newStreak = 1
    newScore += 1
    newDailyCount = 1
  }

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
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, profile: updated })
}