import os
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# 뉴스 RSS 피드
RSS_FEEDS = {
    "tech": [
        "https://feeds.feedburner.com/TechCrunch",
        "https://news.ycombinator.com/rss",
    ],
    "korea": [
        "https://www.platum.kr/feed",
        "https://feeds.feedburner.com/GeekNews",
        "https://rss.etnews.com/Section901.xml",
        "https://www.zdnet.co.kr/rss/rss.aspx",
        "https://www.bloter.net/feed",
        "https://www.ddaily.co.kr/rss/allArticle.xml",
        "https://it.chosun.com/site/data/rss/rss.xml",
    ],
    "product": [
        "https://www.producthunt.com/feed",
    ],
}

# 브리핑 발송 시간 (24시간 기준)
BRIEFING_HOUR = 8
BRIEFING_MINUTE = 0
