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
        @delete-all-products="deleteAllVideoProducts"
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
const budgets = ref<Record<string, number>>({})
const budgetSheetOpen = ref(false)

// DB row → Product
function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    seller: row.seller,
    category: row.category,
    itemCode: row.item_code,
    price: row.price,
    priceSource: row.price_source,
    priority: row.priority,
    memo: row.memo ?? '',
    videoTitle: row.video_title,
    videoUrl: row.video_url,
    videoThumbnail: row.video_thumbnail,
    purchaseUrl: row.purchase_url,
    timestamp: row.timestamp ?? null,
    description: row.description ?? null,
    savedAt: row.saved_at,
  }
}

// Product → DB row (user_id는 RLS가 처리)
function productToRow(p: Product) {
  return {
    id: p.id,
    name: p.name,
    seller: p.seller,
    category: p.category,
    item_code: p.itemCode,
    price: p.price,
    price_source: p.priceSource === 'naver' ? 'estimated' : p.priceSource,
    priority: p.priority,
    memo: p.memo,
    video_title: p.videoTitle ?? null,
    video_url: p.videoUrl ?? null,
    video_thumbnail: p.videoThumbnail ?? null,
    purchase_url: p.purchaseUrl ?? null,
    timestamp: p.timestamp ?? null,
    description: p.description ?? null,
    saved_at: p.savedAt,
    status: 'active',
  }
}

const folderItems = computed(() =>
  activeFolder.value ? savedProducts.value.filter(p => p.category === activeFolder.value) : []
)
const videoItems = computed(() =>
  activeVideoUrl.value ? savedProducts.value.filter(p => p.videoUrl === activeVideoUrl.value) : []
)

async function ensureAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    await supabase.auth.signInAnonymously()
    return
  }
  // 만료 1분 이내면 강제 갱신
  const expiresAt = session.expires_at ?? 0
  if (expiresAt - Math.floor(Date.now() / 1000) < 60) {
    await supabase.auth.refreshSession()
  }
}

async function loadProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('saved_at', { ascending: false })
  if (error) { console.error('load error', error); return }
  savedProducts.value = (data ?? []).map(rowToProduct)
}

onMounted(async () => {
  await ensureAuth()
  await loadProducts()
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

async function deleteProduct(id: string) {
  savedProducts.value = savedProducts.value.filter(p => p.id !== id)
  await supabase.from('products').delete().eq('id', id)
  showToast('삭제했어요')
}

async function updatePrice(id: string, price: number) {
  const p = savedProducts.value.find(p => p.id === id)
  if (!p) return
  p.price = price
  p.priceSource = 'user'
  await supabase.from('products').update({ price, price_source: 'user' }).eq('id', id)
}

async function deleteAllProducts() {
  if (!activeFolder.value) return
  const ids = savedProducts.value
    .filter(p => p.category === activeFolder.value)
    .map(p => p.id)
  savedProducts.value = savedProducts.value.filter(p => p.category !== activeFolder.value)
  await supabase.from('products').delete().in('id', ids)
  showToast('전체 삭제했어요')
}

async function deleteAllVideoProducts() {
  if (!activeVideoUrl.value) return
  const ids = savedProducts.value
    .filter(p => p.videoUrl === activeVideoUrl.value)
    .map(p => p.id)
  savedProducts.value = savedProducts.value.filter(p => p.videoUrl !== activeVideoUrl.value)
  await supabase.from('products').delete().in('id', ids)
  showToast('전체 삭제했어요')
}

function openDetailProduct(product: Product) {
  detailProduct.value = { ...product }
}

async function applyEdit(edited: Product) {
  const idx = savedProducts.value.findIndex(p => p.id === edited.id)
  if (idx !== -1) {
    const updated = { ...edited, priceSource: 'user' as const }
    savedProducts.value[idx] = updated
    await supabase.from('products').update(productToRow(updated)).eq('id', edited.id)
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

async function saveProducts(products: Product[]) {
  await ensureAuth()
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) { showToast('로그인 오류가 발생했어요'); return }
  savedProducts.value.unshift(...products)
  const rows = products.map(p => ({ ...productToRow(p), user_id: userId }))
  const { error } = await supabase.from('products').insert(rows)
  if (error) {
    console.error('Supabase insert error:', error)
    showToast(`저장 오류: ${error.code} ${error.message}`)
    savedProducts.value = savedProducts.value.filter(p => !products.find(pp => pp.id === p.id))
    return
  }
  showToast(`${products.length}개 저장됐어요`)
  subScreen.value = null
}
</script>

<style>
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 8px); }
</style>
