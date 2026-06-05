<template>
  <div ref="cardEl" class="talisman-card" :style="{ '--grade-color': gradeColor(talisman.grade) }">
    <div class="card-grade-bar"></div>
    <div class="card-inner-border"></div>
    <span class="card-corner tl">✦</span><span class="card-corner tr">✦</span>
    <span class="card-corner bl">✦</span><span class="card-corner br">✦</span>
    <div class="card-title">오늘의 투자 부적</div>
    <div class="card-symbol">{{ talisman.symbol }}</div>
    <div class="card-grade">{{ talisman.grade }}</div>
    <div class="card-text-group">
      <div class="card-main">{{ talisman.main }}</div>
      <div class="card-sub">{{ talisman.sub }}</div>
    </div>
    <div class="card-brand">우물 도사의 말씀 · {{ dateStr }}</div>
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { Talisman } from '../types'
import { gradeColor } from '../utils/grade'

defineProps<{ talisman: Talisman; dateStr: string }>()

const cardEl = useTemplateRef<HTMLDivElement>('cardEl')
defineExpose({ cardEl })
</script>
