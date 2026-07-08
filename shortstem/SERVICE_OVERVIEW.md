# 추천템모아 — 서비스 구조 개요

유튜브 영상 속에서 소개된 상품을 AI가 자동으로 찾아 정리해주는 서비스.

## 기술 스택

- 프론트엔드: Vue 3 + TypeScript + Vite + Tailwind CSS
- 백엔드: Express(로컬 개발용, `server.js`) / Vercel Serverless Function(배포용, `api/analyze.js`) — 로직은 동일하게 이식되어 있음
- DB/인증: Supabase (Postgres + 익명 인증)
- 배포: Vercel (GitHub push 시 자동 재배포)

## 인증 & 데이터 모델

- **로그인 화면 없음.** Supabase 익명 인증(`signInAnonymously`)으로 브라우저에 세션 토큰을 저장해서 사용자를 구분함.
- 즉 "계정" 개념이 아니라 **"이 브라우저에 저장된 것"**에 가까움.
  - 같은 브라우저로 재접속 → 기존 저장 목록 그대로 보임 (로컬스토리지에 세션 남아있음)
  - 다른 기기/브라우저/시크릿 모드 → 완전히 새 익명 사용자, 기존 데이터 접근 불가
  - 브라우저 데이터 삭제 → 그 순간부터 새 익명 사용자로 취급됨
- 저장된 상품은 Supabase `products` 테이블에 `user_id`(익명 유저 id) 기준으로 저장/조회됨 (RLS로 본인 데이터만 접근 가능).

## 분석 로직 (핵심)

유튜브 링크를 넣으면 `/api/analyze` 엔드포인트가 아래 순서로 동작함.

1. **YouTube Data API 호출 (분석 아님, 단순 조회)**
   - `videos` 엔드포인트: 제목, 설명, 채널명, 썸네일, 영상 길이(duration) 조회
   - `commentThreads` 엔드포인트: 가격이 언급된 댓글만 필터링해서 수집
   - `timedtext` 엔드포인트: 자막(한국어 우선, 없으면 영어) 조회 — **자막 전체가 아니라 앞부분 3000자까지만 잘라서 사용** (긴 영상은 뒷부분 자막이 분석에 반영되지 않음)
   - → YouTube API는 텍스트 데이터만 긁어올 뿐, 실제 "분석"은 하지 않음.

2. **1단계 — 텍스트 기반 분석 (Gemini)**
   - 위에서 모은 설명 + 자막 + 가격 언급 댓글을 Gemini에게 텍스트로 전달
   - 설명란에 타임스탬프(`0:00 제품명` 형식) + 제품명이 있으면 최우선 활용
   - 상품이 하나라도 발견되면 **여기서 바로 종료**, 영상 자체는 보지 않음

3. **2단계 — 영상 직접 분석 (fallback, Gemini 멀티모달)**
   - 1단계에서 상품을 하나도 못 찾았고, 영상 길이가 **15분(900초) 이하**인 경우에만 실행
   - Gemini가 유튜브 URL을 `fileData`로 받아 **영상을 실제로 직접 보고** 등장하는 상품을 추출
   - 15분 초과 + 1단계 실패 → `noProductsReason: 'too_long'` 반환하고 여기서 끝 (영상 직접 분석은 비용/시간 문제로 시도 안 함)

4. **가격 보정**
   - Gemini가 가격을 못 정한 상품(`priceSource: 'estimated'`)은 네이버쇼핑 API로 검색해서 시세 중간값으로 채움

5. **응답 형식**
   ```json
   {
     "video": { "url", "title", "thumbnail", "channelName", "publishedAt" },
     "products": [
       { "id", "name", "seller", "category", "itemCode", "purchaseUrl", "timestamp", "price", "priceSource", "description", "memo", "checked" }
     ],
     "noProductsReason": "too_long | not_found | undefined"
   }
   ```
   - `description` 필드는 영상 속에서 해당 상품을 언급한 원문 문장을 그대로 인용한 것 (분석 결과 화면의 "🪄 설명" 토글에 표시됨)

## 상품명 정확도를 높이는 로직

- 판매처(다이소/올리브영 등)를 영상 제목·해시태그·채널명에서 먼저 추론해서 전체 상품에 일괄 적용
- 영상 주제와 무관한 상품(예: 뷰티 영상에 전자제품)은 결과에서 제외하도록 프롬프트에 명시

## 배포 구조

- `server.js`: 로컬 개발 전용 (Vite dev 서버가 `/api`를 `localhost:5176`으로 프록시)
- `api/analyze.js`: Vercel 배포용. `server.js`와 동일 로직이지만 Express가 아닌 Vercel Serverless Function 형태로 이식됨. **두 파일은 로직이 중복되어 있어 한쪽을 고치면 다른 쪽도 같이 고쳐야 함.**
- 배포 시 Root Directory를 `shortstem`으로 지정해야 하며, `api/` 폴더가 자동으로 서버리스 함수로 인식됨
- 필요 환경 변수 (Vercel Settings → Environment Variables에 등록 필요):
  - `GEMINI_API_KEY`
  - `YOUTUBE_API_KEY`
  - `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (빌드 타임에 프론트에 박히므로, 변경 시 반드시 Redeploy 필요)

## 알려진 제약

- 자막은 앞부분 3000자까지만 사용됨 — 긴 영상은 뒷부분에서 언급된 상품이 1단계 분석에서 누락될 수 있음
- Gemini의 영상 직접 분석(멀티모달)은 15분 이하 영상에서만 시도됨
- Vercel Serverless Function의 `maxDuration`을 60초로 설정해뒀지만, 긴 영상의 멀티모달 분석은 이 시간을 넘길 수 있음
- 유튜브 페이지에 태그된 실제 판매 제품(쿠팡 파트너스 등) 데이터를 활용하는 기능은 검토했으나, 판매처 불일치 및 수수료 포함 링크 문제로 **적용하지 않기로 결정함**
