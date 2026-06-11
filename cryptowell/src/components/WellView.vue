<template>
  <div class="tab-view well-tab">

    <!-- 안내 카드 -->
    <div class="hint-card" v-show="phase === 'idle'">
      <div class="hint-top">
        <div class="hint-icon">🔮</div>
        <div class="hint-title">오늘의 투자 부적</div>
      </div>
      <div class="hint-desc">
        오백년 동안 신비로운 기운이 고인 우물이니라.<br>
        <b>{{ COST }} UP</b>을 던지면 오늘의 부적을 알려주리라.
      </div>
    </div>

    <!-- 석재 우물 카드 -->
    <div class="well-card" v-show="phase === 'idle' || phase === 'throwing'">
      <div class="well-wrap">
        <div class="well-img" role="img" aria-label="우물"></div>
        <div class="well-abyss">
          <div class="abyss-glow"></div>
          <div class="abyss-fog"></div>
          <div class="spark s1"></div>
          <div class="spark s2"></div>
          <div class="spark s3"></div>
          <div class="spark s4"></div>
          <div class="spark s5"></div>
          <div class="spark s6"></div>
          <div class="spark s7"></div>
        </div>
        <div class="coin-el" :class="{ go: coinGo }">
          <img v-if="upIconSrc" :src="upIconSrc" class="coin-up-img" alt="UP" />
        </div>
        <div class="ripple-wrap">
          <div class="rring" :class="{ go: rippleGo }"></div>
          <div class="rring" :class="{ go: rippleGo }"></div>
          <div class="rring" :class="{ go: rippleGo }"></div>
        </div>
      </div>

      <!-- 뽑기 횟수 -->
      <span class="throw-count-label">오늘 {{ throwCount }}회 뽑음</span>
    </div>

    <!-- 로딩 -->
    <div class="loading-card" v-show="phase === 'loading'">
      <div class="spin-ring"></div>
      <div class="load-text">우물이 운명을 읽는 중<span class="load-dots">{{ dots }}</span></div>
    </div>

    <!-- 결과 -->
    <div class="result-wrap" v-if="phase === 'result' && currentTalisman">
      <TalismanCard ref="talismanCardRef" :talisman="currentTalisman" :date-str="todayStr" />

      <!-- 저장 / 공유 -->
      <div class="action-row">
        <button class="act-btn" :disabled="saving" @click="onSave">
          {{ saving ? '저장 중...' : '부적 저장' }}
        </button>
        <button class="act-btn" :disabled="sharing" @click="onShare">
          {{ sharing ? '준비 중...' : '공유하기' }}
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { Phase, Talisman } from '../types'
import { useImageCapture } from '../composables/useImageCapture'
import TalismanCard from './TalismanCard.vue'

const props = defineProps<{
  phase: Phase
  pts: number
  throwCount: number
  coinGo: boolean
  rippleGo: boolean
  dots: string
  currentTalisman: Talisman | null
  todayStr: string
  COST: number
  upIconSrc?: string
}>()

const emit = defineEmits<{
  throwCoin: []
  resetWell: []
  toast: [msg: string]
  shared: []
}>()

const talismanCardRef = useTemplateRef<InstanceType<typeof TalismanCard>>('talismanCardRef')
const cardEl = { get value() { return talismanCardRef.value?.cardEl ?? null } }
const { saving, sharing, saveImage, shareImage } = useImageCapture(cardEl)

function onSave() {
  saveImage(props.todayStr, (msg) => emit('toast', msg))
}
function onShare() {
  if (!props.currentTalisman) return
  shareImage(props.todayStr, props.currentTalisman, (msg) => emit('toast', msg), () => emit('shared'))
}
</script>
