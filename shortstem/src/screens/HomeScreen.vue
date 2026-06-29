<template>
  <div class="flex flex-col h-full overflow-y-auto pb-20">

    <!-- 섹션 1: 헤더 + URL 입력 -->
    <div class="bg-paper px-5 pt-10 pb-5 border-b border-gray-100 flex-shrink-0">
      <div class="mb-5">
        <h1 class="text-2xl font-black text-gray-900 tracking-tight">쇼츠템</h1>
        <p class="text-sm font-medium text-gray-500 mt-1">유튜브 링크를 붙여넣으면 추천템을 자동으로 정리해줘요</p>
      </div>
      <UrlInputBox :loading="analyzing" @analyze="$emit('analyze', $event)" />
    </div>

    <!-- 섹션 2: 최근 분석 영상 -->
    <div class="pt-5 flex-shrink-0">
      <div class="px-5 mb-3">
        <h2 class="text-base font-black text-gray-900">최근 분석 영상</h2>
      </div>
      <div v-if="recentVideos.length === 0" class="mx-5 py-6 rounded-2xl bg-gray-50 flex flex-col items-center gap-1.5">
        <span class="text-3xl">🎬</span>
        <p class="text-xs font-bold text-gray-400">아직 분석한 영상이 없어요</p>
        <p class="text-[11px] font-medium text-gray-300">위 링크창에 유튜브 URL을 붙여넣어 보세요</p>
      </div>
      <div v-else class="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2" style="scroll-snap-type: x mandatory;">
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

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UrlInputBox from '../components/UrlInputBox.vue'
import type { Product } from '../types'

const props = defineProps<{
  allProducts: Product[]
  analyzing: boolean
}>()

defineEmits<{
  analyze: [url: string]
  openVideo: [videoUrl: string]
}>()

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
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }
</style>
