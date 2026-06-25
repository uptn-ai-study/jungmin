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

        <!-- 구매 링크 (있을 때만) / 없으면 찜하기 -->
        <a
          v-if="product.purchaseUrl"
          :href="product.purchaseUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full mt-4 py-3 rounded-xl text-sm font-bold text-center block bg-gray-900 text-white"
        >🛒 구매하러 가기</a>
        <button
          v-else
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
