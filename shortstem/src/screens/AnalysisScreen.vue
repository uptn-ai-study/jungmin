<template>
  <div class="flex flex-col min-h-full">
    <!-- 헤더 -->
    <div class="bg-paper px-5 py-4 flex items-center gap-3 shadow-paper">
      <button
        class="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500"
        @click="$emit('back')"
      >←</button>
      <h2 class="font-black text-gray-900">추천템 분석 결과</h2>
    </div>

    <!-- 로딩 -->
    <div v-if="analyzing" class="flex-1 flex flex-col items-center justify-center gap-5 py-20">
      <div class="w-16 h-16 rounded-full bg-baby-pink-light flex items-center justify-center animate-float">
        <span class="text-3xl">🔍</span>
      </div>
      <div class="text-center">
        <p class="font-bold text-gray-600">AI가 추천템을 분석 중이에요...</p>
        <p class="text-sm text-gray-400 mt-1">영상이 길면 시간이 조금 걸릴 수 있어요</p>
      </div>
      <div class="flex gap-1.5">
        <div v-for="i in 3" :key="i" class="w-2 h-2 rounded-full bg-baby-pink animate-bounce" :style="{ animationDelay: `${i * 0.15}s` }" />
      </div>
    </div>

    <!-- 결과 -->
    <template v-else-if="result">
      <!-- 영상 정보 카드 -->
      <div class="mx-5 mt-4 mb-2 bg-paper rounded-2xl p-3.5 shadow-paper flex items-center gap-3">
        <div class="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          <img v-if="result.video.thumbnail" :src="result.video.thumbnail" class="w-full h-full object-cover" />
          <span v-else class="w-full h-full flex items-center justify-center text-2xl">🎬</span>
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-gray-800 truncate">{{ result.video.title }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ result.video.channelName }} · {{ result.video.publishedAt }}</p>
        </div>
      </div>

      <!-- 제품 없음 -->
      <div v-if="products.length === 0" class="flex flex-col items-center py-16 text-center px-8">
        <span class="text-5xl mb-4">{{ noProductsReason === 'too_long' ? '⏱️' : '🔍' }}</span>
        <p class="font-black text-gray-700">
          {{ noProductsReason === 'too_long' ? '영상이 너무 길어요' : '분석 가능한 제품이 없어요' }}
        </p>
        <p class="text-sm font-medium text-gray-400 mt-1.5">
          <template v-if="noProductsReason === 'too_long'">
            15분 이상 영상은 직접 분석이 어려워요<br>영상 설명란에 제품 정보가 있어야 분석돼요
          </template>
          <template v-else>
            영상 설명과 화면을 분석했지만<br>제품 정보를 찾지 못했어요
          </template>
        </p>
      </div>

      <template v-else>
        <!-- 전체선택 + 개수 -->
        <div class="px-5 py-3 flex items-center justify-between">
          <p class="text-sm font-semibold text-gray-500">{{ products.length }}개 제품 발견</p>
          <button class="text-sm font-bold text-gray-700" @click="toggleAll">
            {{ allSelected ? '전체 해제' : '전체 선택' }}
          </button>
        </div>

        <!-- 제품 목록 -->
        <div class="px-5 flex flex-col gap-3 pb-4">
          <div
            v-for="p in products"
            :key="p.id"
            class="bg-paper rounded-2xl p-4 shadow-paper flex items-start gap-3 select-none"
          >
            <!-- 체크박스 -->
            <div
              class="w-5 h-5 rounded-full border-2 flex-shrink-0 self-start mt-0.5 flex items-center justify-center transition-colors cursor-pointer"
              :class="selected.has(p.id) ? 'bg-baby-pink-dark border-baby-pink-dark' : 'border-gray-300'"
              @click="toggleSelect(p.id)"
            >
              <span v-if="selected.has(p.id)" class="text-white text-[10px] font-bold">✓</span>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="text-sm font-black text-gray-900">{{ p.name }}</div>
                <a
                  v-if="p.timestamp"
                  :href="timestampUrl(result!.video.url, p.timestamp)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-900 text-white text-[11px] font-bold flex-shrink-0"
                >▶ {{ p.timestamp }}</a>
              </div>
              <div class="text-xs font-medium text-gray-400 mt-0.5">
                {{ p.seller }}
                <span v-if="p.itemCode && p.seller === '다이소'"> · #{{ p.itemCode }}</span>
              </div>
              <div class="mt-1.5 flex items-center gap-2">
                <span class="text-sm font-black text-gray-900">₩{{ p.price.toLocaleString() }}</span>
                <span v-if="p.priceSource === 'estimated' || p.priceSource === 'known'" class="text-[11px] font-medium text-gray-400">AI추정</span>
                <a
                  v-if="p.purchaseUrl"
                  :href="p.purchaseUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-base leading-none"
                  @click.stop
                >🔗</a>
              </div>

              <button
                v-if="p.description"
                class="mt-2 flex items-center gap-1 text-[11px] font-semibold text-gray-400"
                @click.stop="toggleExpand(p.id)"
              >
                <span>🪄 설명</span>
                <span class="transition-transform duration-200 text-[9px]" :class="expanded.has(p.id) ? 'rotate-180' : ''">▼</span>
              </button>
              <div
                v-if="p.description && expanded.has(p.id)"
                class="mt-1.5 bg-gray-50 rounded-xl px-3 py-2 text-xs font-medium text-gray-500 leading-relaxed"
              >
                {{ p.description }}
              </div>
            </div>
          </div>
        </div>

        <!-- 하단 버튼 -->
        <div class="px-5 mt-2 mb-8 flex gap-2.5">
          <AppButton variant="secondary" @click="$emit('back')">취소</AppButton>
          <AppButton :disabled="selected.size === 0" @click="save">
            {{ selected.size > 0 ? `${selected.size}개 저장하기` : '저장하기' }}
          </AppButton>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import AppButton from '../components/AppButton.vue'
import type { AnalysisResult, Product } from '../types'

const props = defineProps<{
  result: AnalysisResult | null
  analyzing: boolean
}>()

const emit = defineEmits<{
  back: []
  save: [products: Product[]]
}>()

const products = ref<Product[]>([])
const selected = ref<Set<string>>(new Set())
const expanded = ref<Set<string>>(new Set())

watch(() => props.result, (v) => {
  if (v) {
    products.value = v.products.map(p => ({ ...p }))
    selected.value = new Set(v.products.map(p => p.id))
  }
}, { immediate: true })

const noProductsReason = computed(() => props.result?.noProductsReason)
const allSelected = computed(() => products.value.length > 0 && products.value.every(p => selected.value.has(p.id)))

function timestampUrl(videoUrl: string, timestamp: string) {
  const [m, s] = timestamp.split(':').map(Number)
  const secs = (m || 0) * 60 + (s || 0)
  const videoId = videoUrl.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1]
  return videoId ? `https://www.youtube.com/watch?v=${videoId}&t=${secs}s` : videoUrl
}

function toggleSelect(id: string) {
  const s = new Set(selected.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selected.value = s
}

function toggleExpand(id: string) {
  const s = new Set(expanded.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expanded.value = s
}

function toggleAll() {
  if (allSelected.value) {
    selected.value = new Set()
  } else {
    selected.value = new Set(products.value.map(p => p.id))
  }
}

function save() {
  const toSave = products.value.filter(p => selected.value.has(p.id))
  const enriched = toSave.map(p => ({
    ...p,
    videoTitle: props.result?.video.title,
    videoUrl: props.result?.video.url,
    videoThumbnail: props.result?.video.thumbnail,
    savedAt: new Date().toISOString().slice(0, 10),
  }))
  emit('save', enriched)
}
</script>
