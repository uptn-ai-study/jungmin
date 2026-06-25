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
    </div>

    <!-- 아이템 목록 -->
    <div class="px-5 pt-5 flex flex-col gap-3">
      <template v-if="items.length">
        <div v-for="(p, i) in items" :key="p.id" class="relative">
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
          <button
            class="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white shadow-paper flex items-center justify-center text-xs text-gray-400 hover:text-rose-400 transition-colors z-10"
            @click="$emit('deleteProduct', p.id)"
          >✕</button>
        </div>
      </template>

      <!-- 빈 상태 -->
      <div v-else class="flex flex-col items-center py-16 text-center">
        <span class="text-5xl mb-4">{{ folder?.emoji }}</span>
        <p class="font-black text-gray-800">아직 비어있어요</p>
        <p class="text-sm font-medium text-gray-400 mt-1.5">홈에서 유튜브 링크를 정리해보세요</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ItemStickerCard from '../components/ItemStickerCard.vue'
import { FOLDER_CATEGORIES } from '../data/mockData'
import type { Product, Category } from '../types'

const props = defineProps<{
  category: Category
  items: Product[]
  budget: number
}>()

defineEmits<{
  back: []
  toggleLike: [id: string]
  deleteProduct: [id: string]
  openBudget: []
  openProduct: [product: Product]
}>()

const folder = computed(() => FOLDER_CATEGORIES.find(c => c.key === props.category))
</script>
