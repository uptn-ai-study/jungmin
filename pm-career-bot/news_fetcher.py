import feedparser
import httpx
from datetime import datetime, timedelta
from config import RSS_FEEDS


def fetch_recent_articles(hours: int = 24) -> list[dict]:
    """RSS 피드에서 최근 기사를 가져옵니다."""
    articles = []
    cutoff = datetime.now() - timedelta(hours=hours)

    for category, feeds in RSS_FEEDS.items():
        for url in feeds:
            try:
                feed = feedparser.parse(url)
                for entry in feed.entries[:5]:
                    published = None
                    if hasattr(entry, "published_parsed") and entry.published_parsed:
                        published = datetime(*entry.published_parsed[:6])

                    articles.append({
                        "category": category,
                        "title": entry.get("title", ""),
                        "link": entry.get("link", ""),
                        "summary": entry.get("summary", "")[:300],
                        "published": published,
                        "source": feed.feed.get("title", url),
                    })
            except Exception as e:
                print(f"RSS 피드 오류 {url}: {e}")

    return articles[:20]  # 최대 20개
