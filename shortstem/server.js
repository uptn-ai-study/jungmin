import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname)))

// ── Helpers ────────────────────────────────────────────────

function extractVideoId(url) {
  const patterns = [
    /youtube\.com\/shorts\/([^?&/]+)/,
    /youtube\.com\/watch\?(?:.*&)?v=([^&]+)/,
    /youtu\.be\/([^?&/]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}


// 자막 가져오기 (YouTube timedtext 공개 엔드포인트)
async function fetchCaptions(videoId) {
  try {
    // 한국어 자막 우선, 없으면 영어
    for (const lang of ['ko', 'en']) {
      const res = await fetch(
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=vtt`,
        { signal: AbortSignal.timeout(5000) }
      )
      if (!res.ok) continue
      const text = await res.text()
      if (!text || text.trim().length < 20) continue
      // VTT 태그·타임스탬프 제거해서 순수 텍스트만
      const clean = text
        .replace(/WEBVTT[\s\S]*?\n\n/, '')
        .replace(/\d{2}:\d{2}:\d{2}\.\d{3} --> [\s\S]*?\n/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{2,}/g, '\n')
        .trim()
      if (clean.length > 20) return clean.slice(0, 3000)
    }
    return ''
  } catch {
    return ''
  }
}

// 3순위: 댓글에서 가격 수집
async function fetchCommentPrices(videoId) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&order=relevance&key=${process.env.YOUTUBE_API_KEY}`
    )
    if (!res.ok) return ''
    const data = await res.json()
    if (!data.items) return ''
    return data.items
      .map(item => item.snippet.topLevelComment.snippet.textDisplay)
      .filter(text => /[\d,]+\s*원|₩[\d,]+|\d+만원|\d+천원/.test(text))
      .slice(0, 20)
      .join('\n')
  } catch {
    return ''
  }
}


// 상품 추출 + 가격 추정 통합 (Gemini 1회 호출)
async function analyzeWithGemini(title, channelTitle, description, captions, commentPrices) {
  const prompt = `다음 유튜브 영상에서 추천 상품을 추출하고 가격도 함께 추정해줘.

영상 제목: "${title}"
채널명: "${channelTitle}"
영상 설명:
${description.slice(0, 4000)}
${captions ? `\n영상 자막:\n${captions}` : ''}
${commentPrices ? `\n가격 언급 댓글:\n${commentPrices}` : ''}

각 상품에 대해 아래 필드를 포함한 JSON 배열로 반환해줘:
- name: 실제 상품명만. 영상 제목·채널명·해시태그·설명 문구는 절대 상품명으로 쓰지 마. 자막 우선 참고.
- seller: 브랜드가 아닌 판매처(스토어). 예: 다이소, 올리브영, 쿠팡, 무신사. 다이소 영상이면 반드시 "다이소". 모르면 "미확인".
- category: 생활용품/뷰티/전자기기/식품/패션/기타 중 하나
- itemCode: 다이소 상품의 품번(#12345 또는 품번:12345 형식)이 있으면 문자열, 없으면 null
- price: 원 단위 정수. 아래 우선순위대로 결정:
  1순위: 설명 또는 자막에 가격이 명시된 경우 → priceSource: "description"
  2순위: 댓글에 가격이 언급된 경우 → priceSource: "comment"
  3순위: AI가 확실히 알고 있는 공식 판매가(다이소 균일가, 올리브영 정가 등 변하지 않는 가격) → priceSource: "known"
  4순위: 유사 상품 시세 기반 추정(상품은 특정되나 정확한 가격 모를 때) → priceSource: "estimated"
  가격이 0이면 안 됨.
- priceSource: 위 우선순위에 따라 "description" / "comment" / "known" / "estimated" 중 하나

상품 없으면 [] 반환. JSON 배열만, 마크다운 없이.

예시: [{"name":"전선정리클립","seller":"다이소","category":"생활용품","itemCode":"12345","price":1000,"priceSource":"known"}]`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 }
      })
    }
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error('Gemini API 오류: ' + (err.error?.message || res.status))
  }
  const data = await res.json()
  try {
    const text = data.candidates[0].content.parts[0].text.trim()
    const match = text.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0])
  } catch {}
  return []
}

// ── Main endpoint ───────────────────────────────────────────

app.post('/api/analyze', async (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'URL이 필요합니다' })

  try {
    const videoId = extractVideoId(url)
    if (!videoId) throw new Error('유효하지 않은 YouTube URL입니다.')

    // YouTube Data API로 영상 정보 가져오기
    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
    )
    if (!ytRes.ok) throw new Error('YouTube API 오류: ' + ytRes.status)
    const ytData = await ytRes.json()
    if (!ytData.items?.length) throw new Error('영상을 찾을 수 없습니다.')

    const snippet = ytData.items[0].snippet
    const thumbnail = snippet.thumbnails?.high?.url
      || snippet.thumbnails?.medium?.url
      || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    const description = snippet.description || ''
    const publishedAt = snippet.publishedAt
      ? new Date(snippet.publishedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
          .replace(/\. /g, '.').replace(/\.$/, '')
      : new Date().toLocaleDateString('ko-KR')

    // 댓글 + 자막 병렬 수집
    const [commentPrices, captions] = await Promise.all([
      fetchCommentPrices(videoId),
      fetchCaptions(videoId)
    ])

    // 상품 추출 + 가격 추정 통합 1회 호출
    const rawProducts = await analyzeWithGemini(
      snippet.title, snippet.channelTitle, description, captions, commentPrices
    )

    const products = rawProducts.map((p, i) => ({
      id: 'p_' + Date.now() + '_' + i,
      name: p.name || '(이름 없음)',
      seller: p.seller || '미확인',
      category: p.category || '기타',
      itemCode: p.itemCode || null,
      price: p.price || 0,
      priceSource: p.priceSource || 'estimated',
      memo: '',
      checked: true
    }))

    res.json({
      video: { url, title: snippet.title, thumbnail, channelName: snippet.channelTitle, publishedAt },
      products
    })

  } catch (err) {
    console.error('[analyze error]', err.message)
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 5176
app.listen(PORT, () => console.log(`쇼츠템 서버 실행 중 → http://localhost:${PORT}`))
