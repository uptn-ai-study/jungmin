<template>
  <div class="flex flex-col min-h-full overflow-y-auto pb-8">

    <!-- 전체 영상 목록 오버레이 -->
    <div v-if="showAllVideos" class="flex flex-col min-h-full">
      <div class="bg-paper px-5 py-4 flex items-center gap-3 border-b border-gray-100">
        <button
          class="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500"
          @click="showAllVideos = false"
        >←</button>
        <h2 class="font-black text-gray-900">최근 분석 영상</h2>
      </div>
      <div class="px-5 pt-4 flex flex-col gap-3">
        <div
          v-for="v in allRecentVideos"
          :key="v.url"
          class="bg-paper rounded-2xl p-3.5 shadow-paper flex items-center gap-3 cursor-pointer"
          @click="$emit('openVideo', v.url); showAllVideos = false"
        >
          <div class="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
            <img v-if="v.thumbnail" :src="v.thumbnail" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-2xl">🎬</div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-800 line-clamp-2 leading-snug">{{ v.title }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ v.count }}개 제품</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 홈 메인 -->
    <template v-else>
      <!-- URL 입력 헤더 -->
      <div class="bg-paper px-5 pt-10 pb-5 border-b border-gray-100 flex-shrink-0">
        <div class="mb-5">
          <h1 class="text-2xl font-black text-gray-900 tracking-tight">픽템</h1>
          <p class="text-sm font-medium text-gray-500 mt-1">유튜브 링크를 넣으면 영상 속 템들을 AI가 정리해줘요.</p>
        </div>
        <UrlInputBox :loading="analyzing" @analyze="$emit('analyze', $event)" />
      </div>

      <!-- 최근 분석 영상 -->
      <div class="flex-shrink-0 border-b border-gray-100">
        <div class="px-5 py-3 flex items-center justify-between">
          <h2 class="text-base font-black text-gray-900">최근 분석 영상</h2>
          <button
            v-if="allRecentVideos.length > 2"
            class="text-xs font-semibold text-gray-400"
            @click="showAllVideos = true"
          >더보기 ›</button>
        </div>
        <div v-if="allRecentVideos.length === 0" class="px-5 pb-5 flex flex-col items-center gap-1.5">
          <span class="text-3xl">🎬</span>
          <p class="text-sm font-medium text-gray-400">영상을 분석해서 정리해보세요</p>
        </div>
        <div v-else class="overflow-x-auto no-scrollbar pb-4" style="scroll-snap-type: x mandatory;">
          <div class="flex gap-3 pr-5">
            <div
              v-for="(v, i) in recentVideos"
              :key="v.url"
              :class="['flex-shrink-0 cursor-pointer', i === 0 ? 'ml-5' : '']"
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
      </div>

      <!-- 저장한 제품 -->
      <div class="px-5 pt-5">
        <h2 class="text-base font-black text-gray-900 mb-4">저장한 제품</h2>

        <!-- 카테고리 폴더 2x3 그리드 -->
        <div class="grid grid-cols-3 gap-3">
          <div
            v-for="cat in FOLDER_CATEGORIES"
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
                <span class="text-2xl" :style="{ opacity: productsByCategory(cat.key).length === 0 ? 0.3 : 1 }">{{ cat.emoji }}</span>
                <div
                  v-if="productsByCategory(cat.key).length > 0"
                  class="absolute -top-2 -right-1 min-w-5 h-5 px-1 rounded-full bg-white shadow-paper flex items-center justify-center"
                >
                  <span class="text-[10px] font-black text-gray-700">{{ productsByCategory(cat.key).length }}</span>
                </div>
              </div>
            </div>
            <p class="mt-2 text-xs font-bold text-gray-700 text-center">{{ cat.label }}</p>
          </div>
        </div>
      </div>
    </template>

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

const showAllVideos = ref(false)

const allRecentVideos = computed(() => {
  const seen = new Set<string>()
  const result: { url: string; title: string; thumbnail: string; count: number }[] = []
  for (const p of [...props.allProducts].sort((a, b) => b.savedAt.localeCompare(a.savedAt))) {
    if (!p.videoUrl || seen.has(p.videoUrl)) continue
    seen.add(p.videoUrl)
    const count = props.allProducts.filter(x => x.videoUrl === p.videoUrl).length
    result.push({ url: p.videoUrl, title: p.videoTitle ?? '제목 없음', thumbnail: p.videoThumbnail ?? '', count })
  }
  return result
})

const recentVideos = computed(() => allRecentVideos.value.slice(0, 3))

const productsByCategory = (key: Category) =>
  props.allProducts.filter(p => p.category === key)
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }
</style>
