<template>
  <div class="relative">
    <!-- 입력창 -->
    <div class="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3">
      <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        placeholder="유튜브 링크를 붙여넣어 분석해 보세요"
        class="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-300 font-medium"
        @keydown.enter="submit"
      />
      <button
        v-if="inputValue"
        class="flex-shrink-0 text-gray-300"
        @click="inputValue = ''"
      >✕</button>
    </div>

    <!-- 분석하기 버튼 -->
    <AppButton
      class="mt-2"
      :disabled="!inputValue || loading"
      :loading="loading"
      @click="submit"
    >
      <template #loading>분석 중...</template>
      분석하기
    </AppButton>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppButton from './AppButton.vue'

const props = defineProps<{ loading?: boolean }>()
const emit = defineEmits<{ analyze: [url: string] }>()

const inputValue = ref('')
const inputRef = ref<HTMLInputElement>()

function submit() {
  const url = inputValue.value.trim()
  if (!url || props.loading) return
  emit('analyze', url)
}
</script>
