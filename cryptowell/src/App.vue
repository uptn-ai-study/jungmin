<template>
  <AppToast :toast="toast" />
  <AppModal v-if="modalItem" :item="modalItem" @close="modalItem = null" />

  <!-- 헤더 -->
  <AppHeader :pts="pts" :up-icon-src="upIconSrc" @back="onBack" />

  <!-- 상단 탭 바 -->
  <div class="top-tabs">
    <button class="top-tab" :class="{ active: currentTab === 'well' }" @click="currentTab = 'well'">
      우물
    </button>
    <button class="top-tab" :class="{ active: currentTab === 'history' }" @click="currentTab = 'history'">
      부적첩
    </button>
  </div>

  <!-- 스크롤 콘텐츠 -->
  <main class="tab-content">
    <WellView
      v-show="currentTab === 'well'"
      :phase="phase"
      :pts="pts"
      :throw-count="throwCount"
      :coin-go="coinGo"
      :ripple-go="rippleGo"
      :dots="dots"
      :current-talisman="currentTalisman"
      :today-str="todayStr"
      :COST="COST"
      :up-icon-src="upIconSrc"
      @throw-coin="throwCoin"
      @reset-well="resetWell"
      @toast="showToast"
      @shared="markShared"
    />
    <HistoryView
      v-show="currentTab === 'history'"
      :throw-history="throwHistory"
      @open-modal="modalItem = $event"
    />
  </main>

  <!-- 하단 고정 CTA: idle / throwing — UP 던지기 -->
  <div
    v-if="currentTab === 'well' && (phase === 'idle' || phase === 'throwing')"
    class="bottom-cta"
  >
    <button class="throw-btn" :disabled="pts < COST" @click="throwCoin">
      <img v-if="upIconSrc" :src="upIconSrc" class="btn-up-icon" alt="UP" />
      {{ COST }} UP 던지기
    </button>
  </div>

  <!-- 하단 고정 CTA: result — 확인 -->
  <div
    v-if="currentTab === 'well' && phase === 'result'"
    class="bottom-cta"
  >
    <button class="throw-btn" @click="resetWell">확인</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TabId, ThrowRecord } from './types'
import { useWell, COST } from './composables/useWell'
import { useToast } from './composables/useToast'
import AppHeader from './components/AppHeader.vue'
import AppToast from './components/AppToast.vue'
import AppModal from './components/AppModal.vue'
import WellView from './components/WellView.vue'
import HistoryView from './components/HistoryView.vue'

const upIconSrc = ref<string>('/up-icon.png')
const currentTab = ref<TabId>('well')
const modalItem = ref<ThrowRecord | null>(null)

const {
  pts, throwCount, throwHistory,
  phase, coinGo, rippleGo, dots, currentTalisman, todayStr,
  throwCoin, resetWell, markShared,
} = useWell()
const { toast, showToast } = useToast()

function onBack() {
  window.history.back()
}
</script>
