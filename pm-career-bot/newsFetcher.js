const Parser = require('rss-parser');
const { RSS_FEEDS } = require('./config');

const parser = new Parser();

async function fetchRecentArticles() {
  const articles = [];

  for (const [category, feeds] of Object.entries(RSS_FEEDS)) {
    for (const url of feeds) {
      try {
        const feed = await parser.parseURL(url);
        const items = feed.items.slice(0, 5);
        for (const item of items) {
          articles.push({
            category,
            title: item.title || '',
            link: item.link || '',
            summary: (item.contentSnippet || item.summary || '').slice(0, 300),
            published: item.pubDate || '',
            source: feed.title || url,
          });
        }
      } catch (e) {
        console.error(`RSS 피드 오류 ${url}:`, e.message);
      }
    }
  }

  return articles.slice(0, 20);
}

module.exports = { fetchRecentArticles };
