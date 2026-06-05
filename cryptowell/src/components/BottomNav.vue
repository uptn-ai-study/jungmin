<template>
  <nav class="bottom-nav">
    <button class="nav-item" :class="{ active: currentTab === 'well' }" @click="emit('update:currentTab', 'well')">
      <span class="nav-icon">🔮</span>우물
    </button>
    <button class="nav-item" :class="{ active: currentTab === 'history' }" @click="emit('update:currentTab', 'history')">
      <span class="nav-icon">📜</span>부적첩
    </button>
  </nav>
</template>

<script setup lang="ts">
import type { TabId } from '../types'

defineProps<{ currentTab: TabId }>()
const emit = defineEmits<{ 'update:currentTab': [tab: TabId] }>()
</script>
