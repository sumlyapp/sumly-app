import requests
from supabase import create_client, Client
from groq import Groq
import os
import time
from datetime import datetime, timezone
from dotenv import load_dotenv

# ========================
# 🔥 LOAD ENVIRONMENT
# ========================
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

# ========================
# 🔥 INITIALIZE CLIENTS
# ========================
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
groq_client = Groq(api_key=GROQ_API_KEY)

# ========================
# 📌 CONFIGURATION
# ========================
CATEGORIES = [
    {"name": "Tech", "api_category": "technology"},
    {"name": "AI", "api_category": None, "query": "artificial intelligence"},
    {"name": "Health", "api_category": "health"},
    {"name": "Finance", "api_category": "business"},
    {"name": "Business", "api_category": "business"},
    {"name": "Science", "api_category": "science"},
    {"name": "Sports", "api_category": "sports"}
]

# ========================
# 📡 FETCH FROM NEWS API
# ========================
def fetch_articles(category_config):
    url = "https://newsdata.io/api/1/news"
    params = {
        "apikey": NEWS_API_KEY,
        "language": "en",
        "size": 10,
    }
    
    if category_config["api_category"]:
        params["category"] = category_config["api_category"]
    else:
        params["q"] = category_config["query"]
    
    try:
        response = requests.get(url, params=params, timeout=15)
        data = response.json()
        
        if data.get("status") != "success":
            print(f"⚠️ API Error: {data.get('message', 'Unknown error')}")
            return []
        
        results = data.get("results", [])
        articles = []
        for item in results:
            if item.get("duplicate") == True:
                print(f"  ⚠️ Duplicate skipped: {item.get('title', '')[:40]}...")
                continue
                
            articles.append({
                "title": item.get("title", "No title"),
                "description": item.get("description", ""),
                "url": item.get("link", ""),
                "image_url": item.get("image_url", ""),
                "publishedAt": item.get("pubDate", ""),
                "source_name": item.get("source_name", item.get("source_id", "Unknown Source"))
            })
        return articles
    except Exception as e:
        print(f"❌ Error fetching: {e}")
        return []

# ========================
# 🤖 GROQ SUMMARIZER (UPDATED LENGTH)
# ========================
def summarize_text(text):
    if not text or len(text) < 20:
        return "No content to summarize."
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": """You are a strict summarizer. 
                Summarize the following article in exactly 3 concise sentences (max 70 words). 
                RULES: 
                1. If the original text contains exact numbers (e.g., '45%', '2 million'), retain them exactly.
                2. Do NOT invent, guess, or approximate any numbers.
                3. If no numbers exist, simply describe the context.
                4. Keep it mobile-friendly and crisp."""},
                {"role": "user", "content": text[:4000]}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.2,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"❌ Groq Error: {e}")
        return "Summary failed."

# ========================
# 💾 SAVE TO SUPABASE
# ========================
def save_to_supabase(title, summary, source_url, category, image_url, source_name, published_at=""):
    if not image_url or len(image_url) < 10:
        image_url = "https://placehold.co/400x200/1e293b/94a3b8?text=No+Image"
    
    data = {
        "title": title[:255],
        "summary": summary,
        "source_url": source_url,
        "category": category,
        "image_url": image_url,
        "source_name": source_name,
        "published_at": published_at,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        supabase.table("summaries").insert(data).execute()
        print(f"✅ Inserted: {title[:50]}...")
        return True
    except Exception as e:
        if "duplicate key" in str(e).lower() or "unique constraint" in str(e).lower():
            print(f"  ⏭️ Already exists (duplicate skipped): {title[:40]}...")
        else:
            print(f"❌ DB Error: {e}")
        return False

# ========================
# 🚀 MAIN FUNCTION
# ========================
def main():
    print("🚀 NewsData.io Scraper Started!")
    print(f"📅 Time: {datetime.now(timezone.utc).isoformat()}")
    print("-" * 50)
    
    total_inserted = 0
    
    for cat in CATEGORIES:
        cat_name = cat["name"]
        print(f"\n📌 Fetching: {cat_name}")
        
        articles = fetch_articles(cat)
        if not articles:
            print(f"⚠️ No new articles found for {cat_name}")
            continue
        
        for idx, article in enumerate(articles):
            print(f"  📄 Processing #{idx+1}: {article['title'][:50]}...")
            
            text = article.get('description', '')
            if not text or len(text) < 50:
                print(f"  ⚠️ Description too short, skipping...")
                continue
            
            summary = summarize_text(text)
            if "failed" in summary.lower() or len(summary) < 5:
                print(f"  ⚠️ Summary failed, skipping...")
                continue
            
            success = save_to_supabase(
                title=article['title'],
                summary=summary,
                source_url=article['url'],
                category=cat_name,
                image_url=article['image_url'],
                source_name=article['source_name'],
                published_at=article.get('publishedAt', '')
            )
            
            if success:
                total_inserted += 1
            
            time.sleep(1)
    
    print("-" * 50)
    print(f"✅ Finished! Inserted {total_inserted} new summaries.")

if __name__ == "__main__":
    main()