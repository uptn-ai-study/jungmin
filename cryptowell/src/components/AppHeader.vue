<template>
  <header class="app-header">
    <button class="header-back" @click="emit('back')">
      <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
        <path d="M9 1L1.5 8.5L9 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div class="header-title">투자 부적 뽑는 우물</div>
    <div class="header-pts">
      <img v-if="upIconSrc" :src="upIconSrc" class="up-icon" alt="UP" />
      <span v-else class="up-text">UP</span>
      {{ pts.toLocaleString() }}
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ pts: number; upIconSrc?: string }>()
const emit = defineEmits<{ back: [] }>()
</script>
