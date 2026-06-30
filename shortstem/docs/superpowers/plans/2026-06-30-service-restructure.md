# Service Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 서비스 구조를 단순화 — 마이탭/찜 제거, 홈 단일화, 분석결과 화면을 체크박스 선택 저장으로 개편

**Architecture:** App.vue에서 탭바/마이탭/찜 로직 제거. HomeScreen을 URL입력 + 최근영상(접기) + 카테고리별 저장목록 통합 구조로 재작성. AnalysisScreen은 체크박스 선택 저장 UI로 변경.

**Tech Stack:** Vue 3, TypeScript, Tailwind CSS, Supabase

## Global Constraints

- Vue 3 Composition API (`<script setup>`) 사용
- TypeScript 타입 정의 필수
- 모바일 390px 기준, 터치영역 44px 이상
- 100dvh, safe-area-inset 대응 유지

---

### Task 1: 타입 정리 — isLiked, status 제거

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces: `Product` (isLiked 없음, status 없음)

- [ ] **Step 1: types/index.ts 수정**

```typescript
export type Category = '뷰티' | '전자기기' | '생활용품' | '식품' | '패션' | '기타'
export type PriceSource = 'description' | 'comment' | 'known' | 'estimated' | 'user'
export type Priority = 'high' | 'medium' | 'low'

export interface Product {
  id: string
  name: string
  seller: string
  category: Category
  itemCode: string | null
  price: number
  priceSource: PriceSource
  priority: Priority
  memo: string
  videoTitle?: string
  videoUrl?: string
  videoThumbnail?: string
  purchaseUrl?: string | null
  timestamp?: string | null
  savedAt: string
}

export interface VideoInfo {
  url: string
  title: string
  thumbnail: string
  channelName: string
  publishedAt: string
}

export interface AnalysisResult {
  video: VideoInfo
  products: Product[]
  noProductsReason?: 'too_long' | 'not_found'
}

export interface FolderInfo {
  key: Category
  label: string
  emoji: string
  color: string
  tabColor: string
  bgLight: string
}
```

- [ ] **Step 2: 커밋**
```bash
git add src/types/index.ts
git commit -m "refactor(types): isLiked, status 필드 제거"
```

---

### Task 2: AnalysisScreen — 체크박스 선택 저장 UI

**Files:**
- Modify: `src/screens/AnalysisScreen.vue`

**Interfaces:**
- Consumes: `Product` (Task 1), `AnalysisResult`
- Produces: emit `save: [products: Product[]]` — 선택된 제품 배열만

- [ ] **Step 1: AnalysisScreen.vue 전체 교체**

```vue
<template>
  <div class="flex flex-col min-h-full">
    <!-- 헤더 -->
    <div class="bg-paper px-5 py-4 flex items-center gap-3 shadow-paper">
      <button
        class="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500"
        @click="$emit('back')"
      >←</button>
      <h2 class="font-black text-gray-900">추천템 분석 결과</h2>
    </div>

    <!-- 로딩 -->
    <div v-if="analyzing" class="flex-1 flex flex-col items-center justify-center gap-5 py-20">
      <div class="w-16 h-16 rounded-full bg-baby-pink-light flex items-center justify-center animate-float">
        <span class="text-3xl">🔍</span>
      </div>
      <div class="text-center">
        <p class="font-bold text-gray-600">AI가 추천템을 분석 중이에요...</p>
        <p class="text-sm text-gray-400 mt-1">영상이 길면 시간이 조금 걸릴 수 있어요</p>
      </div>
      <div class="flex gap-1.5">
        <div v-for="i in 3" :key="i" class="w-2 h-2 rounded-full bg-baby-pink animate-bounce" :style="{ animationDelay: `${i * 0.15}s` }" />
      </div>
    </div>

    <!-- 결과 -->
    <template v-else-if="result">
      <!-- 영상 정보 카드 -->
      <div class="mx-5 mt-4 mb-2 bg-paper rounded-2xl p-3.5 shadow-paper flex items-center gap-3">
        <div class="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          <img v-if="result.video.thumbnail" :src="result.video.thumbnail" class="w-full h-full object-cover" />
          <span v-else class="w-full h-full flex items-center justify-center text-2xl">🎬</span>
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-gray-800 truncate">{{ result.video.title }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ result.video.channelName }} · {{ result.video.publishedAt }}</p>
        </div>
      </div>

      <!-- 제품 없음 -->
      <div v-if="products.length === 0" class="flex flex-col items-center py-16 text-center px-8">
        <span class="text-5xl mb-4">{{ noProductsReason === 'too_long' ? '⏱️' : '🔍' }}</span>
        <p class="font-black text-gray-700">
          {{ noProductsReason === 'too_long' ? '영상이 너무 길어요' : '분석 가능한 제품이 없어요' }}
        </p>
        <p class="text-sm font-medium text-gray-400 mt-1.5">
          <template v-if="noProductsReason === 'too_long'">
            15분 이상 영상은 직접 분석이 어려워요<br>영상 설명란에 제품 정보가 있어야 분석돼요
          </template>
          <template v-else>
            영상 설명과 화면을 분석했지만<br>제품 정보를 찾지 못했어요
          </template>
        </p>
      </div>

      <template v-else>
        <!-- 전체선택 + 개수 -->
        <div class="px-5 py-3 flex items-center justify-between">
          <p class="text-sm font-semibold text-gray-500">{{ products.length }}개 제품 발견</p>
          <button class="text-sm font-bold text-gray-700" @click="toggleAll">
            {{ allSelected ? '전체 해제' : '전체 선택' }}
          </button>
        </div>

        <!-- 제품 목록 -->
        <div class="px-5 flex flex-col gap-3 pb-4">
          <div
            v-for="p in products"
            :key="p.id"
            class="bg-paper rounded-2xl p-4 shadow-paper flex items-start gap-3 cursor-pointer"
            @click="toggleSelect(p.id)"
          >
            <!-- 체크박스 -->
            <div
              class="w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors"
              :class="selected.has(p.id) ? 'bg-gray-900 border-gray-900' : 'border-gray-300'"
            >
              <span v-if="selected.has(p.id)" class="text-white text-xs font-bold">✓</span>
            </div>

            <div class="flex-1 min-w-0">
              <div v-if="p.timestamp" class="mb-1">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-900 text-white text-[11px] font-bold">
                  ▶ {{ p.timestamp }}
                </span>
              </div>
              <div class="text-sm font-black text-gray-900">{{ p.name }}</div>
              <div class="text-xs font-medium text-gray-400 mt-0.5">
                {{ p.seller }}
                <span v-if="p.itemCode && p.seller === '다이소'"> · #{{ p.itemCode }}</span>
              </div>
              <div class="mt-1.5 flex items-center gap-2">
                <span class="text-sm font-black text-gray-900">₩{{ p.price.toLocaleString() }}</span>
                <span v-if="p.priceSource === 'estimated' || p.priceSource === 'known'" class="text-[11px] font-medium text-gray-400">AI추정</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 하단 버튼 -->
        <div class="px-5 mt-2 mb-8 flex gap-2.5">
          <AppButton variant="secondary" @click="$emit('back')">취소</AppButton>
          <AppButton :disabled="selected.size === 0" @click="save">
            {{ selected.size > 0 ? `${selected.size}개 저장하기` : '저장하기' }}
          </AppButton>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import AppButton from '../components/AppButton.vue'
import type { AnalysisResult, Product } from '../types'

const props = defineProps<{
  result: AnalysisResult | null
  analyzing: boolean
}>()

const emit = defineEmits<{
  back: []
  save: [products: Product[]]
}>()

const products = ref<Product[]>([])
const selected = ref<Set<string>>(new Set())

watch(() => props.result, (v) => {
  if (v) {
    products.value = v.products.map(p => ({ ...p }))
    selected.value = new Set(v.products.map(p => p.id))
  }
}, { immediate: true })

const noProductsReason = computed(() => props.result?.noProductsReason)
const allSelected = computed(() => products.value.every(p => selected.value.has(p.id)))

function toggleSelect(id: string) {
  const s = new Set(selected.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selected.value = s
}

function toggleAll() {
  if (allSelected.value) {
    selected.value = new Set()
  } else {
    selected.value = new Set(products.value.map(p => p.id))
  }
}

function save() {
  const toSave = products.value.filter(p => selected.value.has(p.id))
  const enriched = toSave.map(p => ({
    ...p,
    videoTitle: props.result?.video.title,
    videoUrl: props.result?.video.url,
    videoThumbnail: props.result?.video.thumbnail,
    savedAt: new Date().toISOString().slice(0, 10),
  }))
  emit('save', enriched)
}
</script>
```

- [ ] **Step 2: 커밋**
```bash
git add src/screens/AnalysisScreen.vue
git commit -m "feat(analysis): 체크박스 선택 저장 UI로 변경, 수정/삭제 제거"
```

---

### Task 3: HomeScreen 재작성 — URL입력 + 최근영상(접기) + 카테고리별 저장목록

**Files:**
- Modify: `src/screens/HomeScreen.vue`

**Interfaces:**
- Consumes: `Product[]`, `analyzing: boolean`
- Produces: emit `analyze: [url: string]`, `openVideo: [url: string]`, `openFolder: [category: Category]`, `deleteProduct: [id: string]`

- [ ] **Step 1: HomeScreen.vue 전체 교체**

```vue
<template>
  <div class="flex flex-col min-h-full overflow-y-auto pb-8">

    <!-- URL 입력 헤더 -->
    <div class="bg-paper px-5 pt-10 pb-5 border-b border-gray-100 flex-shrink-0">
      <div class="mb-5">
        <h1 class="text-2xl font-black text-gray-900 tracking-tight">픽템</h1>
        <p class="text-sm font-medium text-gray-500 mt-1">유튜브 링크를 붙여넣으면 추천템을 자동으로 정리해줘요</p>
      </div>
      <UrlInputBox :loading="analyzing" @analyze="$emit('analyze', $event)" />
    </div>

    <!-- 최근 분석 영상 (접기/펼치기) -->
    <div v-if="recentVideos.length > 0" class="flex-shrink-0 border-b border-gray-100">
      <button
        class="w-full px-5 py-3 flex items-center justify-between"
        @click="videosOpen = !videosOpen"
      >
        <span class="text-sm font-bold text-gray-500">🕒 최근 분석 영상</span>
        <span class="text-xs text-gray-400">{{ videosOpen ? '접기 ▲' : '펼치기 ▼' }}</span>
      </button>
      <div v-if="videosOpen" class="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-4" style="scroll-snap-type: x mandatory;">
        <div
          v-for="v in recentVideos"
          :key="v.url"
          class="flex-shrink-0 cursor-pointer"
          style="width: 160px; scroll-snap-align: start;"
          @click="$emit('openVideo', v.url)"
        >
          <div class="relative w-full rounded-xl overflow-hidden bg-gray-100" style="height: 90px;">
            <img v-if="v.thumbnail" :src="v.thumbnail" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-3xl">🎬</div>
            <div class="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
              {{ v.count }}개 제품
            </div>
          </div>
          <p class="mt-1.5 text-xs font-bold text-gray-800 line-clamp-2 leading-snug">{{ v.title }}</p>
        </div>
      </div>
    </div>

    <!-- 저장한 제품 (카테고리별) -->
    <div class="px-5 pt-5">
      <h2 class="text-base font-black text-gray-900 mb-4">📦 저장한 제품</h2>

      <!-- 빈 상태 -->
      <div v-if="allProducts.length === 0" class="py-10 flex flex-col items-center gap-2">
        <span class="text-4xl">📭</span>
        <p class="text-sm font-bold text-gray-400">아직 저장한 제품이 없어요</p>
        <p class="text-xs font-medium text-gray-300">위에서 유튜브 링크를 분석해보세요</p>
      </div>

      <!-- 카테고리별 섹션 -->
      <div v-else class="flex flex-col gap-6">
        <div v-for="cat in activeCategories" :key="cat.key">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-bold text-gray-700">{{ cat.emoji }} {{ cat.label }}</span>
            <button class="text-xs font-semibold text-gray-400" @click="$emit('openFolder', cat.key)">
              전체보기 →
            </button>
          </div>
          <div class="flex flex-col gap-2">
            <div
              v-for="p in productsByCategory(cat.key).slice(0, 3)"
              :key="p.id"
              class="bg-paper rounded-xl px-4 py-3 shadow-paper flex items-center gap-3"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-gray-900 truncate">{{ p.name }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ p.seller }}</p>
              </div>
              <p class="text-sm font-black text-gray-800 flex-shrink-0">₩{{ p.price.toLocaleString() }}</p>
            </div>
            <button
              v-if="productsByCategory(cat.key).length > 3"
              class="text-xs font-semibold text-gray-400 text-center py-1"
              @click="$emit('openFolder', cat.key)"
            >
              +{{ productsByCategory(cat.key).length - 3 }}개 더보기
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import UrlInputBox from '../components/UrlInputBox.vue'
import { FOLDER_CATEGORIES } from '../data/mockData'
import type { Product, Category } from '../types'

const props = defineProps<{
  allProducts: Product[]
  analyzing: boolean
}>()

defineEmits<{
  analyze: [url: string]
  openVideo: [videoUrl: string]
  openFolder: [category: Category]
}>()

const videosOpen = ref(false)

const recentVideos = computed(() => {
  const seen = new Set<string>()
  const result: { url: string; title: string; thumbnail: string; count: number }[] = []
  for (const p of [...props.allProducts].sort((a, b) => b.savedAt.localeCompare(a.savedAt))) {
    if (!p.videoUrl || seen.has(p.videoUrl)) continue
    seen.add(p.videoUrl)
    const count = props.allProducts.filter(x => x.videoUrl === p.videoUrl).length
    result.push({ url: p.videoUrl, title: p.videoTitle ?? '제목 없음', thumbnail: p.videoThumbnail ?? '', count })
    if (result.length >= 5) break
  }
  return result
})

const productsByCategory = (key: Category) =>
  props.allProducts.filter(p => p.category === key)

const activeCategories = computed(() =>
  FOLDER_CATEGORIES.filter(cat => productsByCategory(cat.key).length > 0)
)
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }
</style>
```

- [ ] **Step 2: 커밋**
```bash
git add src/screens/HomeScreen.vue
git commit -m "feat(home): URL입력 + 최근영상 접기 + 카테고리별 저장목록 통합"
```

---

### Task 4: FolderDetailScreen — isLiked/찜 제거, 수정/삭제 유지

**Files:**
- Modify: `src/screens/FolderDetailScreen.vue`

**Interfaces:**
- Consumes: `Product[]` (isLiked 없음)
- Produces: emit `deleteProduct`, `deleteAllProducts`, `updatePrice`, `openProduct`, `back`

- [ ] **Step 1: FolderDetailScreen.vue에서 찜 관련 코드 제거**

FolderDetailScreen.vue를 열어 아래 항목 제거:
- `@toggle-like` emit 및 버튼 UI
- `isLiked` 관련 표시(하트 아이콘 등)
- emit 타입에서 `toggleLike` 제거

- [ ] **Step 2: 커밋**
```bash
git add src/screens/FolderDetailScreen.vue
git commit -m "refactor(folder): 찜 기능 제거"
```

---

### Task 5: VideoDetailScreen — isLiked/찜 제거

**Files:**
- Modify: `src/screens/VideoDetailScreen.vue`

- [ ] **Step 1: VideoDetailScreen.vue에서 찜 관련 코드 제거**

- `@toggle-like` emit 및 버튼 UI 제거
- emit 타입에서 `toggleLike` 제거

- [ ] **Step 2: 커밋**
```bash
git add src/screens/VideoDetailScreen.vue
git commit -m "refactor(video): 찜 기능 제거"
```

---

### Task 6: ProductDetailSheet — isLiked/찜 제거

**Files:**
- Modify: `src/components/ProductDetailSheet.vue`

- [ ] **Step 1: ProductDetailSheet.vue에서 찜 버튼 및 toggle-like emit 제거**

- [ ] **Step 2: 커밋**
```bash
git add src/components/ProductDetailSheet.vue
git commit -m "refactor(product-sheet): 찜 기능 제거"
```

---

### Task 7: App.vue — 마이탭/찜/LikedScreen 제거, HomeScreen에 openFolder 연결

**Files:**
- Modify: `src/App.vue`

**Interfaces:**
- 제거: `MyScreen`, `LikedScreen` import 및 사용
- 제거: `toggleLike`, `isLiked` 관련 함수
- 제거: 탭바 (my 탭 제거, 탭바 자체 제거 또는 홈 단일 탭)
- 추가: HomeScreen에 `@open-folder` 연결

- [ ] **Step 1: App.vue 수정**

```vue
<template>
  <div class="min-h-screen bg-cream flex justify-center">
    <div class="w-full max-w-[430px] min-h-screen bg-cream relative overflow-x-hidden">

      <!-- 홈 -->
      <HomeScreen
        v-if="!subScreen"
        :all-products="savedProducts"
        :analyzing="analyzing"
        @analyze="startAnalyze"
        @open-video="openVideo"
        @open-folder="openFolder"
      />

      <!-- 분석 결과 -->
      <AnalysisScreen
        v-else-if="subScreen === 'analyze'"
        :result="analysisResult"
        :analyzing="analyzing"
        @back="subScreen = null"
        @save="saveProducts"
      />

      <!-- 폴더 상세 -->
      <FolderDetailScreen
        v-else-if="subScreen === 'folder' && activeFolder"
        :category="activeFolder"
        :items="folderItems"
        :budget="budgets[activeFolder] ?? 0"
        @back="subScreen = null"
        @delete-product="deleteProduct"
        @delete-all-products="deleteAllProducts"
        @update-price="updatePrice"
        @open-budget="budgetSheetOpen = true"
        @open-product="openDetailProduct"
      />

      <!-- 영상별 제품 목록 -->
      <VideoDetailScreen
        v-else-if="subScreen === 'video' && activeVideoUrl"
        :video-url="activeVideoUrl"
        :products="videoItems"
        @back="subScreen = null"
        @delete-product="deleteProduct"
        @update-price="updatePrice"
        @open-product="openDetailProduct"
      />

      <!-- 토스트 -->
      <Transition name="toast">
        <div
          v-if="toastMsg"
          class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-paper-lg whitespace-nowrap z-[300]"
        >{{ toastMsg }}</div>
      </Transition>

      <!-- 상품 상세 시트 -->
      <ProductDetailSheet
        :product="detailProduct"
        @close="detailProduct = null"
        @save="applyEdit"
      />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import HomeScreen from './screens/HomeScreen.vue'
import AnalysisScreen from './screens/AnalysisScreen.vue'
import FolderDetailScreen from './screens/FolderDetailScreen.vue'
import VideoDetailScreen from './screens/VideoDetailScreen.vue'
import ProductDetailSheet from './components/ProductDetailSheet.vue'
import { supabase } from './lib/supabase'
import type { Product, Category, AnalysisResult } from './types'

type SubScreen = 'analyze' | 'folder' | 'video' | null

const subScreen = ref<SubScreen>(null)
const analyzing = ref(false)
const analysisResult = ref<AnalysisResult | null>(null)
const savedProducts = ref<Product[]>([])
const activeFolder = ref<Category | null>(null)
const activeVideoUrl = ref<string | null>(null)
const toastMsg = ref<string | null>(null)
const detailProduct = ref<Product | null>(null)
const userId = ref<string | null>(null)
const budgets = ref<Record<string, number>>({})
const budgetSheetOpen = ref(false)

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
    videoTitle: row.video_title ?? undefined,
    videoUrl: row.video_url ?? undefined,
    videoThumbnail: row.video_thumbnail ?? undefined,
    purchaseUrl: row.purchase_url ?? null,
    timestamp: row.timestamp ?? null,
    savedAt: row.saved_at,
  }
}

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
    video_title: p.videoTitle ?? null,
    video_url: p.videoUrl ?? null,
    video_thumbnail: p.videoThumbnail ?? null,
    purchase_url: p.purchaseUrl ?? null,
    timestamp: p.timestamp ?? null,
    saved_at: p.savedAt,
  }
}

const folderItems = computed(() =>
  activeFolder.value ? savedProducts.value.filter(p => p.category === activeFolder.value) : []
)
const videoItems = computed(() =>
  activeVideoUrl.value ? savedProducts.value.filter(p => p.videoUrl === activeVideoUrl.value) : []
)

onMounted(async () => {
  let id = localStorage.getItem('shortstem_user_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('shortstem_user_id', id)
  }
  userId.value = id

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
  if (data) savedProducts.value = data.map(fromRow)
})

function showToast(msg: string) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = null }, 2200)
}

function openFolder(category: Category) {
  activeFolder.value = category
  subScreen.value = 'folder'
}

function openVideo(videoUrl: string) {
  activeVideoUrl.value = videoUrl
  subScreen.value = 'video'
}

function deleteProduct(id: string) {
  savedProducts.value = savedProducts.value.filter(p => p.id !== id)
  showToast('삭제했어요')
  if (userId.value) supabase.from('products').delete().eq('id', id).then()
}

function updatePrice(id: string, price: number) {
  const p = savedProducts.value.find(p => p.id === id)
  if (!p) return
  p.price = price
  p.priceSource = 'user'
  if (userId.value) supabase.from('products').update({ price, price_source: 'user' }).eq('id', id).then()
}

function deleteAllProducts() {
  if (!activeFolder.value) return
  const ids = folderItems.value.map(p => p.id)
  savedProducts.value = savedProducts.value.filter(p => p.category !== activeFolder.value)
  showToast('전체 삭제했어요')
  if (userId.value) supabase.from('products').delete().in('id', ids).then()
}

function openDetailProduct(product: Product) {
  detailProduct.value = { ...product }
}

function applyEdit(edited: Product) {
  const idx = savedProducts.value.findIndex(p => p.id === edited.id)
  if (idx !== -1) {
    const updated = { ...edited, priceSource: 'user' as const }
    savedProducts.value[idx] = updated
    if (userId.value) supabase.from('products').update(toRow(updated)).eq('id', updated.id).then()
  }
  detailProduct.value = null
}

async function startAnalyze(url: string) {
  subScreen.value = 'analyze'
  analyzing.value = true
  analysisResult.value = null
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '분석 실패')
    analysisResult.value = {
      video: data.video,
      products: data.products.map((p: any) => ({
        ...p,
        priority: 'medium' as const,
        memo: '',
        savedAt: new Date().toISOString().slice(0, 10),
      })),
      noProductsReason: data.noProductsReason,
    }
  } catch (err: any) {
    showToast(err.message || '분석 중 오류가 발생했어요')
    subScreen.value = null
  } finally {
    analyzing.value = false
  }
}

function saveProducts(products: Product[]) {
  savedProducts.value.unshift(...products)
  showToast(`${products.length}개 저장됐어요`)
  subScreen.value = null
  if (userId.value) supabase.from('products').insert(products.map(toRow)).then()
}
</script>

<style>
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 8px); }
</style>
```

- [ ] **Step 2: MyScreen.vue, LikedScreen.vue 파일 삭제**
```bash
rm src/screens/MyScreen.vue src/screens/LikedScreen.vue
```

- [ ] **Step 3: 커밋**
```bash
git add -A
git commit -m "refactor(app): 마이탭/찜/탭바 제거, 홈 단일 화면으로 통합"
```
