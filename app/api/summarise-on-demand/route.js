import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Groq } from 'groq-sdk'
import * as cheerio from 'cheerio'

// 🔥 GROQ API Key (Separate for summariser)
const GROQ_API_KEY = process.env.GROQ_API_KEY_SUMMARISER || process.env.GROQ_API_KEY

if (!GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY_SUMMARISER or GROQ_API_KEY in environment')
}

const groq = new Groq({ apiKey: GROQ_API_KEY })
const DAILY_LIMIT = 4

// ========================
// 🔥 SCRAPE ARTICLE TEXT
// ========================
async function fetchArticleText(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .ad, .sidebar').remove()
    
    let text = ''
    $('article, main, .content, #content, .post-content, .entry-content').each((i, el) => {
      text += $(el).text() + ' '
    })
    
    if (!text || text.length < 100) {
      text = $('body').text()
    }
    
    return text.replace(/\s+/g, ' ').trim()
  } catch (error) {
    console.error('❌ Scrape error:', error)
    return null
  }
}

// ========================
// 🤖 GENERATE SUMMARY
// ========================
async function generateSummary(text) {
  if (!text || text.length < 50) {
    return "Article content too short to summarize."
  }
  
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a strict summarizer. Summarize the following article in exactly 3-4 sentences (max 150 words). 
          RULES: 
          1. If the original text contains exact numbers, retain them exactly.
          2. Do NOT invent, guess, or approximate any numbers.
          3. Keep it mobile-friendly and crisp.`,
        },
        {
          role: 'user',
          content: text.slice(0, 8000),
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
    })
    
    return chatCompletion.choices[0]?.message?.content || "Summary generation failed."
  } catch (error) {
    console.error('❌ Groq error:', error)
    return "Summary generation failed."
  }
}

// ========================
// 🕐 PKT TIME
// ========================
function getPKTDateTime() {
  const now = new Date()
  const pkt = new Date(now.getTime() + 5 * 60 * 60 * 1000)
  return {
    date: pkt.toISOString().split('T')[0],
    full: pkt.toLocaleString('en-PK', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    })
  }
}

// ========================
// 🚀 POST HANDLER
// ========================
export async function POST(request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
          set() {},
          remove() {},
        },
      }
    )
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { url } = await request.json()
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }
    
    const pkt = getPKTDateTime()
    
    // Check rate limit
    let { data: usageData } = await supabase
      .from('user_summary_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('date', pkt.date)
      .single()
    
    const currentCount = usageData?.count || 0
    
    if (currentCount >= DAILY_LIMIT) {
      return NextResponse.json({
        error: 'limit_reached',
        message: `⚠️ Daily limit reached (${DAILY_LIMIT} summaries/day)`,
        dateTime: pkt.full,
        resetInfo: `Come back tomorrow (${pkt.date}) at 12:00 AM PKT`,
      }, { status: 429 })
    }
    
    const text = await fetchArticleText(url)
    if (!text) {
      return NextResponse.json({ error: 'Could not extract article content' }, { status: 500 })
    }
    
    const summary = await generateSummary(text)
    
    // Update usage
    if (usageData) {
      await supabase
        .from('user_summary_usage')
        .update({ count: currentCount + 1 })
        .eq('user_id', user.id)
        .eq('date', pkt.date)
    } else {
      await supabase
        .from('user_summary_usage')
        .insert({ user_id: user.id, date: pkt.date, count: 1 })
    }
    
    const remaining = DAILY_LIMIT - (currentCount + 1)
    
    return NextResponse.json({
      success: true,
      summary,
      remaining,
      limit: DAILY_LIMIT,
      message: remaining > 0 ? `✅ ${remaining} summaries remaining today` : '⚠️ Last summary for today',
    })
    
  } catch (error) {
    console.error('❌ Summarise error:', error)
    return NextResponse.json(
      { error: 'Failed to summarize article' },
      { status: 500 }
    )
  }
}