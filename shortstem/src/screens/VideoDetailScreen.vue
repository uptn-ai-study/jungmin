<template>
  <div class="flex flex-col pb-8">
    <!-- 토스트 -->
    <Transition name="toast">
      <div
        v-if="toastMsg"
        class="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-paper-lg whitespace-nowrap z-[300]"
      >{{ toastMsg }}</div>
    </Transition>

    <!-- 헤더 -->
    <div class="px-5 pt-10 py-4 flex items-center gap-3 bg-paper border-b border-gray-100">
      <button
        class="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500"
        @click="$emit('back')"
      >←</button>
      <h2 class="font-black text-gray-900 text-sm">영상 제품 목록</h2>
    </div>

    <!-- 영상 정보 모듈 -->
    <div
      class="mx-5 mt-4 mb-1 bg-paper rounded-2xl p-3.5 shadow-paper flex items-center gap-3 cursor-pointer"
      @click="openUrl(videoUrl)"
    >
      <div class="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        <img v-if="thumbnail" :src="thumbnail" class="w-full h-full object-cover" />
        <span v-else class="w-full h-full flex items-center justify-center text-2xl">🎬</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-bold text-gray-800 truncate">{{ videoTitle }}</p>
        <p class="text-xs text-gray-400 mt-0.5">{{ products.length }}개 제품 · 탭하여 영상 보기 ↗</p>
      </div>
    </div>

    <!-- 제품 목록 -->
    <div class="px-5 pt-3 flex flex-col gap-4">
      <div v-for="p in sortedProducts" :key="p.id" class="bg-paper rounded-2xl shadow-paper overflow-hidden">
        <!-- 타임스탬프 뱃지 (우측 정렬) -->
        <div v-if="p.timestamp" class="flex justify-end px-4 pt-3">
          <button
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-900 text-white text-[11px] font-bold"
            @click.stop="openUrl(timestampUrl(p))"
          >▶ {{ p.timestamp }}</button>
        </div>

        <!-- 상품 카드 (그림자/배경 제거, 모듈에 통합) -->
        <div @click="$emit('openProduct', p)">
          <ItemStickerCard
            :item-name="p.name"
            :seller="p.seller"
            :item-code="p.itemCode"
            :category="p.category"
            :estimated-price="p.price"
            :price-source="p.priceSource"
            :priority="p.priority"
            :memo="p.memo"
            :source-title="p.videoTitle"
            :source-url="p.videoUrl"
            :is-liked="p.isLiked"
            :rotate="0"
            :flat="true"
            @toggle-like="$emit('toggleLike', p.id)"
            @update-price="(price) => $emit('updatePrice', p.id, price)"
          />
        </div>

        <!-- 하단 버튼 -->
        <div class="flex gap-2 px-4 pb-4 pt-1">
          <button
            class="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 text-xs font-bold active:scale-95 transition-transform"
            @click.stop="$emit('deleteProduct', p.id)"
          >삭제하기</button>
          <button
            v-if="p.purchaseUrl"
            class="flex-1 py-2.5 rounded-xl bg-baby-pink-light text-baby-pink-dark text-xs font-bold active:scale-95 transition-transform"
            @click.stop="openUrl(p.purchaseUrl)"
          >구매하러 가기</button>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-if="products.length === 0" class="flex flex-col items-center py-16 text-center">
        <span class="text-5xl mb-4">🎬</span>
        <p class="font-black text-gray-800">저장된 제품이 없어요</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ItemStickerCard from '../components/ItemStickerCard.vue'
import type { Product } from '../types'

const props = defineProps<{
  videoUrl: string
  products: Product[]
}>()

defineEmits<{
  back: []
  toggleLike: [id: string]
  deleteProduct: [id: string]
  updatePrice: [id: string, price: number]
  openProduct: [product: Product]
}>()

const toastMsg = ref<string | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  toastMsg.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = null }, 2200)
}

function openUrl(url: string | null | undefined) {
  if (!url || url === '#') {
    showToast('영상을 확인할 수 없습니다')
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

const videoTitle = computed(() => props.products[0]?.videoTitle ?? '영상 제품 목록')
const thumbnail = computed(() => props.products[0]?.videoThumbnail ?? null)

const sortedProducts = computed(() => {
  return [...props.products].sort((a, b) => {
    if (!a.timestamp) return 1
    if (!b.timestamp) return -1
    return toSeconds(a.timestamp) - toSeconds(b.timestamp)
  })
})

function toSeconds(ts: string): number {
  const parts = ts.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

function timestampUrl(p: Product): string {
  if (!p.videoUrl || !p.timestamp) return ''
  const secs = toSeconds(p.timestamp)
  try {
    const url = new URL(p.videoUrl)
    url.searchParams.set('t', String(secs))
    return url.toString()
  } catch {
    return p.videoUrl
  }
}
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: opacity 0.2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; }
</style>
