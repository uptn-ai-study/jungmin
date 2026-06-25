# Supabase 연동 + 상품 상세 바텀 시트 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱 데이터를 Supabase에 영속 저장하고, 상품 클릭 시 편집+찜하기가 가능한 바텀 시트를 추가한다.

**Architecture:** Vue 앱의 로컬 reactive state가 진리의 원천이고, 모든 CRUD는 로컬 즉시 반영 후 Supabase를 백그라운드로 호출한다. 익명 인증(anonymous auth)으로 기기별 user_id를 발급받아 RLS로 본인 데이터만 접근한다. ProductDetailSheet는 기존 인라인 editProduct 시트를 완전히 대체한다.

**Tech Stack:** Vue 3 + TypeScript, @supabase/supabase-js, Tailwind CSS, Vite

## Global Constraints

- Node.js 프로젝트, `npm install`로 패키지 추가
- 환경변수는 `.env`에 `VITE_` 접두사 (Vite 빌드 시 번들에 포함됨, anon key 노출 안전)
- TypeScript strict mode 사용 중 — 타입 오류 없어야 함
- Supabase 오류는 무시 (로컬 상태 유지), 사용자에게 에러 토스트 없음
- 테스트 프레임워크 없음 — 각 태스크 끝에 브라우저 수동 검증으로 대체
- `npm run dev`로 프론트 개발 서버, `npm run server`로 Express 서버 (별도 터미널)

---

## 파일 구조

| 파일 | 변경 |
|------|------|
| `src/lib/supabase.ts` | **신규** — Supabase 클라이언트 싱글턴 |
| `src/components/ProductDetailSheet.vue` | **신규** — 상품 상세/편집/찜 바텀 시트 |
| `src/App.vue` | **수정** — Supabase 초기화, CRUD 연동, 시트 교체, rename |
| `src/screens/FolderDetailScreen.vue` | **수정** — 카드 클릭 시 openProduct emit |
| `src/screens/LikedScreen.vue` | **수정** — 카드 클릭 시 openProduct emit |

---

## Task 1: Supabase 클라이언트 설치 + 익명 인증 + 데이터 로드

**Files:**
- Create: `src/lib/supabase.ts`
- Modify: `src/App.vue`

**Interfaces:**
- Produces: `supabase` (Supabase client), `userId` (ref), `fromRow` (row → Product 변환)

- [ ] **Step 1: @supabase/supabase-js 설치**

```bash
npm install @supabase/supabase-js
```

Expected: `package.json`의 `dependencies`에 `"@supabase/supabase-js"` 추가됨

- [ ] **Step 2: src/lib/supabase.ts 생성**

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
)
```

- [ ] **Step 3: App.vue — import 업데이트**

`src/App.vue` script 최상단의 import 블록을 아래로 교체:

```ts
import { ref, computed, reactive, onMounted } from 'vue'
import HomeScreen from './screens/HomeScreen.vue'
import MyScreen from './screens/MyScreen.vue'
import AnalysisScreen from './screens/AnalysisScreen.vue'
import FolderDetailScreen from './screens/FolderDetailScreen.vue'
import LikedScreen from './screens/LikedScreen.vue'
import BudgetSheet from './components/BudgetSheet.vue'
import { supabase } from './lib/supabase'
import type { Product, Category, AnalysisResult } from './types'
```

> `MOCK_PRODUCTS` import 제거 (mockData import 줄 전체 삭제), `onMounted` 추가, `supabase` import 추가.

- [ ] **Step 4: App.vue — savedProducts 초기값 변경 + userId 추가 + fromRow 정의**

기존:
```ts
const savedProducts = ref<Product[]>([...MOCK_PRODUCTS])
const editProduct = ref<Product | null>(null)
```

교체:
```ts
const savedProducts = ref<Product[]>([])
const editProduct = ref<Product | null>(null)
const userId = ref<string | null>(null)

function fromRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    seller: row.seller,
    category: row.category,
    itemCode: row.item_code,
    price: row.price,
    priceSource: row.price_source,
    priority: row.priority,
    memo: row.memo,
    isLiked: row.is_liked,
    status: row.status,
    videoTitle: row.video_title ?? undefined,
    videoUrl: row.video_url ?? undefined,
    videoThumbnail: row.video_thumbnail ?? undefined,
    savedAt: row.saved_at,
  }
}
```

- [ ] **Step 5: App.vue — onMounted 추가**

`showToast` 함수 바로 위에 삽입:

```ts
onMounted(async () => {
  let { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    const { data } = await supabase.auth.signInAnonymously()
    session = data.session
  }
  if (!session) return
  userId.value = session.user.id

  const { data } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (data) savedProducts.value = data.map(fromRow)
})
```

- [ ] **Step 6: 브라우저 검증**

`npm run dev`로 앱 실행. 브라우저 콘솔에서 네트워크 탭 확인:
- `auth/v1/token` 요청 성공 (익명 로그인)
- `rest/v1/products` GET 요청 성공 (빈 배열 반환 — 아직 데이터 없음)
- 앱 화면: 폴더가 비어있음 (정상)

- [ ] **Step 7: 커밋**

```bash
git add src/lib/supabase.ts src/App.vue package.json package-lock.json
git commit -m "feat: Supabase 클라이언트 초기화 + 익명 인증 + 데이터 로드"
```

---

## Task 2: CRUD → Supabase 백그라운드 저장

**Files:**
- Modify: `src/App.vue`

**Interfaces:**
- Consumes: `supabase` (Task 1), `userId` (Task 1)
- Produces: 업데이트된 `saveProducts`, `toggleLike`, `deleteProduct`, `applyEdit`

- [ ] **Step 1: App.vue — toRow 헬퍼 추가**

`fromRow` 함수 바로 아래에 삽입:

```ts
function toRow(p: Product) {
  return {
    id: p.id,
    user_id: userId.value!,
    name: p.name,
    seller: p.seller,
    category: p.category,
    item_code: p.itemCode,
    price: p.price,
    price_source: p.priceSource,
    priority: p.priority,
    memo: p.memo,
    is_liked: p.isLiked,
    status: p.status,
    video_title: p.videoTitle ?? null,
    video_url: p.videoUrl ?? null,
    video_thumbnail: p.videoThumbnail ?? null,
    saved_at: p.savedAt,
  }
}
```

- [ ] **Step 2: App.vue — saveProducts 교체**

기존 `saveProducts` 함수 전체를 교체:

```ts
function saveProducts(products: Product[]) {
  const video = analysisResult.value?.video
  const enriched = products.map(p => ({
    ...p,
    videoTitle: video?.title,
    videoUrl: video?.url,
    videoThumbnail: video?.thumbnail,
  }))
  savedProducts.value.unshift(...enriched)
  showToast(`${enriched.length}개 저장됐어요`)
  subScreen.value = null
  if (userId.value) {
    supabase.from('products').insert(enriched.map(toRow)).then()
  }
}
```

> video 정보(타이틀, URL, 썸네일)를 각 상품에 붙여서 저장.

- [ ] **Step 3: App.vue — toggleLike 교체**

```ts
function toggleLike(id: string) {
  const p = savedProducts.value.find(p => p.id === id)
  if (!p) return
  p.isLiked = !p.isLiked
  if (userId.value) {
    supabase.from('products').update({ is_liked: p.isLiked }).eq('id', id).then()
  }
}
```

- [ ] **Step 4: App.vue — deleteProduct 교체**

```ts
function deleteProduct(id: string) {
  savedProducts.value = savedProducts.value.filter(p => p.id !== id)
  showToast('삭제했어요')
  if (userId.value) {
    supabase.from('products').delete().eq('id', id).then()
  }
}
```

- [ ] **Step 5: App.vue — applyEdit 교체**

```ts
function applyEdit() {
  if (!editProduct.value) return
  const idx = savedProducts.value.findIndex(p => p.id === editProduct.value!.id)
  if (idx !== -1) {
    const updated = { ...editProduct.value, priceSource: 'user' as const }
    savedProducts.value[idx] = updated
    if (userId.value) {
      supabase.from('products').update(toRow(updated)).eq('id', updated.id).then()
    }
  }
  editProduct.value = null
}
```

- [ ] **Step 6: 브라우저 검증**

1. 앱에서 YouTube URL 분석 후 상품 1개 저장
2. Supabase 대시보드 → Table Editor → products 테이블에 행이 추가됐는지 확인
3. 브라우저 새로고침 → 저장된 상품이 다시 로드되는지 확인
4. 하트 클릭 → Supabase에서 `is_liked` 값이 변경됐는지 확인
5. 삭제 버튼 → Supabase에서 행이 제거됐는지 확인

- [ ] **Step 7: 커밋**

```bash
git add src/App.vue
git commit -m "feat: CRUD 함수에 Supabase 백그라운드 저장 연동"
```

---

## Task 3: ProductDetailSheet 컴포넌트

**Files:**
- Create: `src/components/ProductDetailSheet.vue`

**Interfaces:**
- Consumes: `Product` 타입 (`src/types/index.ts`)
- Produces:
  - props: `product: Product | null`
  - emits: `close()`, `save(edited: Product)`, `toggleLike(id: string)`

- [ ] **Step 1: src/components/ProductDetailSheet.vue 생성**

```vue
<template>
  <Transition name="fade">
    <div
      v-if="product"
      class="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end justify-center"
      @click.self="$emit('close')"
    >
      <div class="w-full max-w-[430px] bg-paper rounded-t-3xl px-5 pb-10 pt-3 shadow-paper-lg">
        <!-- drag handle -->
        <div class="w-10 h-1.5 rounded-full bg-gray-200 mx-auto mb-5" />

        <!-- 헤더 -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-black text-gray-900">상품 상세</h3>
          <button
            class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500"
            @click="$emit('close')"
          >✕</button>
        </div>

        <!-- 출처 영상 (videoTitle 있을 때만) -->
        <div v-if="product.videoTitle" class="mb-4">
          <label class="text-xs font-semibold text-gray-400 mb-1 block">출처 영상</label>
          <a
            v-if="product.videoUrl"
            :href="product.videoUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm font-semibold text-blue-500 underline line-clamp-1"
          >{{ product.videoTitle }}</a>
          <p v-else class="text-sm font-semibold text-gray-700 line-clamp-1">{{ product.videoTitle }}</p>
        </div>

        <!-- 편집 필드 -->
        <div class="flex flex-col gap-3">
          <div>
            <label class="text-xs font-semibold text-gray-400 mb-1 block">상품명</label>
            <input
              v-model="draft.name"
              class="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-gray-400 bg-white"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-400 mb-1 block">판매처</label>
            <input
              v-model="draft.seller"
              class="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-gray-400 bg-white"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-400 mb-1 block">가격 (원)</label>
            <input
              v-model.number="draft.price"
              type="number"
              class="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-gray-400 bg-white"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-400 mb-1 block">메모</label>
            <input
              v-model="draft.memo"
              class="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-gray-400 bg-white"
              placeholder="선택사항"
            />
          </div>
        </div>

        <!-- 찜하기 -->
        <button
          class="w-full mt-4 py-3 rounded-xl text-sm font-bold transition-colors"
          :class="draft.isLiked ? 'bg-pink-100 text-pink-500' : 'bg-gray-100 text-gray-500'"
          @click="handleToggleLike"
        >{{ draft.isLiked ? '❤️ 찜됨' : '🤍 찜하기' }}</button>

        <!-- 저장/취소 -->
        <div class="flex gap-2.5 mt-3">
          <button
            class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm"
            @click="$emit('close')"
          >취소</button>
          <button
            class="flex-1 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm"
            @click="handleSave"
          >저장</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Product } from '../types'

const props = defineProps<{ product: Product | null }>()

const emit = defineEmits<{
  close: []
  save: [edited: Product]
  toggleLike: [id: string]
}>()

const draft = ref<Product>({} as Product)

watch(
  () => props.product,
  (p) => { if (p) draft.value = { ...p } },
  { immediate: true }
)

function handleToggleLike() {
  draft.value.isLiked = !draft.value.isLiked
  emit('toggleLike', draft.value.id)
}

function handleSave() {
  emit('save', { ...draft.value, priceSource: 'user' })
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/ProductDetailSheet.vue
git commit -m "feat: ProductDetailSheet 바텀 시트 컴포넌트 추가"
```

---

## Task 4: 진입점 연결 + App.vue 통합

**Files:**
- Modify: `src/App.vue`
- Modify: `src/screens/FolderDetailScreen.vue`
- Modify: `src/screens/LikedScreen.vue`

**Interfaces:**
- Consumes: `ProductDetailSheet` (Task 3), `applyEdit` (Task 2)

- [ ] **Step 1: App.vue — ProductDetailSheet import + editProduct rename**

import 블록에 추가:
```ts
import ProductDetailSheet from './components/ProductDetailSheet.vue'
```

스크립트에서 rename (2곳):
```ts
// 기존
const editProduct = ref<Product | null>(null)
// 교체
const detailProduct = ref<Product | null>(null)
```

```ts
// 기존
function openEditProduct(product: Product) {
  editProduct.value = { ...product }
}
// 교체
function openDetailProduct(product: Product) {
  detailProduct.value = { ...product }
}
```

- [ ] **Step 2: App.vue — applyEdit 시그니처 변경**

Task 2에서 만든 `applyEdit`는 인자 없이 `editProduct.value`를 읽었음. ProductDetailSheet는 편집된 product를 emit으로 넘기므로 인자를 받도록 교체:

```ts
function applyEdit(edited: Product) {
  const idx = savedProducts.value.findIndex(p => p.id === edited.id)
  if (idx !== -1) {
    const updated = { ...edited, priceSource: 'user' as const }
    savedProducts.value[idx] = updated
    if (userId.value) {
      supabase.from('products').update(toRow(updated)).eq('id', updated.id).then()
    }
  }
  detailProduct.value = null
}
```

- [ ] **Step 3: App.vue — template의 FolderDetailScreen 업데이트**

기존:
```html
<FolderDetailScreen
  v-else-if="subScreen === 'folder' && activeFolder"
  :category="activeFolder"
  :items="folderItems"
  :budget="budgets[activeFolder] ?? 0"
  @back="subScreen = null"
  @toggle-like="toggleLike"
  @delete-product="deleteProduct"
  @open-budget="budgetSheetOpen = true"
/>
```

교체:
```html
<FolderDetailScreen
  v-else-if="subScreen === 'folder' && activeFolder"
  :category="activeFolder"
  :items="folderItems"
  :budget="budgets[activeFolder] ?? 0"
  @back="subScreen = null"
  @toggle-like="toggleLike"
  @delete-product="deleteProduct"
  @open-budget="budgetSheetOpen = true"
  @open-product="openDetailProduct"
/>
```

- [ ] **Step 4: App.vue — template의 LikedScreen 업데이트**

기존:
```html
<LikedScreen
  v-else-if="subScreen === 'liked'"
  :all-products="savedProducts"
  @back="subScreen = null"
  @toggle-like="toggleLike"
/>
```

교체:
```html
<LikedScreen
  v-else-if="subScreen === 'liked'"
  :all-products="savedProducts"
  @back="subScreen = null"
  @toggle-like="toggleLike"
  @open-product="openDetailProduct"
/>
```

- [ ] **Step 5: App.vue — template의 인라인 editProduct 시트를 ProductDetailSheet로 교체**

기존 `<!-- 상품 수정 시트 -->` 블록 전체 (Transition 포함):
```html
<!-- 상품 수정 시트 -->
<Transition name="fade">
  <div v-if="editProduct" class="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end justify-center" @click.self="editProduct = null">
    ...전체 내용...
  </div>
</Transition>
```

교체:
```html
<!-- 상품 상세 시트 -->
<ProductDetailSheet
  :product="detailProduct"
  @close="detailProduct = null"
  @save="applyEdit"
  @toggle-like="toggleLike"
/>
```

- [ ] **Step 6: App.vue — AnalysisScreen의 @edit-product 핸들러 업데이트**

기존:
```html
@edit-product="openEditProduct"
```

교체:
```html
@edit-product="openDetailProduct"
```

- [ ] **Step 7: FolderDetailScreen.vue — openProduct emit 추가**

`defineEmits` 교체:
```ts
defineEmits<{
  back: []
  toggleLike: [id: string]
  deleteProduct: [id: string]
  openBudget: []
  openProduct: [product: Product]
}>()
```

template의 `<ItemStickerCard>` 태그에 `@click` 추가:
```html
<ItemStickerCard
  :item-name="p.name"
  :seller="p.seller"
  :category="p.category"
  :estimated-price="p.price"
  :price-source="p.priceSource"
  :priority="p.priority"
  :memo="p.memo"
  :source-title="p.videoTitle"
  :source-url="p.videoUrl"
  :is-liked="p.isLiked"
  :rotate="0"
  @toggle-like="$emit('toggleLike', p.id)"
  @click="$emit('openProduct', p)"
/>
```

> `ItemStickerCard` 내부의 하트 버튼과 링크에 이미 `@click.stop`이 있어서 카드 클릭 이벤트와 충돌하지 않음.

- [ ] **Step 8: LikedScreen.vue — openProduct emit + 클릭 핸들러 추가**

`defineEmits` 교체:
```ts
defineEmits<{
  back: []
  toggleLike: [id: string]
  openProduct: [product: Product]
}>()
```

template의 `<ItemStickerCard>` 목록을 div로 감싸기:

기존:
```html
<ItemStickerCard
  v-for="(p, i) in likedProducts"
  :key="p.id"
  ...
  @toggle-like="$emit('toggleLike', p.id)"
/>
```

교체:
```html
<div
  v-for="(p, i) in likedProducts"
  :key="p.id"
  @click="$emit('openProduct', p)"
>
  <ItemStickerCard
    :item-name="p.name"
    :seller="p.seller"
    :category="p.category"
    :estimated-price="p.price"
    :price-source="p.priceSource"
    :priority="p.priority"
    :memo="p.memo"
    :source-title="p.videoTitle"
    :source-url="p.videoUrl"
    :is-liked="p.isLiked"
    :rotate="rotations[i % rotations.length]"
    @toggle-like="$emit('toggleLike', p.id)"
  />
</div>
```

- [ ] **Step 9: 브라우저 검증**

1. 폴더 상세 화면에서 상품 카드 클릭 → ProductDetailSheet 바텀 시트 열림
2. 영상 출처 타이틀 표시 확인 (영상에서 저장한 상품이면 출처 섹션 보임)
3. 이름/판매처/가격/메모 수정 후 저장 → 폴더 목록에서 즉시 반영
4. 찜하기 버튼 클릭 → 하트 색상 변경, 찜 목록에서도 확인
5. 찜 목록에서 카드 클릭 → 바텀 시트 열림
6. 바텀시트 취소 → 변경 사항 없이 닫힘
7. 배경 클릭 → 시트 닫힘

- [ ] **Step 10: 커밋**

```bash
git add src/App.vue src/screens/FolderDetailScreen.vue src/screens/LikedScreen.vue
git commit -m "feat: 상품 상세 바텀 시트 + Supabase CRUD 진입점 연결"
```
