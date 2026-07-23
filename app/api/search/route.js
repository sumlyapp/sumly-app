import { rateLimit } from '@/lib/rate-limit'
import { searchQuerySchema } from '@/lib/validators'

// 🔥 NewsData.io API Key (Scraper wali hi use karo)
const NEWS_API_KEY = process.env.NEWS_API_KEY_1 || process.env.NEWS_API_KEY

export async function GET(request) {
  // 1. Rate Limiting (20 requests per minute)
  const ip = request.headers.get('x-forwarded-for') || 'anonymous'
  const { success } = await rateLimit.limit(ip)
  if (!success) {
    return new Response('Too many requests. Please slow down.', { status: 429 })
  }

  // 2. Search Query lo
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (!q || q.trim().length < 2) {
    return Response.json([])
  }

  try {
    // 3. Validate karo (SQL injection se bachne ke liye)
    const query = searchQuerySchema.parse(q)

    // 🔥 4. NewsData.io API call (Real-time search)
    const url = `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&q=${encodeURIComponent(query)}&language=en&size=15`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'success') {
      console.error('NewsData API error:', data.message)
      return Response.json({ error: data.message || 'Failed to fetch news' }, { status: 500 })
    }

    // 5. Results format karo
    const articles = data.results?.map(item => ({
      id: item.article_id || Math.random().toString(36).substring(7),
      title: item.title || 'No title',
      summary: item.description || 'No description available',
      source_url: item.link || '#',
      category: item.category?.[0] || 'General',
      image_url: item.image_url || '',
      source_name: item.source_name || item.source_id || 'Unknown Source',
    })) || []

    return Response.json(articles)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 })
  }
}