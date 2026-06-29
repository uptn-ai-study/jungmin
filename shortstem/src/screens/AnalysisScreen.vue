<template>
  <div class="flex flex-col min-h-full">
    <!-- 네비 헤더 -->
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

      <!-- 제품 없음 빈 상태 -->
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
        <!-- 제품 수 안내 -->
        <div class="px-5 py-3">
          <p class="text-sm font-semibold text-gray-500">{{ products.length }}개 제품을 찾았어요</p>
        </div>

        <!-- 제품 목록 -->
        <div class="px-5 flex flex-col gap-4 pb-4">
          <div v-for="p in products" :key="p.id">
            <!-- 타임스탬프 뱃지 (우측 정렬) -->
            <div v-if="p.timestamp" class="flex justify-end mb-1.5">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-900 text-white text-[11px] font-bold">
                ▶ {{ p.timestamp }}
              </span>
            </div>

            <div class="bg-paper rounded-2xl p-4 shadow-paper">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-black text-gray-900">{{ p.name }}</div>
                  <div class="text-xs font-medium text-gray-400 mt-0.5">
                    {{ p.seller }}
                    <span v-if="p.itemCode && p.seller === '다이소'"> · #{{ p.itemCode }}</span>
                  </div>
                </div>
                <button
                  class="text-gray-300 text-sm flex-shrink-0"
                  @click="$emit('editProduct', p)"
                >✎</button>
              </div>

              <div class="mt-2.5 flex items-center gap-2">
                <span class="text-sm font-black text-gray-900">₩{{ p.price.toLocaleString() }}</span>
                <span v-if="p.priceSource === 'estimated' || p.priceSource === 'known'" class="text-[11px] font-medium text-gray-400">AI추정</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 저장 버튼 -->
        <div class="px-5 mt-2 mb-8 flex gap-2.5">
          <AppButton variant="secondary" @click="$emit('back')">취소</AppButton>
          <AppButton @click="save">타임라인 저장하기</AppButton>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { ref } from 'vue'
import AppButton from '../components/AppButton.vue'
import type { AnalysisResult, Product } from '../types'

const props = defineProps<{
  result: AnalysisResult | null
  analyzing: boolean
}>()

const noProductsReason = computed(() => props.result?.noProductsReason)

const emit = defineEmits<{
  back: []
  save: [products: Product[]]
  editProduct: [product: Product]
}>()

const products = ref<Product[]>([])

watch(() => props.result, (v) => {
  if (v) products.value = v.products.map(p => ({ ...p }))
}, { immediate: true })

function save() {
  const enriched = products.value.map(p => ({
    ...p,
    videoTitle: props.result?.video.title,
    videoUrl: props.result?.video.url,
    videoThumbnail: props.result?.video.thumbnail,
    savedAt: new Date().toISOString().slice(0, 10),
  }))
  emit('save', enriched)
}
</script>
