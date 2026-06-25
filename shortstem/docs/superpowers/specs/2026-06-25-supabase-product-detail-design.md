# Supabase 연동 + 상품 상세 바텀 시트 설계

날짜: 2026-06-25

---

## 목표

1. 앱 데이터를 Supabase에 영속 저장 (익명 인증, 단일 기기)
2. 상품 상세/편집/찜하기를 하나의 바텀 시트로 통합

---

## 범위 (이번 구현)

| 포함 | 제외 |
|------|------|
| Supabase 익명 인증 + products 테이블 CRUD | 소셜 로그인 |
| ProductDetailSheet (편집 + 찜) | 구매완료 처리 UI |
| FolderDetailScreen / LikedScreen 진입점 추가 | 기기 간 싱크 |
| MOCK_PRODUCTS → Supabase 실데이터 전환 | 서버 가격 로직 개선 |

---

## Supabase 설계

### 테이블 스키마

```sql
create table products (
  id              text primary key,
  user_id         uuid references auth.users not null,
  name            text not null,
  seller          text,
  category        text,
  item_code       text,
  price           int,
  price_source    text,
  priority        text,
  memo            text,
  is_liked        boolean default false,
  status          text default 'saved',
  video_title     text,
  video_url       text,
  video_thumbnail text,
  saved_at        text,
  created_at      timestamptz default now()
);

alter table products enable row level security;
create policy "own data only" on products
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### 클라이언트 (`src/lib/supabase.ts`)

```ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### 환경변수 (.env)

```
VITE_SUPABASE_URL=<프로젝트 URL>
VITE_SUPABASE_ANON_KEY=<anon public key>
```

### 초기화 흐름 (App.vue onMounted)

```
1. supabase.auth.getSession()
   → 세션 없으면 signInAnonymously()
2. products 테이블에서 user_id 기준 전체 fetch
   → savedProducts.value = 결과
3. MOCK_PRODUCTS 제거
```

### CRUD 패턴 — 로컬 즉시 + Supabase 백그라운드

| 함수 | 로컬 변경 | Supabase |
|------|-----------|---------|
| `saveProducts` | unshift | insert (user_id 포함) |
| `toggleLike` | p.isLiked = ! | update is_liked |
| `deleteProduct` | filter out | delete where id |
| `applyEdit` | savedProducts[idx] 교체 | update 전체 필드 |

Supabase 실패 시 에러 무시 (로컬 상태 유지). 토스트 알림 없음.

---

## 상품 상세 바텀 시트

### 컴포넌트: `src/components/ProductDetailSheet.vue`

기존 App.vue 인라인 editProduct 시트를 이 컴포넌트로 대체.

#### 레이아웃

```
┌────────────────────────────────────┐
│  ────  (drag handle)               │
│  출처: "영상 타이틀 텍스트..." →   │  ← videoTitle 있을 때만 표시 (AnalysisScreen 진입 시 숨김)
├────────────────────────────────────┤
│  상품명  [________________]        │
│  판매처  [________________]        │
│  가격    [________________]        │
│  메모    [________________]        │
├────────────────────────────────────┤
│  [♡ 찜하기 토글]                   │  ← isLiked 상태 반영
├────────────────────────────────────┤
│  [취소]              [저장]        │
└────────────────────────────────────┘
```

#### Props / Events

```ts
props: { product: Product | null }
emits: {
  close: ()
  save: (edited: Product)
  toggleLike: (id: string)
}
```

#### 내부 상태

- 편집 필드는 로컬 draft 복사본으로 관리 (원본 훼손 방지)
- 찜하기는 즉시 emit (저장 버튼과 독립)
- 저장 버튼 클릭 시 priceSource: 'user' 로 교체 후 emit save

### 진입점

| 화면 | 트리거 | 이벤트 |
|------|--------|--------|
| FolderDetailScreen | ItemStickerCard 클릭 | `@open-product(product)` |
| LikedScreen | 아이템 클릭 | `@open-product(product)` |
| AnalysisScreen | 편집 버튼 | `@edit-product` (기존 유지, 저장 전 수정용) |

### App.vue 변경

- `editProduct` → `detailProduct` (rename)
- `openEditProduct` → `openDetailProduct` (rename)
- 인라인 시트 코드 제거 → `<ProductDetailSheet>` 컴포넌트로 교체
- FolderDetailScreen, LikedScreen에 `@open-product` 이벤트 연결

---

## 데이터 흐름

```
FolderDetailScreen / LikedScreen
  @open-product(product)
        ↓
App.vue: detailProduct.value = { ...product }
        ↓
ProductDetailSheet (v-if="detailProduct")
  @save(edited)    → applyEdit(edited) → Supabase update
  @toggle-like(id) → toggleLike(id)   → Supabase update
  @close           → detailProduct.value = null
```

---

## 파일 변경 목록

| 파일 | 변경 |
|------|------|
| `src/lib/supabase.ts` | 신규 생성 |
| `src/components/ProductDetailSheet.vue` | 신규 생성 |
| `src/App.vue` | Supabase 초기화, CRUD 연동, 시트 교체 |
| `src/screens/FolderDetailScreen.vue` | open-product 이벤트 추가 |
| `src/screens/LikedScreen.vue` | open-product 이벤트 추가 |
| `.env` | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 추가 |
| `package.json` | @supabase/supabase-js 의존성 추가 |

---

## 사용자 설정 필요 사항

Supabase 대시보드에서 직접 처리:
1. 새 프로젝트 생성
2. Authentication → Providers → Anonymous 활성화
3. SQL Editor에서 products 테이블 + RLS 정책 실행
4. Project Settings → API에서 URL + anon key 복사 → .env에 입력
