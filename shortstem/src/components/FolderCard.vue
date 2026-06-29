<template>
  <div
    class="cursor-pointer select-none group flex flex-col items-center"
    @click="$emit('click')"
  >
    <!--
      폴더 구조:
      [이모지 영역 - 폴더 위로 삐져나옴]
      [탭]
      [폴더 본체]
    -->
    <div class="w-full relative px-3" style="overflow: visible;">

      <!-- ── 이모지 뱃지 (아이템 있을 때, 폴더 중앙에 겹쳐서) ── -->
      <div
        v-if="itemCount > 0"
        class="absolute z-20 flex items-center justify-center"
        :style="{
          top: '18px',
          left: 0,
          right: 0,
          height: '110px',
        }"
      >
        <!-- 뱃지들을 중앙 기준으로 겹치게 배치 -->
        <div
          class="relative flex items-center justify-center"
          :style="{ width: badgeGroupWidth + 'px', height: '44px' }"
        >
          <div
            v-for="(emoji, i) in visibleEmojis"
            :key="i"
            class="absolute w-11 h-11 rounded-full bg-white flex items-center justify-center text-xl shadow-paper-md border-2"
            :style="{
              borderColor: tabColor,
              left: `${i * 22}px`,
              zIndex: visibleEmojis.length - i,
              transform: `rotate(${emojiRotations[i]}deg)`,
            }"
          >{{ emoji }}</div>
          <div
            v-if="itemCount > 3"
            class="absolute w-11 h-11 rounded-full bg-white flex items-center justify-center text-xs font-extrabold shadow-paper-md border-2"
            :style="{
              borderColor: tabColor,
              left: `${visibleEmojis.length * 22}px`,
              color: '#888',
            }"
          >+{{ itemCount - 3 }}</div>
        </div>
      </div>

      <!-- ── 폴더 탭 ── -->
      <div
        class="rounded-t-md ml-0"
        style="width: 42%; height: 18px;"
        :style="{ background: tabColor }"
      />

      <!-- ── 폴더 본체 ── -->
      <div
        class="w-full rounded-b-xl rounded-tr-xl shadow-paper transition-all duration-200 group-hover:-translate-y-1 group-active:scale-95 relative"
        :style="{ background: color, height: '110px' }"
      >
        <!-- 아이템 없을 때: 카테고리 이모지 흐리게 (뱃지와 동일 위치 = 중앙) -->
        <div v-if="itemCount === 0" class="absolute inset-0 flex items-center justify-center">
          <span class="text-4xl" style="opacity: 0.25;">{{ categoryEmoji }}</span>
        </div>

        <!-- 하단 텍스트 -->
        <div class="absolute bottom-0 left-0 right-0 pb-3 text-center">
          <div v-if="itemCount > 0" class="text-xs font-bold" style="color: rgba(0,0,0,0.38);">
            {{ itemCount }}개
          </div>
          <div v-else class="text-xs font-semibold" style="color: rgba(0,0,0,0.22);">
            비어있음
          </div>
        </div>
      </div>
    </div>

    <!-- 폴더 라벨 -->
    <div class="mt-2 text-center">
      <div class="text-sm font-bold text-gray-700">{{ label }}</div>
      <div v-if="estimatedTotal > 0" class="text-xs text-gray-400 mt-0.5">
        약 {{ estimatedTotal.toLocaleString() }}원
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  categoryEmoji: string
  color: string
  tabColor: string
  itemCount: number
  estimatedTotal: number
  itemEmojis: string[]
}>()

defineEmits<{ click: [] }>()

const visibleEmojis = computed(() => props.itemEmojis.slice(0, 3))
const emojiRotations = [-10, 0, 10]

// 뱃지 그룹 전체 너비: 첫 뱃지 44px + 나머지는 22px씩 겹침
const badgeGroupWidth = computed(() => {
  const count = Math.min(props.itemCount, 4)
  return 44 + (count - 1) * 22
})
</script>
