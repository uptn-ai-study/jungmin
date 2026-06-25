# 서버 가격 로직 개선 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `server.js`의 Gemini 프롬프트를 개선해 가격 추출 정확도를 높인다.

**Architecture:** `analyzeWithGemini` 함수 내 프롬프트 문자열 2곳만 변경. 외부 인터페이스 변경 없음.

**Tech Stack:** Node.js, Express, Gemini API (`gemini-2.5-flash`)

## Global Constraints

- 변경 파일: `server.js` 하나
- 테스트 프레임워크 없음 — 브라우저/터미널 수동 검증
- 서버는 `node server.js` 또는 `npm run server`로 실행
- `.env`에 `GEMINI_API_KEY`, `YOUTUBE_API_KEY` 필요

---

## 파일 구조

| 파일 | 변경 |
|------|------|
| `server.js` | 수정 — `analyzeWithGemini` 내 프롬프트 2곳 |

---

## Task 1: description 슬라이스 + Gemini price 프롬프트 개선

**Files:**
- Modify: `server.js` (`analyzeWithGemini` 함수)

**Interfaces:**
- Consumes: 없음 (독립 변경)
- Produces: 없음 (인터페이스 동일)

- [ ] **Step 1: description 슬라이스 수정**

`server.js`에서 아래 줄을 찾아 교체:

```js
// 찾을 코드 (analyzeWithGemini 함수 내 프롬프트 템플릿 리터럴 안)
${description.slice(0, 2000)}
```

```js
// 교체할 코드
${description.slice(0, 4000)}
```

- [ ] **Step 2: price / priceSource 프롬프트 교체**

`server.js`의 `analyzeWithGemini` 함수 내 프롬프트에서 아래 두 줄을 찾아:

```
- price: 원 단위 정수. 설명/자막/댓글에 가격이 명시되면 그 값. 없으면 학습 데이터 기반 시세 추정. 0이면 안 됨.
- priceSource: "description"(설명/자막 명시), "comment"(댓글 언급), "known"(AI 시세 파악), "estimated"(추정)
```

아래로 교체:

```
- price: 원 단위 정수. 아래 우선순위대로 결정:
  1순위: 설명 또는 자막에 가격이 명시된 경우 → priceSource: "description"
  2순위: 댓글에 가격이 언급된 경우 → priceSource: "comment"
  3순위: AI가 확실히 알고 있는 공식 판매가(다이소 균일가, 올리브영 정가 등 변하지 않는 가격) → priceSource: "known"
  4순위: 유사 상품 시세 기반 추정(상품은 특정되나 정확한 가격 모를 때) → priceSource: "estimated"
  가격이 0이면 안 됨.
- priceSource: 위 우선순위에 따라 "description" / "comment" / "known" / "estimated" 중 하나
```

- [ ] **Step 3: 서버 실행 및 수동 검증**

터미널 1:
```bash
npm run server
```

터미널 2에서 curl로 테스트 (다이소 영상 URL 사용):
```bash
curl -X POST http://localhost:5176/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/shorts/<다이소_영상_ID>"}'
```

확인 항목:
- 다이소 영상 → `priceSource: "known"`, 가격 1000/2000/3000원대
- 설명에 가격 명시된 영상 → `priceSource: "description"`
- 일반 상품 영상 → `priceSource: "estimated"` (가격 정보 없을 때)

- [ ] **Step 4: 커밋**

```bash
git add server.js
git commit -m "feat(server): description 4000자 확대 + Gemini price 우선순위 프롬프트 개선"
```
