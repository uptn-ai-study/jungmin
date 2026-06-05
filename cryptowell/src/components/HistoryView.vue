<template>
  <div class="tab-view history-tab">

    <div class="section-header">
      <span class="section-title">📜 내 부적첩</span>
      <span class="section-count">총 {{ throwHistory.length }}장</span>
    </div>

    <div v-if="throwHistory.length === 0" class="history-empty">
      <span class="empty-icon">📜</span>
      <span class="empty-title">아직 부적이 없습니다</span>
      <span class="empty-desc">우물에 동전을 던져보거라</span>
    </div>

    <div v-else class="history-grid">
      <div
        v-for="(item, idx) in reversed"
        :key="idx"
        class="history-cell"
        :style="{ '--cell-grade-color': gradeColor(item.talisman.grade) }"
        @click="emit('openModal', item)"
      >
        <div class="h-symbol">{{ item.talisman.symbol }}</div>
        <div class="h-grade">{{ item.talisman.grade }}</div>
        <div class="h-date">{{ item.date }}</div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ThrowRecord } from '../types'
import { gradeColor } from '../utils/grade'

const props = defineProps<{ throwHistory: ThrowRecord[] }>()
const emit = defineEmits<{ openModal: [item: ThrowRecord] }>()

const reversed = computed(() => [...props.throwHistory].reverse())
</script>
