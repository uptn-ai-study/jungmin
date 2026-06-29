<template>
  <Transition name="fade">
    <div v-if="open" class="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end justify-center" @click.self="$emit('close')">
      <Transition name="slide-up">
        <div v-if="open" class="w-full max-w-[430px] bg-paper rounded-t-3xl px-5 pb-10 pt-3 shadow-paper-lg">
          <div class="w-10 h-1.5 rounded-full bg-gray-200 mx-auto mb-5" />
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-lg font-extrabold text-gray-800">💰 예산 설정</h3>
            <button class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500" @click="$emit('close')">✕</button>
          </div>
          <p class="text-xs text-gray-400 mb-5">카테고리별 예산을 입력하세요 (0원 = 미설정)</p>

          <div v-for="cat in FOLDER_CATEGORIES" :key="cat.key" class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div class="flex items-center gap-2">
              <span class="text-xl">{{ cat.emoji }}</span>
              <span class="text-sm font-bold text-gray-700">{{ cat.label }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <input
                type="number"
                :value="localBudgets[cat.key]"
                class="w-28 h-9 text-right px-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 outline-none focus:border-baby-pink bg-white"
                @input="localBudgets[cat.key] = +($event.target as HTMLInputElement).value"
                placeholder="0"
              />
              <span class="text-xs text-gray-400">원</span>
            </div>
          </div>

          <AppButton class="mt-5" @click="save">저장하기</AppButton>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import AppButton from './AppButton.vue'
import { FOLDER_CATEGORIES } from '../data/mockData'
import type { Category } from '../types'

const props = defineProps<{
  open: boolean
  budgets: Record<Category, number>
}>()

const emit = defineEmits<{
  close: []
  save: [budgets: Record<Category, number>]
}>()

const localBudgets = reactive<Record<string, number>>({ ...props.budgets })

watch(() => props.budgets, (v) => {
  Object.assign(localBudgets, v)
}, { deep: true })

function save() {
  emit('save', { ...localBudgets } as Record<Category, number>)
  emit('close')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s cubic-bezier(.32,1,.55,1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }
</style>
