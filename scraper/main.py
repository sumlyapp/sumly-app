import requests
from bs4 import BeautifulSoup
from readability import Document
from supabase import create_client, Client
from groq import Groq
import os
import time
from datetime import datetime

# 🔥 Environment Variables (GitHub Secrets se aayenge)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# 🔥 Fallback for local testing (dotenv se)
try:
    from dotenv import load_dotenv
    load_dotenv()
    SUPABASE_URL = SUPABASE_URL or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    SUPABASE_KEY = SUPABASE_KEY or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    GROQ_API_KEY = GROQ_API_KEY or os.getenv("GROQ_API_KEY")
except:
    pass

# 🔥 Initialize Clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
groq_client = Groq(api_key=GROQ_API_KEY)

CATEGORIES = ["Tech", "AI", "Health", "Finance", "Business", "Science"]

def search_google_rss(category):
    """Google News RSS se articles fetch karo"""
    search_term = category.lower()
    rss_url = f"https://news.google.com/rss/search?q={search_term}&hl=en-US&gl=US&ceid=US:en"
    
    try:
        resp = requests.get(rss_url, timeout=10)
        soup = BeautifulSoup(resp.content, 'xml')
        items = soup.find_all('item')[:5]
        
        results = []
        for item in items:
            title = item.title.text if item.title else "No title"
            link = item.link.text if item.link else ""
            pub_date = item.pubDate.text if item.pubDate else ""
            results.append({"title": title, "link": link, "date": pub_date})
        return results
    except Exception as e:
        print(f"❌ Error searching {category}: {e}")
        return []

def scrape_article_text(url):
    """Article ka HTML scrape karo aur sirf main text extract karo"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        resp = requests.get(url, timeout=15, headers=headers)
        doc = Document(resp.text)
        return doc.summary()
    except Exception as e:
        print(f"❌ Error scraping {url}: {e}")
        return ""

def clean_html_to_text(html):
    """HTML se sirf text extract karo"""
    soup = BeautifulSoup(html, 'html.parser')
    return soup.get_text(separator=' ', strip=True)

def summarize_text(text):
    """Groq API se summary generate karo"""
    if not text or len(text) < 50:
        return "No content to summarize."
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a summarization AI. Summarize the following article in exactly 2-3 concise sentences. Make it informative and easy to read."},
                {"role": "user", "content": text[:4000]}
            ],
            model="llama3-8b-8192",
            temperature=0.3,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"❌ Groq Error: {e}")
        return "Summary failed to generate."

def save_to_supabase(title, summary, source_url, category, published_at=""):
    """Summary ko Supabase mein save karo"""
    data = {
        "title": title[:255],
        "summary": summary,
        "source_url": source_url,
        "category": category,
        "published_at": published_at,
        "created_at": datetime.utcnow().isoformat()
    }
    
    try:
        result = supabase.table("summaries").insert(data).execute()
        print(f"✅ Inserted: {title[:50]}...")
        return True
    except Exception as e:
        print(f"❌ DB Insert Error: {e}")
        return False

def main():
    print("🚀 Scraper Bot Started!")
    print(f"📅 Time: {datetime.utcnow().isoformat()}")
    print("-" * 50)
    
    total_inserted = 0
    
    for category in CATEGORIES:
        print(f"\n📌 Searching: {category}")
        
        articles = search_google_rss(category)
        if not articles:
            print(f"⚠️ No articles found for {category}")
            continue
        
        for idx, article in enumerate(articles[:2]):
            print(f"  📄 Processing #{idx+1}: {article['title'][:50]}...")
            
            html_content = scrape_article_text(article['link'])
            if not html_content:
                print(f"  ⚠️ Could not scrape content, skipping...")
                continue
            
            text = clean_html_to_text(html_content)
            if len(text) < 50:
                print(f"  ⚠️ Content too short, skipping...")
                continue
            
            summary = summarize_text(text)
            if "failed" in summary.lower() or len(summary) < 10:
                print(f"  ⚠️ Summary generation failed, skipping...")
                continue
            
            success = save_to_supabase(
                title=article['title'],
                summary=summary,
                source_url=article['link'],
                category=category,
                published_at=article.get('date', '')
            )
            
            if success:
                total_inserted += 1
            
            time.sleep(2)
    
    print("-" * 50)
    print(f"✅ Scraper Bot Finished! Inserted {total_inserted} new summaries.")

if __name__ == "__main__":
    main()
