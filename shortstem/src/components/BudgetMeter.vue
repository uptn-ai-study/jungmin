<template>
  <div class="bg-paper rounded-2xl p-5 shadow-paper">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-4">
      <span class="text-xs font-semibold text-gray-400 tracking-wide uppercase">이번 달 예산</span>
      <button class="text-xs font-medium text-gray-400 transition-colors" @click="$emit('editBudget')">수정</button>
    </div>

    <!-- 예산 없을 때 -->
    <div v-if="budget === 0" class="py-2">
      <p class="text-sm text-gray-400 mb-3">예산을 설정하면 지출 현황을 볼 수 있어요</p>
      <button
        class="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold"
        @click="$emit('editBudget')"
      >예산 설정하기</button>
    </div>

    <!-- 예산 있을 때 -->
    <template v-else>
      <!-- 금액 -->
      <div class="flex items-baseline justify-between mb-3">
        <div>
          <span class="text-2xl font-black text-gray-900">{{ currentTotal.toLocaleString() }}</span>
          <span class="text-sm font-medium text-gray-400 ml-1">원</span>
        </div>
        <div class="text-right">
          <div class="text-xs text-gray-400">예산 {{ budget.toLocaleString() }}원</div>
          <div v-if="!isOver" class="text-xs font-semibold text-gray-500 mt-0.5">{{ remaining.toLocaleString() }}원 남음</div>
          <div v-else class="text-xs font-semibold text-rose-400 mt-0.5">{{ Math.abs(remaining).toLocaleString() }}원 초과</div>
        </div>
      </div>

      <!-- 프로그레스 바 -->
      <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="isOver ? 'bg-rose-400' : pct >= 80 ? 'bg-amber-400' : 'bg-gray-800'"
          :style="{ width: Math.min(pct, 100) + '%' }"
        />
      </div>

      <!-- 상태 텍스트 -->
      <p v-if="isOver" class="mt-2 text-xs text-rose-400">예산을 초과했어요</p>
      <p v-else-if="pct >= 80" class="mt-2 text-xs text-amber-500">예산의 {{ pct }}%를 사용했어요</p>
      <p v-else class="mt-2 text-xs text-gray-400">{{ pct }}% 사용</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  budget: number
  currentTotal: number
}>()

defineEmits<{ editBudget: [] }>()

const remaining = computed(() => props.budget - props.currentTotal)
const isOver = computed(() => remaining.value < 0)
const pct = computed(() => props.budget > 0 ? Math.round((props.currentTotal / props.budget) * 100) : 0)
</script>
