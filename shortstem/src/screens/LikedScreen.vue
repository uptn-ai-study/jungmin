<template>
  <div class="flex flex-col min-h-full">
    <!-- 헤더 -->
    <div class="bg-paper px-5 py-4 flex items-center gap-3 shadow-paper">
      <button
        class="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500"
        @click="$emit('back')"
      >←</button>
      <h2 class="font-extrabold text-gray-800">내 찜 목록</h2>
      <span v-if="likedProducts.length > 0" class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-baby-pink-light text-pink-600 text-xs font-bold">
        {{ likedProducts.length }}개
      </span>
    </div>

    <!-- 빈 상태 -->
    <div v-if="likedProducts.length === 0" class="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
      <div class="text-5xl mb-4">🤍</div>
      <p class="font-bold text-gray-500 text-base">아직 찜한 추천템이 없어요</p>
      <p class="text-sm text-gray-400 mt-1">마음에 드는 추천템에 하트를 눌러보세요</p>
    </div>

    <!-- 목록 -->
    <div v-else class="px-5 pt-5 pb-8 flex flex-col gap-3">
      <div
        v-for="(p, i) in likedProducts"
        :key="p.id"
        @click="$emit('openProduct', p)"
      >
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
          :rotate="rotations[i % rotations.length]"
          @toggle-like="$emit('toggleLike', p.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ItemStickerCard from '../components/ItemStickerCard.vue'
import type { Product } from '../types'

const props = defineProps<{
  allProducts: Product[]
}>()

defineEmits<{
  back: []
  toggleLike: [id: string]
  openProduct: [product: Product]
}>()

const rotations = [0, 0, 0, 0, 0]
const likedProducts = computed(() => props.allProducts.filter(p => p.isLiked))
</script>
