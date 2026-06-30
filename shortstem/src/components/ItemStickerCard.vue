<template>
  <div :class="flat ? 'relative p-4' : 'relative bg-paper rounded-2xl p-4 shadow-paper'">
    <!-- 카테고리 뱃지 -->
    <div class="mb-2.5">
      <span class="tag-label" :class="categoryTag">{{ category }}</span>
    </div>

    <!-- 상품명 -->
    <p class="font-black text-gray-900 text-sm leading-snug pr-7 mb-0.5">{{ itemName }}</p>

    <!-- 판매처 + 품번 -->
    <p class="text-xs font-medium text-gray-400 mb-3">
      {{ seller }}<span v-if="seller === '다이소' && itemCode" class="ml-1 text-gray-300">#{{ itemCode }}</span>
    </p>

    <!-- 가격 -->
    <div class="flex items-center gap-2" @click.stop>
      <template v-if="editingPrice">
        <span class="text-base font-black text-gray-900">₩</span>
        <input
          ref="priceInputRef"
          v-model.number="draftPrice"
          type="number"
          class="w-28 text-base font-black text-gray-900 border-b-2 border-[#B088FF] outline-none bg-transparent"
          @keydown.enter="confirmPrice"
          @keydown.esc="cancelPrice"
        />
        <button class="text-xs font-semibold text-baby-pink-dark" @click="confirmPrice">확인</button>
        <button class="text-xs font-semibold text-gray-300" @click="cancelPrice">취소</button>
      </template>
      <template v-else>
        <span class="text-base font-black text-gray-900">₩{{ estimatedPrice.toLocaleString() }}</span>
        <button
          class="text-[11px] font-semibold text-gray-300"
          @click="startEditPrice"
        >수정</button>
        <span v-if="priceSource === 'estimated' || priceSource === 'known'" class="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 text-[10px] font-semibold text-gray-400">AI추정</span>
      </template>
    </div>

    <!-- 메모 -->
    <div v-if="memo" class="mt-1.5">
      <p class="text-xs font-medium text-gray-500 truncate">{{ memo }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import type { Category, Priority, PriceSource } from '../types'

const props = defineProps<{
  itemName: string
  seller: string
  itemCode?: string | null
  category: Category
  estimatedPrice: number
  priceSource: PriceSource
  priority: Priority
  memo?: string
  sourceTitle?: string
  sourceUrl?: string
  rotate?: number
  flat?: boolean
}>()

const emit = defineEmits<{
  updatePrice: [price: number]
}>()

const editingPrice = ref(false)
const draftPrice = ref(0)
const priceInputRef = ref<HTMLInputElement>()

function startEditPrice() {
  draftPrice.value = props.estimatedPrice
  editingPrice.value = true
  nextTick(() => priceInputRef.value?.focus())
}

function confirmPrice() {
  if (draftPrice.value > 0) {
    emit('updatePrice', draftPrice.value)
  }
  editingPrice.value = false
}

function cancelPrice() {
  editingPrice.value = false
}

const categoryTag = computed(() => {
  const map: Record<Category, string> = {
    '뷰티': 'tag-beauty',
    '전자기기': 'tag-tech',
    '생활용품': 'tag-life',
    '식품': 'tag-food',
    '패션': 'tag-fashion',
    '기타': 'tag-etc',
  }
  return map[props.category] ?? 'tag-default'
})
</script>
