<template>
  <div class="flex flex-col pb-24 overflow-y-auto">
    <!-- 헤더 -->
    <div class="px-5 pt-10 pb-6 bg-paper border-b border-gray-100">
      <h1 class="text-2xl font-black text-gray-900 tracking-tight">마이</h1>
    </div>

    <!-- 카테고리 폴더 -->
    <div class="pt-5 flex-shrink-0">
      <div class="px-5 mb-3">
        <h2 class="text-base font-black text-gray-900">카테고리</h2>
      </div>
      <div class="grid grid-cols-3 gap-3 px-5">
        <div
          v-for="cat in sortedCategories"
          :key="cat.key"
          class="flex flex-col items-center cursor-pointer"
          @click="$emit('openFolder', cat.key)"
        >
          <div class="w-full relative">
            <div class="rounded-t-md" style="width: 40%; height: 10px;" :style="{ background: cat.tabColor }" />
            <div
              class="w-full rounded-b-xl rounded-tr-xl relative flex items-center justify-center"
              style="height: 72px;"
              :style="{ background: cat.color }"
            >
              <span class="text-2xl" :style="{ opacity: categoryCount(cat.key) === 0 ? 0.3 : 1 }">{{ cat.emoji }}</span>
              <div
                v-if="categoryCount(cat.key) > 0"
                class="absolute -top-2 -right-1 min-w-5 h-5 px-1 rounded-full bg-white shadow-paper flex items-center justify-center"
              >
                <span class="text-[10px] font-black text-gray-700">{{ categoryCount(cat.key) }}</span>
              </div>
            </div>
          </div>
          <p class="mt-2 text-xs font-bold text-gray-700 text-center">{{ cat.label }}</p>
        </div>
      </div>
    </div>

    <!-- 최근 찜한템 -->
    <div class="pt-6 flex-shrink-0">
      <div class="flex items-center justify-between px-5 mb-3">
        <h2 class="text-base font-black text-gray-900">최근 찜한템</h2>
        <button class="text-xs font-semibold text-gray-400" @click="$emit('openLiked')">전체보기 →</button>
      </div>
      <!-- 빈 상태 -->
      <div v-if="likedProducts.length === 0" class="mx-5 py-6 rounded-2xl bg-gray-50 flex flex-col items-center gap-1.5">
        <span class="text-3xl">🤍</span>
        <p class="text-xs font-bold text-gray-400">아직 찜한 템이 없어요</p>
        <p class="text-[11px] font-medium text-gray-300">마음에 드는 제품에 하트를 눌러보세요</p>
      </div>
      <!-- 찜 리스트 -->
      <div v-else class="mx-5 bg-paper rounded-2xl shadow-paper overflow-hidden">
        <div
          v-for="(p, i) in likedProducts"
          :key="p.id"
          class="flex items-center gap-3 px-4 py-3 cursor-pointer"
          :class="i < likedProducts.length - 1 ? 'border-b border-gray-50' : ''"
          @click="$emit('openProduct', p)"
        >
          <div class="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img v-if="p.videoThumbnail" :src="p.videoThumbnail" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-lg">{{ categoryEmojiMap[p.category] ?? '📦' }}</div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-0.5">
              <span class="tag-label text-[10px]" :class="categoryTagMap[p.category]">{{ p.category }}</span>
            </div>
            <p class="text-sm font-bold text-gray-900 truncate leading-snug">{{ p.name }}</p>
          </div>
          <p class="text-sm font-black text-gray-800 flex-shrink-0">₩{{ p.price.toLocaleString() }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FOLDER_CATEGORIES } from '../data/mockData'
import type { Product, Category } from '../types'

const props = defineProps<{
  allProducts: Product[]
}>()

defineEmits<{
  openFolder: [category: Category]
  openLiked: []
  openProduct: [product: Product]
}>()

const categoryTagMap: Record<Category, string> = {
  '뷰티': 'tag-beauty', '전자기기': 'tag-tech', '생활용품': 'tag-life',
  '식품': 'tag-food', '패션': 'tag-fashion', '기타': 'tag-etc',
}

const categoryEmojiMap: Record<Category, string> = {
  '뷰티': '💄', '전자기기': '🔌', '생활용품': '🏠', '식품': '🍎', '패션': '👗', '기타': '📦',
}

const categoryCount = (key: Category) => props.allProducts.filter(p => p.category === key).length

const sortedCategories = computed(() =>
  [...FOLDER_CATEGORIES].sort((a, b) => categoryCount(b.key) - categoryCount(a.key))
)

const likedProducts = computed(() =>
  [...props.allProducts]
    .filter(p => p.isLiked)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .slice(0, 5)
)
</script>
