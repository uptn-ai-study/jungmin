<template>
  <button
    v-bind="$attrs"
    :disabled="disabled || loading"
    :class="[
      'py-3.5 rounded-2xl text-sm font-bold active:scale-95 transition-transform',
      block ? 'w-full' : '',
      computedVariant,
    ]"
  >
    <slot v-if="!loading" />
    <span v-else class="flex items-center justify-center gap-2">
      <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      <slot name="loading">처리 중...</slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  loading?: boolean
  block?: boolean
}>(), {
  variant: 'primary',
  block: true,
})

const computedVariant = computed(() => {
  if (props.disabled && !props.loading) return 'bg-gray-100 text-gray-300 cursor-default'
  if (props.variant === 'secondary') return 'bg-gray-100 text-gray-500'
  if (props.variant === 'danger') return 'bg-baby-pink-dark text-white'
  return 'bg-baby-pink-dark text-white'
})
</script>
