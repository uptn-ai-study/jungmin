<template>
  <div class="min-h-screen bg-cream flex justify-center">
    <div class="w-full max-w-[430px] min-h-screen bg-cream relative overflow-x-hidden">

      <!-- 콘텐츠 영역 -->
      <!-- 홈 (보관함 탭) -->
      <HomeScreen
        v-if="activeTab === 'home' && !subScreen"
        :all-products="savedProducts"
        :analyzing="analyzing"
        @analyze="startAnalyze"
        @open-folder="openFolder"
        @open-liked="subScreen = 'liked'"
        @toggle-like="toggleLike"
      />

      <!-- 마이 탭 -->
      <MyScreen
        v-else-if="activeTab === 'my' && !subScreen"
        :all-products="savedProducts"
        :budgets="budgets"
        @open-budget="budgetSheetOpen = true"
      />

      <!-- 분석 결과 -->
      <AnalysisScreen
        v-else-if="subScreen === 'analyze'"
        :result="analysisResult"
        :analyzing="analyzing"
        @back="subScreen = null"
        @save="saveProducts"
        @edit-product="openDetailProduct"
      />

      <!-- 폴더 상세 -->
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

      <!-- 찜 목록 -->
      <LikedScreen
        v-else-if="subScreen === 'liked'"
        :all-products="savedProducts"
        @back="subScreen = null"
        @toggle-like="toggleLike"
        @open-product="openDetailProduct"
      />

      <!-- 하단 탭 바 (서브스크린 아닐때만) -->
      <nav
        v-if="!subScreen"
        class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-paper border-t border-gray-100 flex z-50"
        style="padding-bottom: env(safe-area-inset-bottom)"
      >
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
          :class="activeTab === tab.key ? 'text-gray-900' : 'text-gray-300'"
          @click="activeTab = tab.key"
        >
          <span class="text-sm font-bold tracking-wide">{{ tab.label }}</span>
        </button>
      </nav>

      <!-- 토스트 -->
      <Transition name="toast">
        <div
          v-if="toastMsg"
          class="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-paper-lg whitespace-nowrap z-[300]"
        >{{ toastMsg }}</div>
      </Transition>

      <!-- 예산 시트 -->
      <BudgetSheet
        :open="budgetSheetOpen"
        :budgets="budgets"
        @close="budgetSheetOpen = false"
        @save="saveBudgets"
      />

      <!-- 상품 상세 시트 -->
      <ProductDetailSheet
        :product="detailProduct"
        @close="detailProduct = null"
        @save="applyEdit"
        @toggle-like="toggleLike"
      />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import HomeScreen from './screens/HomeScreen.vue'
import MyScreen from './screens/MyScreen.vue'
import AnalysisScreen from './screens/AnalysisScreen.vue'
import FolderDetailScreen from './screens/FolderDetailScreen.vue'
import LikedScreen from './screens/LikedScreen.vue'
import BudgetSheet from './components/BudgetSheet.vue'
import ProductDetailSheet from './components/ProductDetailSheet.vue'
import { supabase } from './lib/supabase'
import type { Product, Category, AnalysisResult } from './types'

type Tab = 'home' | 'my'
type SubScreen = 'analyze' | 'folder' | 'liked' | null

const activeTab = ref<Tab>('home')
const subScreen = ref<SubScreen>(null)
const analyzing = ref(false)
const analysisResult = ref<AnalysisResult | null>(null)
const savedProducts = ref<Product[]>([])
const activeFolder = ref<Category | null>(null)
const budgetSheetOpen = ref(false)
const toastMsg = ref<string | null>(null)
const detailProduct = ref<Product | null>(null)
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

const tabs = [
  { key: 'home' as Tab, label: '보관함' },
  { key: 'my' as Tab, label: '마이' },
]

const budgets = reactive<Record<Category, number>>({
  '뷰티': 0, '전자기기': 0, '생활용품': 0, '식품': 0, '패션': 0, '기타': 0,
})

const folderItems = computed(() =>
  activeFolder.value
    ? savedProducts.value.filter(p => p.category === activeFolder.value)
    : []
)

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

function showToast(msg: string) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = null }, 2200)
}

function openFolder(category: Category) {
  activeFolder.value = category
  subScreen.value = 'folder'
}

function toggleLike(id: string) {
  const p = savedProducts.value.find(p => p.id === id)
  if (!p) return
  p.isLiked = !p.isLiked
  if (userId.value) {
    supabase.from('products').update({ is_liked: p.isLiked }).eq('id', id).then()
  }
}

function deleteProduct(id: string) {
  savedProducts.value = savedProducts.value.filter(p => p.id !== id)
  showToast('삭제했어요')
  if (userId.value) {
    supabase.from('products').delete().eq('id', id).then()
  }
}

function saveBudgets(b: Record<Category, number>) {
  Object.assign(budgets, b)
}

function openDetailProduct(product: Product) {
  detailProduct.value = { ...product }
}

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
        isLiked: false,
        status: 'saved' as const,
        memo: '',
        savedAt: new Date().toISOString().slice(0, 10),
      })),
    }
  } catch (err: any) {
    showToast(err.message || '분석 중 오류가 발생했어요')
    subScreen.value = null
  } finally {
    analyzing.value = false
  }
}

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
</script>

<style>
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 8px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
