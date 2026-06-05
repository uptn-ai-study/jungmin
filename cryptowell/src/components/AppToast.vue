<template>
  <div v-if="toast.visible" class="toast" :class="{ out: toast.leaving }">{{ toast.msg }}</div>
</template>

<script setup lang="ts">
import type { ToastState } from '../types'

defineProps<{ toast: ToastState }>()
</script>
