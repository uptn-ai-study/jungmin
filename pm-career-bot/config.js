require('dotenv').config();

module.exports = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  BRIEFING_HOUR: 8,
  BRIEFING_MINUTE: 0,
  RSS_FEEDS: {
    korea: [
      'https://www.platum.kr/feed',
      'https://feeds.feedburner.com/GeekNews',
      'https://rss.etnews.com/Section901.xml',
      'https://www.zdnet.co.kr/rss/rss.aspx',
      'https://www.bloter.net/feed',
      'https://www.ddaily.co.kr/rss/allArticle.xml',
      'https://it.chosun.com/site/data/rss/rss.xml',
    ],
    product: [
      'https://www.producthunt.com/feed',
    ],
  },
};
