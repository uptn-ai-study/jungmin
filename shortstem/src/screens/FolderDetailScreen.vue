<template>
  <div class="flex flex-col pb-8">
    <!-- 헤더 -->
    <div class="px-5 pt-10 py-4 flex items-center gap-3 bg-paper border-b border-gray-100">
      <button
        class="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 transition"
        @click="$emit('back')"
      >←</button>
      <span class="text-xl">{{ folder?.emoji }}</span>
      <h2 class="font-black text-gray-900 text-lg">{{ folder?.label }}</h2>
      <span class="ml-auto text-xs font-semibold text-gray-400">{{ items.length }}개</span>

      <!-- 정렬 드롭다운 -->
      <div class="relative" ref="sortRef">
        <button
          class="flex items-center gap-0.5 text-xs text-gray-400"
          @click="sortOpen = !sortOpen"
        >{{ SORT_LABELS[sortKey] }} ▾</button>
        <div
          v-if="sortOpen"
          class="absolute right-0 top-6 bg-white rounded-xl shadow-lg z-50 min-w-[120px] overflow-hidden"
        >
          <div
            v-for="(label, key) in SORT_LABELS"
            :key="key"
            class="px-4 py-2 text-sm text-gray-700 cursor-pointer"
            :class="sortKey === key ? 'font-semibold text-[#B088FF]' : ''"
            @click="selectSort(key as SortKey)"
          >{{ label }}</div>
        </div>
      </div>

    </div>

    <!-- 전체 삭제 확인 팝업 -->
    <Transition name="fade">
      <div
        v-if="confirmMode"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      >
        <div class="bg-white rounded-2xl shadow-paper-lg px-6 py-6 mx-8 w-full max-w-[320px]">
          <p class="font-black text-gray-900 text-base text-center mb-1">전체 삭제할까요?</p>
          <p class="text-sm text-gray-400 text-center mb-5">{{ folder?.label }} 보관함의 {{ items.length }}개 항목이<br>모두 삭제돼요.</p>
          <div class="flex gap-2">
            <AppButton variant="secondary" @click="cancelConfirm">취소</AppButton>
            <AppButton variant="danger" @click="doDeleteAll">삭제</AppButton>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 개별 삭제 확인 팝업 -->
    <Transition name="fade">
      <div
        v-if="deleteTargetId"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      >
        <div class="bg-white rounded-2xl shadow-paper-lg px-6 py-6 mx-8 w-full max-w-[320px]">
          <p class="font-black text-gray-900 text-base text-center mb-5">상품을 삭제하시겠어요?</p>
          <div class="flex gap-2">
            <AppButton variant="secondary" @click="deleteTargetId = null">취소</AppButton>
            <AppButton variant="danger" @click="confirmDelete">삭제</AppButton>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 아이템 목록 -->
    <div class="px-5 pt-5 flex flex-col gap-3">
      <!-- 전체 삭제 -->
      <div v-if="sortedItems.length" class="flex justify-end">
        <button
          class="text-xs font-semibold text-gray-400"
          @click="startConfirm"
        >전체 삭제</button>
      </div>

      <template v-if="sortedItems.length">
        <div v-for="p in sortedItems" :key="p.id" class="relative">
          <ItemStickerCard
            :item-name="p.name"
            :seller="p.seller"
            :item-code="p.itemCode"
            :category="p.category"
            :estimated-price="p.price"
            :price-source="p.priceSource"
            :priority="p.priority"
            :memo="p.memo"
            :description="p.description"
            :source-title="p.videoTitle"
            :source-url="p.videoUrl"
            :purchase-url="p.purchaseUrl"
            :rotate="0"
            @update-price="(price) => $emit('updatePrice', p.id, price)"
            @click="$emit('openProduct', p)"
          />
          <button
            class="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-[10px] z-10"
            @click.stop="deleteTargetId = p.id"
          >✕</button>
        </div>
      </template>

      <!-- 빈 상태 -->
      <div v-else class="flex flex-col items-center py-16 text-center">
        <span class="text-5xl mb-4">{{ folder?.emoji }}</span>
        <p class="font-black text-gray-800">아직 비어있어요</p>
        <p class="text-sm font-medium text-gray-400 mt-1.5">{{ folder?.label }}템을 저장해 보세요.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import AppButton from '../components/AppButton.vue'
import ItemStickerCard from '../components/ItemStickerCard.vue'
import { FOLDER_CATEGORIES } from '../data/mockData'
import type { Product, Category } from '../types'

type SortKey = 'savedAt' | 'price_asc' | 'price_desc'

const SORT_LABELS: Record<SortKey, string> = {
  savedAt: '최신순',
  price_asc: '낮은 가격순',
  price_desc: '높은 가격순',
}

const props = defineProps<{
  category: Category
  items: Product[]
  budget: number
}>()

const emit = defineEmits<{
  back: []
  deleteProduct: [id: string]
  deleteAllProducts: []
  updatePrice: [id: string, price: number]
  openBudget: []
  openProduct: [product: Product]
}>()

// 정렬
const sortKey = ref<SortKey>('savedAt')
const sortOpen = ref(false)
const sortRef = ref<HTMLElement | null>(null)

function selectSort(key: SortKey) {
  sortKey.value = key
  sortOpen.value = false
}

function onClickOutside(e: MouseEvent) {
  if (sortRef.value && !sortRef.value.contains(e.target as Node)) {
    sortOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

const sortedItems = computed(() => {
  const list = [...props.items]
  if (sortKey.value === 'price_asc') return list.sort((a, b) => a.price - b.price)
  if (sortKey.value === 'price_desc') return list.sort((a, b) => b.price - a.price)
  return list.sort((a, b) => b.savedAt.localeCompare(a.savedAt))
})

// 개별 삭제 확인
const deleteTargetId = ref<string | null>(null)

function confirmDelete() {
  if (deleteTargetId.value) emit('deleteProduct', deleteTargetId.value)
  deleteTargetId.value = null
}

// 전체 삭제 확인
const confirmMode = ref(false)
let confirmTimer: ReturnType<typeof setTimeout> | null = null

function startConfirm() {
  confirmMode.value = true
  confirmTimer = setTimeout(() => { confirmMode.value = false }, 3000)
}

function cancelConfirm() {
  confirmMode.value = false
  if (confirmTimer) clearTimeout(confirmTimer)
}

function doDeleteAll() {
  confirmMode.value = false
  if (confirmTimer) clearTimeout(confirmTimer)
  emit('deleteAllProducts')
}

const folder = computed(() => FOLDER_CATEGORIES.find(c => c.key === props.category))
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
