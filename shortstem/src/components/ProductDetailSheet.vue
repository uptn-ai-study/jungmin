<template>
  <Transition name="fade">
    <div
      v-if="product"
      class="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end justify-center"
      @click.self="$emit('close')"
    >
      <div class="w-full max-w-[430px] bg-paper rounded-t-3xl px-5 pb-10 pt-3 shadow-paper-lg">
        <div class="w-10 h-1.5 rounded-full bg-gray-200 mx-auto mb-5" />

        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-black text-gray-900">상품 수정</h3>
          <button
            class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500"
            @click="$emit('close')"
          >✕</button>
        </div>

        <!-- 출처 영상 -->
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
            <label class="text-xs font-semibold text-gray-400 mb-1 block">구매 링크</label>
            <div class="flex items-center gap-2">
              <input
                v-model="draft.purchaseUrl"
                class="flex-1 h-11 px-4 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-gray-400 bg-white truncate"
                placeholder="구매 링크를 직접 입력할 수 있어요"
              />
              <button
                v-if="draft.purchaseUrl"
                class="text-sm font-medium text-[#B088FF] flex-shrink-0"
                @click="window.open(draft.purchaseUrl!, '_blank')"
              >↗</button>
            </div>
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-400 mb-1 block">상품명</label>
            <input v-model="draft.name" class="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-gray-400 bg-white" />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-400 mb-1 block">판매처</label>
            <input v-model="draft.seller" class="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-gray-400 bg-white" />
          </div>
          <div v-if="draft.seller === '다이소'">
            <label class="text-xs font-semibold text-gray-400 mb-1 block">품번</label>
            <input
              v-model="draft.itemCode"
              class="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-gray-400 bg-white"
              placeholder="예) 12345"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-400 mb-1 block">가격 (원)</label>
            <input v-model.number="draft.price" type="number" class="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-gray-400 bg-white" />
          </div>
          <div>
            <label class="text-xs font-semibold text-gray-400 mb-1 block">메모</label>
            <input v-model="draft.memo" class="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:border-gray-400 bg-white" placeholder="선택사항" />
          </div>
        </div>

        <!-- 저장 버튼 -->
        <div class="flex gap-2.5 mt-5">
          <AppButton variant="secondary" @click="$emit('close')">취소</AppButton>
          <AppButton @click="handleSave">저장하기</AppButton>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import AppButton from './AppButton.vue'

const window = globalThis.window
import type { Product } from '../types'

const props = defineProps<{ product: Product | null }>()

const emit = defineEmits<{
  close: []
  save: [edited: Product]
}>()

const draft = ref<Product>({} as Product)

watch(
  () => props.product,
  (p) => { if (p) draft.value = { ...p } },
  { immediate: true }
)

function handleSave() {
  emit('save', { ...draft.value, priceSource: 'user' })
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
