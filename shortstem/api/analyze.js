export const config = { maxDuration: 60 }

const MAX_VIDEO_SECONDS = 900 // 15분

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

function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0)
}

async function fetchCaptions(videoId) {
  try {
    for (const lang of ['ko', 'en']) {
      const res = await fetch(
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=vtt`,
        { signal: AbortSignal.timeout(5000) }
      )
      if (!res.ok) continue
      const text = await res.text()
      if (!text || text.trim().length < 20) continue
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

async function fetchNaverPrice(productName) {
  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(productName)}&display=3&sort=sim`,
      {
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID.trim(),
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET.trim(),
        },
        signal: AbortSignal.timeout(3000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const items = data.items
    if (!items?.length) return null
    const prices = items.map(i => parseInt(i.lprice)).filter(p => p > 0).sort((a, b) => a - b)
    if (!prices.length) return null
    const mid = Math.floor(prices.length / 2)
    return prices.length % 2 !== 0 ? prices[mid] : Math.round((prices[mid - 1] + prices[mid]) / 2)
  } catch {
    return null
  }
}

async function enrichEstimatedPrices(products) {
  const targets = products.filter(p => p.priceSource === 'estimated')
  if (targets.length === 0) return products

  await Promise.all(
    targets.map(async p => {
      const query = (p.seller && p.seller !== '미확인')
        ? `${p.seller} ${p.name}`
        : p.name
      const naverPrice = await fetchNaverPrice(query)
      if (naverPrice) {
        p.price = naverPrice
        p.priceSource = 'naver'
      }
    })
  )
  return products
}

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

function buildProductPrompt(title, channelTitle, extraContext) {
  return `
【판매처 우선 판단】
영상 제목, 해시태그, 채널명에서 판매처(스토어명)를 먼저 파악해. 예: "다이소", "올리브영", "무신사", "오늘의집", "이케아", "29cm" 등이 포함되면 해당 영상의 모든 제품 판매처는 그 스토어야.

【관련성 필터】
영상 제목: "${title}" / 채널명: "${channelTitle}"
추출한 상품이 영상 제목·해시태그·채널 주제와 전혀 관련 없으면 결과에 포함하지 마.
예: 뷰티 영상인데 전자제품이 나오거나, 다이소 영상인데 명품 브랜드 상품이 나오면 제외.

각 상품에 대해 아래 필드를 포함한 JSON 배열로 반환해줘:
- name: 실제 상품명만. 영상 제목·채널명·해시태그 전체 문구를 그대로 쓰지 마. IKEA(이케아) 제품은 반드시 "한글명(원문명)" 형식으로 표기해. 예: 칼락스(KALLAX), 빌리(BILLY), 팍(PAX).
- seller: 브랜드가 아닌 판매처(스토어). 위에서 파악한 판매처를 우선 사용. 모르면 "미확인".
- category: 생활용품/뷰티/전자기기/식품/패션/기타 중 하나
- itemCode: 다이소 상품 품번(#12345 또는 품번:12345 형식)이 있으면 문자열, 없으면 null
- timestamp: 이 상품과 가장 인접한 타임스탬프(예: "1:23", "10:45"). 없으면 null.
- purchaseUrl: 이 상품의 타임스탬프 바로 아래/위에 붙어있는 URL(http로 시작). 없으면 null.
- price: 원 단위 정수.
  1순위: 설명/자막/영상에 가격 명시 → priceSource: "description"
  2순위: 댓글에 가격 언급 → priceSource: "comment"
  3순위: 다이소(1000/2000/3000/5000원)처럼 공식 고정가 → priceSource: "known"
  4순위: 브랜드+종류+카테고리로 시세 추정 → priceSource: "estimated"
  가격이 0이면 안 됨.
- priceSource: "description" / "comment" / "known" / "estimated" 중 하나
- description: 이 상품을 소개한 영상 설명·자막·영상 속 문장을 원문 그대로 인용. 인용할 문장이 없으면 null.

상품 없으면 [] 반환. JSON 배열만, 마크다운 없이.

${extraContext}`
}

// description 기반 분석
async function analyzeWithGemini(title, channelTitle, description, captions, commentPrices) {
  const extraContext = `영상 제목: "${title}"
채널명: "${channelTitle}"
영상 설명:
${description.slice(0, 4000)}
${captions ? `\n영상 자막:\n${captions}` : ''}
${commentPrices ? `\n가격 언급 댓글:\n${commentPrices}` : ''}

영상 설명에 타임스탬프(예: 0:00, 1:23) + 제품명 형식이 있으면 최우선 활용.
타임스탬프 없어도 설명·자막에서 제품명을 최대한 추출해.`

  const prompt = `다음 유튜브 영상에서 추천 상품을 추출하고 가격도 함께 추정해줘.\n\n` +
    buildProductPrompt(title, channelTitle, extraContext)

  return callGemini({ contents: [{ parts: [{ text: prompt }] }] })
}

// 영상 직접 분석 (Gemini 멀티모달)
async function analyzeVideoWithGemini(videoUrl, title, channelTitle) {
  const prompt = `이 유튜브 영상을 직접 보고 영상에 등장하는 추천 상품을 모두 추출해줘.\n\n` +
    buildProductPrompt(title, channelTitle,
      `영상에서 소개되는 제품명, 브랜드, 가격, 타임스탬프를 영상 내용에서 직접 파악해.`)

  return callGemini({
    contents: [{
      parts: [
        { fileData: { mimeType: 'video/*', fileUri: videoUrl } },
        { text: prompt }
      ]
    }]
  })
}

async function callGemini(body) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, generationConfig: { temperature: 0.1 } })
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

function mapProducts(rawProducts) {
  return rawProducts.map((p, i) => ({
    id: 'p_' + Date.now() + '_' + i,
    name: p.name || '(이름 없음)',
    seller: p.seller || '미확인',
    category: p.category || '기타',
    itemCode: p.itemCode || null,
    purchaseUrl: p.purchaseUrl || null,
    timestamp: p.timestamp || null,
    price: p.price || 0,
    priceSource: p.priceSource || 'estimated',
    description: p.description || null,
    memo: '',
    checked: true
  }))
}

// ── Main handler ───────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.body ?? {}
  if (!url) return res.status(400).json({ error: 'URL이 필요합니다' })

  try {
    const videoId = extractVideoId(url)
    if (!videoId) throw new Error('유효하지 않은 YouTube URL입니다.')

    // YouTube Data API - snippet + contentDetails(duration)
    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
    )
    if (!ytRes.ok) throw new Error('YouTube API 오류: ' + ytRes.status)
    const ytData = await ytRes.json()
    if (!ytData.items?.length) throw new Error('영상을 찾을 수 없습니다.')

    const snippet = ytData.items[0].snippet
    const durationSecs = parseDuration(ytData.items[0].contentDetails?.duration || 'PT0S')

    const thumbnail = snippet.thumbnails?.high?.url
      || snippet.thumbnails?.medium?.url
      || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    const description = snippet.description || ''
    const publishedAt = snippet.publishedAt
      ? new Date(snippet.publishedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
          .replace(/\. /g, '.').replace(/\.$/, '')
      : new Date().toLocaleDateString('ko-KR')

    const videoInfo = { url, title: snippet.title, thumbnail, channelName: snippet.channelTitle, publishedAt }

    // 댓글 + 자막 병렬 수집
    const [commentPrices, captions] = await Promise.all([
      fetchCommentPrices(videoId),
      fetchCaptions(videoId)
    ])

    // 1단계: description 기반 분석
    const rawFromDesc = await analyzeWithGemini(
      snippet.title, snippet.channelTitle, description, captions, commentPrices
    )

    if (rawFromDesc.length > 0) {
      const products = await enrichEstimatedPrices(mapProducts(rawFromDesc))
      return res.json({ video: videoInfo, products })
    }

    // 2단계: description에 상품 없음 → 영상 길이 확인
    if (durationSecs > MAX_VIDEO_SECONDS) {
      // 15분 초과 → 직접 분석 불가
      return res.json({ video: videoInfo, products: [], noProductsReason: 'too_long' })
    }

    // 3단계: 15분 이하 → 영상 직접 분석
    console.log(`[analyze] description에 상품 없음, 영상 직접 분석 시작 (${Math.round(durationSecs / 60)}분)`)
    const rawFromVideo = await analyzeVideoWithGemini(url, snippet.title, snippet.channelTitle)

    const productsFromVideo = await enrichEstimatedPrices(mapProducts(rawFromVideo))
    return res.json({
      video: videoInfo,
      products: productsFromVideo,
      noProductsReason: productsFromVideo.length === 0 ? 'not_found' : undefined
    })

  } catch (err) {
    console.error('[analyze error]', err.message)
    res.status(500).json({ error: err.message })
  }
}
