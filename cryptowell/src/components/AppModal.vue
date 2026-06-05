<template>
  <div class="bs-overlay" @click.self="emit('close')">
    <div class="bs-sheet" :class="{ open: visible }">
      <div class="bs-handle"></div>

      <!-- 헤더 -->
      <div class="bs-header">
        <span class="bs-title">📜 부적 상세</span>
        <button class="bs-close" @click="emit('close')">✕</button>
      </div>

      <!-- 부적 카드 -->
      <TalismanCard :talisman="item.talisman" :date-str="item.date" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ThrowRecord } from '../types'
import TalismanCard from './TalismanCard.vue'

defineProps<{ item: ThrowRecord }>()
const emit = defineEmits<{ close: [] }>()

const visible = ref(false)
onMounted(() => requestAnimationFrame(() => { visible.value = true }))
</script>
