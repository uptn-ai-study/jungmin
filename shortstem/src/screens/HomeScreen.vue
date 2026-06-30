<template>
  <div class="flex flex-col min-h-full overflow-y-auto pb-8">

    <!-- URL 입력 헤더 -->
    <div class="bg-paper px-5 pt-10 pb-5 border-b border-gray-100 flex-shrink-0">
      <div class="mb-5">
        <h1 class="text-2xl font-black text-gray-900 tracking-tight">픽템</h1>
        <p class="text-sm font-medium text-gray-500 mt-1">유튜브 링크를 붙여넣으면 추천템을 자동으로 정리해줘요</p>
      </div>
      <UrlInputBox :loading="analyzing" @analyze="$emit('analyze', $event)" />
    </div>

    <!-- 최근 분석 영상 (접기/펼치기) -->
    <div v-if="recentVideos.length > 0" class="flex-shrink-0 border-b border-gray-100">
      <button
        class="w-full px-5 py-3 flex items-center justify-between"
        @click="videosOpen = !videosOpen"
      >
        <span class="text-sm font-bold text-gray-500">🕒 최근 분석 영상</span>
        <span class="text-xs text-gray-400">{{ videosOpen ? '접기 ▲' : '펼치기 ▼' }}</span>
      </button>
      <div v-if="videosOpen" class="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-4" style="scroll-snap-type: x mandatory;">
        <div
          v-for="v in recentVideos"
          :key="v.url"
          class="flex-shrink-0 cursor-pointer"
          style="width: 160px; scroll-snap-align: start;"
          @click="$emit('openVideo', v.url)"
        >
          <div class="relative w-full rounded-xl overflow-hidden bg-gray-100" style="height: 90px;">
            <img v-if="v.thumbnail" :src="v.thumbnail" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-3xl">🎬</div>
            <div class="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
              {{ v.count }}개 제품
            </div>
          </div>
          <p class="mt-1.5 text-xs font-bold text-gray-800 line-clamp-2 leading-snug">{{ v.title }}</p>
        </div>
      </div>
    </div>

    <!-- 저장한 제품 (카테고리별) -->
    <div class="px-5 pt-5">
      <h2 class="text-base font-black text-gray-900 mb-4">📦 저장한 제품</h2>

      <!-- 빈 상태 -->
      <div v-if="allProducts.length === 0" class="py-10 flex flex-col items-center gap-2">
        <span class="text-4xl">📭</span>
        <p class="text-sm font-bold text-gray-400">아직 저장한 제품이 없어요</p>
        <p class="text-xs font-medium text-gray-300">위에서 유튜브 링크를 분석해보세요</p>
      </div>

      <!-- 카테고리별 섹션 -->
      <div v-else class="flex flex-col gap-6">
        <div v-for="cat in activeCategories" :key="cat.key">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-bold text-gray-700">{{ cat.emoji }} {{ cat.label }}</span>
            <button class="text-xs font-semibold text-gray-400" @click="$emit('openFolder', cat.key)">
              전체보기 →
            </button>
          </div>
          <div class="flex flex-col gap-2">
            <div
              v-for="p in productsByCategory(cat.key).slice(0, 3)"
              :key="p.id"
              class="bg-paper rounded-xl px-4 py-3 shadow-paper flex items-center gap-3"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-gray-900 truncate">{{ p.name }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ p.seller }}</p>
              </div>
              <p class="text-sm font-black text-gray-800 flex-shrink-0">₩{{ p.price.toLocaleString() }}</p>
            </div>
            <button
              v-if="productsByCategory(cat.key).length > 3"
              class="text-xs font-semibold text-gray-400 text-center py-1"
              @click="$emit('openFolder', cat.key)"
            >
              +{{ productsByCategory(cat.key).length - 3 }}개 더보기
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import UrlInputBox from '../components/UrlInputBox.vue'
import { FOLDER_CATEGORIES } from '../data/mockData'
import type { Product, Category } from '../types'

const props = defineProps<{
  allProducts: Product[]
  analyzing: boolean
}>()

defineEmits<{
  analyze: [url: string]
  openVideo: [videoUrl: string]
  openFolder: [category: Category]
}>()

const videosOpen = ref(false)

const recentVideos = computed(() => {
  const seen = new Set<string>()
  const result: { url: string; title: string; thumbnail: string; count: number }[] = []
  for (const p of [...props.allProducts].sort((a, b) => b.savedAt.localeCompare(a.savedAt))) {
    if (!p.videoUrl || seen.has(p.videoUrl)) continue
    seen.add(p.videoUrl)
    const count = props.allProducts.filter(x => x.videoUrl === p.videoUrl).length
    result.push({ url: p.videoUrl, title: p.videoTitle ?? '제목 없음', thumbnail: p.videoThumbnail ?? '', count })
    if (result.length >= 5) break
  }
  return result
})

const productsByCategory = (key: Category) =>
  props.allProducts.filter(p => p.category === key)

const activeCategories = computed(() =>
  FOLDER_CATEGORIES.filter(cat => productsByCategory(cat.key).length > 0)
)
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }
</style>
