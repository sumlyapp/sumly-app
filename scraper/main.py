import requests
from supabase import create_client, Client
from groq import Groq
import os
import time
import sys
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText

# 🔥 Reddit PRAW (if installed, else fallback to search)
try:
    import praw
    PRAW_AVAILABLE = True
except ImportError:
    PRAW_AVAILABLE = False
    print("⚠️ PRAW not installed. Reddit will use NewsData.io fallback.")

# ========================
# 🔥 LOAD ENVIRONMENT
# ========================
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Reddit API Keys (Optional)
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "SumlyScraper/1.0")

# 🔥 Multiple API Keys
NEWS_API_KEYS = [
    os.getenv("NEWS_API_KEY_1"),
    os.getenv("NEWS_API_KEY_2"),
]
NEWS_API_KEYS = [key for key in NEWS_API_KEYS if key]

# ========================
# 🔥 INITIALIZE CLIENTS
# ========================
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
groq_client = Groq(api_key=GROQ_API_KEY)

# Initialize Reddit client if available
reddit_client = None
if PRAW_AVAILABLE and REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET:
    try:
        reddit_client = praw.Reddit(
            client_id=REDDIT_CLIENT_ID,
            client_secret=REDDIT_CLIENT_SECRET,
            user_agent=REDDIT_USER_AGENT
        )
        print("✅ Reddit API client initialized!")
    except Exception as e:
        print(f"⚠️ Reddit init failed: {e}")
        reddit_client = None

# ========================
# 📌 CONFIGURATION (UPDATED)
# ========================
CATEGORIES = [
    {"name": "Tech", "api_category": "technology"},
    {"name": "AI", "api_category": None, "query": "artificial intelligence"},
    {"name": "Health", "api_category": "health"},
    {"name": "Finance", "api_category": "business"},
    {"name": "Business", "api_category": "business"},
    {"name": "Science", "api_category": "science"},
    {"name": "Sports", "api_category": "sports"},
    {"name": "Games", "api_category": None, "query": "video games"},
    {"name": "Crypto", "api_category": None, "query": "cryptocurrency OR bitcoin"},
    {"name": "Stocks", "api_category": None, "query": "stock market"},
    {"name": "Wars", "api_category": None, "query": "war OR conflict"},
    {"name": "History", "api_category": None, "query": "history"},
    {"name": "Remedies", "api_category": None, "query": "health remedies OR natural remedies"},
    {"name": "Startups", "api_category": None, "query": "startups OR venture capital"},
    # 🔥 NEW
    {"name": "AI Tools", "api_category": None, "query": "AI tools OR artificial intelligence tools"},
    {"name": "Reddit", "api_category": None, "query": "reddit"},
]

# ========================
# 🔔 GMAIL ALERT
# ========================
def send_gmail(subject, body):
    gmail_email = os.getenv("GMAIL_EMAIL")
    gmail_app_password = os.getenv("GMAIL_APP_PASSWORD")
    alert_email = os.getenv("ALERT_EMAIL")
    
    if not gmail_email or not gmail_app_password or not alert_email:
        print("⚠️ Gmail not configured")
        return
    
    try:
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = gmail_email
        msg['To'] = alert_email
        
        smtp = smtplib.SMTP('smtp.gmail.com', 587)
        smtp.starttls()
        smtp.login(gmail_email, gmail_app_password)
        smtp.send_message(msg)
        smtp.quit()
        print(f"✅ Email sent: {subject}")
    except Exception as e:
        print(f"❌ Email error: {e}")

def get_pkt_time():
    utc_now = datetime.now(timezone.utc)
    pkt_now = utc_now + timedelta(hours=5)
    return pkt_now.strftime("%Y-%m-%d %I:%M:%S %p")

def send_start_alert():
    send_gmail(
        "🚀 Sumly Scraper Started",
        f"✅ Started at {get_pkt_time()}\nCategories: {', '.join([c['name'] for c in CATEGORIES])}"
    )

def send_end_alert(total_inserted, failed_categories):
    status = "⚠️ Partial Failure" if failed_categories else "✅ Complete Success"
    send_gmail(
        "✅ Sumly Scraper Finished",
        f"Status: {status}\nTime: {get_pkt_time()}\nInserted: {total_inserted}\nFailed: {', '.join(failed_categories) if failed_categories else 'None'}"
    )

# ========================
# 📡 FETCH FROM REDDIT (Direct API)
# ========================
def fetch_reddit_posts(subreddit_name, limit=5):
    """Fetch hot posts from a subreddit using PRAW"""
    if not reddit_client:
        return []
    
    try:
        subreddit = reddit_client.subreddit(subreddit_name)
        posts = []
        for post in subreddit.hot(limit=limit):
            if not post.selftext and not post.title:
                continue
            posts.append({
                "title": post.title,
                "description": post.selftext[:500] if post.selftext else post.title,
                "url": f"https://reddit.com{post.permalink}",
                "image_url": post.url if post.url.endswith(('.jpg', '.png', '.gif')) else "",
                "publishedAt": datetime.fromtimestamp(post.created_utc).isoformat(),
                "source_name": f"r/{subreddit_name}"
            })
        return posts
    except Exception as e:
        print(f"❌ Reddit error: {e}")
        return []

# ========================
# 📡 FETCH FROM NEWS API
# ========================
def fetch_articles_with_failover(category_config):
    if not NEWS_API_KEYS:
        print("❌ No API keys configured!")
        return []
    
    # 🔥 Special handling for Reddit: Try direct Reddit API first
    if category_config["name"] == "Reddit" and reddit_client:
        print("  📡 Fetching directly from Reddit API...")
        posts = fetch_reddit_posts("all", limit=8)
        if posts:
            print(f"  ✅ Fetched {len(posts)} posts from Reddit")
            return posts
        else:
            print("  ⚠️ Reddit API returned no posts, falling back to NewsData.io...")
    
    # NewsData.io fallback for all categories (including Reddit)
    for idx, api_key in enumerate(NEWS_API_KEYS):
        articles = fetch_articles(category_config, api_key)
        if articles is not None:
            if idx > 0:
                print(f"  ✅ Switched to API Key #{idx+1}")
            return articles
        if idx < len(NEWS_API_KEYS) - 1:
            print(f"  ⚠️ API Key #{idx+1} failed, trying next...")
    
    print(f"❌ All {len(NEWS_API_KEYS)} API keys failed for {category_config['name']}")
    return []

def fetch_articles(category_config, api_key):
    url = "https://newsdata.io/api/1/news"
    params = {
        "apikey": api_key,
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
            error_msg = data.get('message') or data.get('results', {}).get('message', 'Unknown error')
            print(f"  ❌ API Error ({api_key[:10]}...): {error_msg}")
            return None
        
        results = data.get("results", [])
        articles = []
        for item in results:
            if item.get("duplicate") == True:
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
        print(f"  ❌ Request Error ({api_key[:10]}...): {e}")
        return None

# ========================
# 🤖 GROQ SUMMARIZER
# ========================
def summarize_text(text):
    if not text or len(text) < 20:
        return None
    
    placeholder_phrases = [
        "no article provided", "no content", "article not found",
        "please share the article", "no text available", "there is no article"
    ]
    
    text_lower = text.lower()
    for phrase in placeholder_phrases:
        if phrase in text_lower:
            print(f"  ⚠️ Placeholder content detected")
            return None
    
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
        return None

# ========================
# 💾 SAVE TO SUPABASE
# ========================
def save_to_supabase(title, summary, source_url, category, image_url, source_name, published_at=""):
    if not summary:
        return False
    
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
            print(f"  ⏭️ Already exists: {title[:40]}...")
        else:
            print(f"❌ DB Error: {e}")
        return False

# ========================
# 🚀 MAIN FUNCTION
# ========================
def main():
    send_start_alert()
    
    print("🚀 Sumly Scraper Started!")
    print(f"📅 Time (PKT): {get_pkt_time()}")
    print(f"🔑 {len(NEWS_API_KEYS)} API keys loaded")
    print("-" * 50)
    
    total_inserted = 0
    failed_categories = []
    
    for cat in CATEGORIES:
        cat_name = cat["name"]
        print(f"\n📌 Fetching: {cat_name}")
        
        articles = fetch_articles_with_failover(cat)
        if not articles:
            print(f"⚠️ No new articles found for {cat_name}")
            failed_categories.append(cat_name)
            continue
        
        for idx, article in enumerate(articles):
            print(f"  📄 Processing #{idx+1}: {article['title'][:50]}...")
            
            text = article.get('description', '')
            if not text or len(text) < 50:
                print(f"  ⚠️ Description too short, skipping...")
                continue
            
            summary = summarize_text(text)
            if not summary or len(summary) < 5:
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
    print(f"🕐 Finished Time (PKT): {get_pkt_time()}")
    
    send_end_alert(total_inserted, failed_categories)
    
    if failed_categories:
        print(f"🔔 ALERT: {len(failed_categories)} categories failed: {', '.join(failed_categories)}")
        sys.exit(1)

if __name__ == "__main__":
    main()