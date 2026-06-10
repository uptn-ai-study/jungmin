<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { fetchRankings, saveScore, type RankingRow } from './lib/supabase'

type GameState = 'start' | 'playing' | 'paused' | 'ended'

interface FallingItem {
  id: number
  x: number
  y: number
  speed: number
  type: 'up' | 'eth' | 'avax' | 'sol' | 'usdt' | 'btc'
  caught: boolean
  wobble: number
  wobbleSpeed: number
}

interface ScoreFlash {
  id: number
  x: number
  y: number
  text: string
  kind: 'good' | 'bad'
  ts: number
}

const GAME_DURATION = 60
const ITEM_SIZE = 54
const PIG_HEIGHT = 108
const GRASS_HEIGHT = 96
const PIG_BASE_W = 92

const LEVELS = [
  { min: 0,   max: 49,       label: 'Lv.1', pigScale: 1.00 },
  { min: 50,  max: 99,       label: 'Lv.2', pigScale: 1.18 },
  { min: 100, max: 149,      label: 'Lv.3', pigScale: 1.36 },
  { min: 150, max: 199,      label: 'Lv.4', pigScale: 1.54 },
  { min: 200, max: Infinity, label: 'Lv.5', pigScale: 1.72 },
]

/** 레벨별 돼지 장식
 *  🐷 이모지 구조 기준:
 *    - 정수리(귀 사이):  top ≈ 10~18%
 *    - 오른쪽 귀 위:     top ≈ 2~8%,  left ≈ 72~76%
 *    - 정수리 바로 위:   top ≈ -8~0%
 *  top/left : pig-clay-container 기준 %, transform:translateX(-50%) 적용됨
 *  sizeRatio: pigFontSize 대비 장식 크기 비율
 *  anim     : CSS 애니메이션 클래스
 */
const DECO_CONFIG = [
  null,                                                                               // Lv1 : 기본 돼지
  { emoji: '🎀', top: '-2%', left: '50%', sizeRatio: 0.44, anim: 'deco-bow'   }, // Lv2 : 리본
  { emoji: '⭐', top: '-2%', left: '50%', sizeRatio: 0.44, anim: 'deco-star'  }, // Lv3 : 별
  { emoji: '💎', top: '-2%', left: '50%', sizeRatio: 0.42, anim: 'deco-gem'   }, // Lv4 : 다이아
  { emoji: '👑', top: '-2%', left: '50%', sizeRatio: 0.54, anim: 'deco-crown' }, // Lv5 : 왕관
] as const

/* 이미지 있는 토큰 → img 사용 / 없는 것 → 텍스트 뱃지 */
const TOKEN_META: Record<string, {
  label: string
  img: string | null
  bg: string
  border: string
  glow: string
  icon: string
}> = {
  eth:  { label: 'ETH',  img: '/assets/ethereum.png', bg: 'linear-gradient(145deg,#8a9fd4,#627EEA)', border: '#A0B4F0', glow: 'rgba(98,126,234,0.55)', icon: 'Ξ'   },
  avax: { label: 'AVAX', img: '/assets/avax.png',     bg: 'linear-gradient(145deg,#f87171,#E84142)', border: '#FCA5A5', glow: 'rgba(232,65,66,0.55)',  icon: '△'   },
  sol:  { label: 'SOL',  img: '/assets/solana.png',   bg: 'linear-gradient(145deg,#a78bfa,#9945FF)', border: '#C4B5FD', glow: 'rgba(153,69,255,0.55)', icon: '◎'   },
  usdt: { label: 'USDT', img: '/assets/Tether.png',   bg: 'linear-gradient(145deg,#6ee7b7,#0d9488)', border: '#99F6E4', glow: 'rgba(13,148,136,0.55)',  icon: '₮'   },
  btc:  { label: 'BTC',  img: null,                   bg: 'linear-gradient(145deg,#fb923c,#F7931A)', border: '#FCA883', glow: 'rgba(247,147,26,0.55)',  icon: '₿'   },
}

const BAD_TYPES = ['eth', 'avax', 'sol', 'usdt', 'btc'] as const

// ── state ──
const gameState = ref<GameState>('start')
const score = ref(0)
const bestScore = ref(parseInt(localStorage.getItem('piggyCatcherBest') ?? '0'))
const timeLeft = ref(GAME_DURATION)
const pigX = ref(0)
const items = ref<FallingItem[]>([])
const flashes = ref<ScoreFlash[]>([])

// ── 닉네임 & 랭킹 ──
const nickname = ref(localStorage.getItem('piggyCatcherNickname') ?? '')
const nicknameError = ref('')
const rankings = ref<RankingRow[]>([])
const rankingLoading = ref(false)
const isSavingScore = ref(false)
const saveError = ref('')
const showNicknamePopup = ref(false)

watch(nickname, val => {
  if (val.trim()) {
    nicknameError.value = ''
    localStorage.setItem('piggyCatcherNickname', val.trim())
  }
})

async function loadRankings() {
  rankingLoading.value = true
  rankings.value = await fetchRankings()
  rankingLoading.value = false
}

// 내 닉네임의 랭킹 순위
const myRank = computed(() => {
  if (!nickname.value.trim()) return null
  const idx = rankings.value.findIndex(r => r.nickname === nickname.value.trim())
  return idx >= 0 ? idx + 1 : null
})

const gameAreaRef = ref<HTMLDivElement | null>(null)
const nicknameInputRef = ref<HTMLInputElement | null>(null)

let gameW = 390
let gameH = 600
let rafId = 0
let timerHandle = 0
let spawnHandle = 0
let nextId = 0
let lastTs = 0

// ── derived ──
const safeScore = computed(() => Math.max(0, score.value))

const currentLevel = computed(() =>
  LEVELS.find(l => safeScore.value >= l.min && safeScore.value <= l.max) ?? LEVELS[0]
)

const levelIndex  = computed(() => LEVELS.indexOf(currentLevel.value))
const pigWidth    = computed(() => Math.round(PIG_BASE_W * currentLevel.value.pigScale))
const pigFontSize = computed(() => Math.round(pigWidth.value * 0.84))
const pigDeco     = computed(() => DECO_CONFIG[levelIndex.value] ?? null)

const levelProgress = computed(() => {
  const lvl = currentLevel.value
  if (lvl.max === Infinity) return 100
  return Math.min(100, ((safeScore.value - lvl.min) / (lvl.max - lvl.min + 1)) * 100)
})

const levelProgressNum = computed(() => {
  const lvl = currentLevel.value
  if (lvl.max === Infinity) return { cur: safeScore.value - lvl.min, max: '∞' }
  return { cur: safeScore.value - lvl.min, max: lvl.max - lvl.min + 1 }
})

const timerRing = computed(() => {
  const r = 20, circ = 2 * Math.PI * r
  return { circ, offset: circ * (1 - timeLeft.value / GAME_DURATION) }
})

const timerColor = computed(() => {
  if (timeLeft.value > 30) return '#34D399'
  if (timeLeft.value > 10) return '#FBBF24'
  return '#F87171'
})

// ── helpers ──
function measure() {
  if (gameAreaRef.value) {
    gameW = gameAreaRef.value.clientWidth
    gameH = gameAreaRef.value.clientHeight
  }
}

function clampPig(x: number) {
  return Math.max(0, Math.min(gameW - pigWidth.value, x))
}

// ── game lifecycle ──
async function openNicknamePopup() {
  nicknameError.value = ''
  showNicknamePopup.value = true
  await nextTick()
  nicknameInputRef.value?.focus()
}

async function startGame() {
  if (!nickname.value.trim()) {
    nicknameError.value = '닉네임을 입력해 주세요!'
    return
  }
  showNicknamePopup.value = false
  nicknameError.value = ''
  score.value = 0
  timeLeft.value = GAME_DURATION
  items.value = []
  flashes.value = []
  nextId = 0
  gameState.value = 'playing'

  await nextTick()
  measure()

  pigX.value = clampPig((gameW - pigWidth.value) / 2)
  lastTs = performance.now()

  timerHandle = window.setInterval(() => {
    if (gameState.value !== 'playing') return
    timeLeft.value--
    if (timeLeft.value <= 0) endGame()
  }, 1000)

  scheduleSpawn()
  rafId = requestAnimationFrame(loop)
}

function scheduleSpawn() {
  if (gameState.value !== 'playing') return
  spawnItem()
  const delay = 480 + Math.random() * 820
  spawnHandle = window.setTimeout(scheduleSpawn, delay)
}

function spawnItem() {
  const isUp = Math.random() < 0.44
  const type = isUp ? 'up' : BAD_TYPES[Math.floor(Math.random() * BAD_TYPES.length)]
  const x = ITEM_SIZE / 2 + Math.random() * (gameW - ITEM_SIZE * 1.5)
  const speed = 1.6 + Math.random() * 2.2 + levelIndex.value * 0.3
  items.value.push({
    id: nextId++,
    x, y: -(ITEM_SIZE + Math.random() * 60),
    speed, type, caught: false,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: (Math.random() - 0.5) * 0.08,
  })
}

function loop(ts: number) {
  if (gameState.value !== 'playing') return
  const delta = Math.min((ts - lastTs) / 16.667, 3)
  lastTs = ts

  const pigTop = gameH - GRASS_HEIGHT - PIG_HEIGHT
  const now = Date.now()

  items.value = items.value.filter(item => {
    item.y += item.speed * delta
    item.wobble += item.wobbleSpeed * delta

    if (!item.caught) {
      const pL = pigX.value + 6
      const pR = pigX.value + pigWidth.value - 6
      const pT = pigTop + 10
      const pB = pigTop + PIG_HEIGHT - 6

      if (
        item.x + ITEM_SIZE > pL &&
        item.x < pR &&
        item.y + ITEM_SIZE > pT &&
        item.y < pB
      ) {
        item.caught = true
        if (item.type === 'up') {
          score.value += 1
          pushFlash(item.x + ITEM_SIZE / 2, pigTop - 8, '+1', 'good')
        } else {
          score.value = Math.max(0, score.value - 10)
          pushFlash(item.x + ITEM_SIZE / 2, pigTop - 8, '-10', 'bad')
        }
        return false
      }
    }
    return item.y < gameH
  })

  flashes.value = flashes.value.filter(f => now - f.ts < 900)
  rafId = requestAnimationFrame(loop)
}

function pushFlash(x: number, y: number, text: string, kind: 'good' | 'bad') {
  flashes.value.push({ id: nextId++, x, y, text, kind, ts: Date.now() })
  if (flashes.value.length > 10) flashes.value.shift()
}

function pauseGame() {
  if (gameState.value !== 'playing') return
  gameState.value = 'paused'
  cancelAnimationFrame(rafId)
  clearInterval(timerHandle)
  clearTimeout(spawnHandle)
}

function resumeGame() {
  if (gameState.value !== 'paused') return
  gameState.value = 'playing'
  measure()
  lastTs = performance.now()
  timerHandle = window.setInterval(() => {
    if (gameState.value !== 'playing') return
    timeLeft.value--
    if (timeLeft.value <= 0) endGame()
  }, 1000)
  scheduleSpawn()
  rafId = requestAnimationFrame(loop)
}

async function endGame() {
  gameState.value = 'ended'
  cancelAnimationFrame(rafId)
  clearInterval(timerHandle)
  clearTimeout(spawnHandle)
  if (score.value > bestScore.value) {
    bestScore.value = score.value
    localStorage.setItem('piggyCatcherBest', String(score.value))
  }
  // Supabase 점수 저장 후 랭킹 갱신
  isSavingScore.value = true
  saveError.value = ''
  const err = await saveScore(nickname.value.trim(), score.value)
  if (err) saveError.value = err
  await loadRankings()
  isSavingScore.value = false
}

function cleanup() {
  cancelAnimationFrame(rafId)
  clearInterval(timerHandle)
  clearTimeout(spawnHandle)
}

watch(pigWidth, () => { pigX.value = clampPig(pigX.value) })

// ── drag ──
let isDragging = false
let pointerOffsetX = 0

function onAreaPointerDown(e: PointerEvent) {
  if (gameState.value !== 'playing') return
  e.preventDefault()
  isDragging = true
  const rect = gameAreaRef.value!.getBoundingClientRect()
  const relX = e.clientX - rect.left
  pointerOffsetX = relX - (pigX.value + pigWidth.value / 2)
  if (Math.abs(pointerOffsetX) > pigWidth.value * 0.6) pointerOffsetX = 0
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
}

function onAreaPointerMove(e: PointerEvent) {
  if (!isDragging || gameState.value !== 'playing') return
  e.preventDefault()
  const rect = gameAreaRef.value!.getBoundingClientRect()
  const relX = e.clientX - rect.left
  pigX.value = clampPig(relX - pigWidth.value / 2 - pointerOffsetX)
}

function onAreaPointerUp(e: PointerEvent) {
  if (!isDragging) return
  isDragging = false
  ;(e.currentTarget as Element).releasePointerCapture(e.pointerId)
}

onMounted(() => {
  measure()
  pigX.value = clampPig((gameW - PIG_BASE_W) / 2)
  loadRankings()
})
onUnmounted(cleanup)
</script>

<template>
  <div class="shell">

    <!-- ══════════ START SCREEN ══════════ -->
    <transition name="fade">
      <div v-if="gameState === 'start'" class="screen start-screen">

        <!-- clay sky -->
        <div class="clay-sky">
          <!-- sun -->
          <div class="clay-sun"/>
          <!-- clouds -->
          <div class="clay-cloud cc1"/>
          <div class="clay-cloud cc2"/>
          <div class="clay-cloud cc3"/>
          <!-- light beams -->
          <div class="beam b1"/><div class="beam b2"/><div class="beam b3"/>
        </div>

        <!-- clay ground -->
        <div class="clay-ground-start">
          <div class="clay-hill h1"/>
          <div class="clay-hill h2"/>
        </div>

        <div class="start-content">
          <!-- pig -->
          <div class="start-pig-wrap">
            <div class="clay-pig-anim">🐷</div>
            <div class="start-pig-shadow"/>
          </div>

          <h1 class="start-title">돼지 키우기</h1>
          <p class="start-sub">UP 포인트를 먹어서 저금통을 키워요!</p>

          <!-- rules -->
          <div class="rule-row">
            <div class="rule-item good-item">
              <div class="rule-icon-area">
                <div class="rule-coin-wrap">
                  <img src="/assets/up.png" class="rule-coin-img" alt="UP"/>
                </div>
              </div>
              <div class="rule-text">
                <span class="rule-name">UP 포인트 먹으면</span>
                <span class="rule-score green-txt">+1점!</span>
              </div>
            </div>
            <div class="rule-item bad-item">
              <div class="rule-icon-area">
                <div class="rule-coins-row">
                  <img src="/assets/ethereum.png" class="mini-coin-img" alt="ETH"/>
                  <img src="/assets/avax.png"     class="mini-coin-img" alt="AVAX"/>
                  <img src="/assets/solana.png"   class="mini-coin-img" alt="SOL"/>
                  <img src="/assets/Tether.png"   class="mini-coin-img" alt="USDT"/>
                </div>
              </div>
              <div class="rule-text">
                <span class="rule-name">다른 토큰 충돌</span>
                <span class="rule-score red-txt">-10점!</span>
              </div>
            </div>
          </div>

          <!-- level preview -->
          <div class="lv-section">
            <div class="lv-title">성장 단계</div>
            <div class="lv-row">
              <div v-for="(lv, i) in LEVELS" :key="i" class="lv-item">
                <div class="lv-pig-wrap">
                  <div class="lv-pig" :style="{ fontSize: (28 + i * 8) + 'px' }">🐷</div>
                  <div
                    v-if="DECO_CONFIG[i]"
                    class="lv-pig-deco"
                    :style="{
                      top: DECO_CONFIG[i]!.top,
                      left: DECO_CONFIG[i]!.left,
                      fontSize: Math.round((28 + i * 8) * DECO_CONFIG[i]!.sizeRatio) + 'px',
                    }"
                  >{{ DECO_CONFIG[i]!.emoji }}</div>
                </div>
                <span class="lv-label">{{ lv.label }}</span>
                <span class="lv-range">{{ lv.min }}~{{ lv.max === Infinity ? '∞' : lv.max }}</span>
              </div>
            </div>
          </div>

          <button class="btn-start" @click="openNicknamePopup">게임 시작</button>
          <div v-if="bestScore > 0" class="start-best">🏆 내 최고 점수 {{ bestScore }}점</div>

          <!-- 랭킹 -->
          <div class="ranking-section">
            <div class="ranking-header">
              <span class="ranking-title">🏆 랭킹</span>
              <button class="ranking-refresh" @click="loadRankings" :disabled="rankingLoading">
                {{ rankingLoading ? '···' : '↻' }}
              </button>
            </div>
            <div v-if="rankingLoading" class="ranking-empty">불러오는 중···</div>
            <div v-else-if="rankings.length === 0" class="ranking-empty">아직 기록이 없어요. 첫 번째 주인공이 되어보세요!</div>
            <ol v-else class="ranking-list">
              <li
                v-for="(row, i) in rankings"
                :key="row.nickname"
                class="ranking-item"
                :class="{
                  'rank-me': row.nickname === nickname.trim(),
                  'rank-1': i === 0,
                  'rank-2': i === 1,
                  'rank-3': i === 2,
                }"
              >
                <span class="rank-num">{{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1 }}</span>
                <span class="rank-name">{{ row.nickname }}</span>
                <span class="rank-score">{{ row.score }}<span class="rank-unit">점</span></span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══════════ GAME SCREEN ══════════ -->
    <template v-if="gameState === 'playing' || gameState === 'paused'">

      <!-- ── HUD ── -->
      <div class="hud">
        <div class="hud-block">
          <div class="hud-row">
            <span class="hud-tiny">점수</span>
            <span class="hud-score">{{ safeScore }}</span>
          </div>
          <div class="hud-divider"/>
          <div class="hud-row">
            <span class="hud-tiny">🏆 최고</span>
            <span class="hud-best">{{ bestScore }}</span>
          </div>
        </div>

        <div class="hud-right">
          <svg class="timer-svg" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3.5"/>
            <circle
              cx="25" cy="25" r="20" fill="none"
              :stroke="timerColor" stroke-width="3.5" stroke-linecap="round"
              :stroke-dasharray="timerRing.circ"
              :stroke-dashoffset="timerRing.offset"
              transform="rotate(-90 25 25)"
              style="transition:stroke-dashoffset 0.9s linear,stroke 0.4s"
            />
            <text x="25" y="30" text-anchor="middle" class="timer-txt" :fill="timerColor">
              {{ String(Math.floor(timeLeft/60)).padStart(2,'0') }}:{{ String(timeLeft%60).padStart(2,'0') }}
            </text>
          </svg>
          <button class="btn-pause" @click="gameState==='playing'?pauseGame():resumeGame()">
            {{ gameState === 'playing' ? '⏸' : '▶' }}
          </button>
        </div>
      </div>

      <!-- ── Game Area ── -->
      <div
        class="game-area"
        ref="gameAreaRef"
        @pointerdown="onAreaPointerDown"
        @pointermove="onAreaPointerMove"
        @pointerup="onAreaPointerUp"
        @pointercancel="onAreaPointerUp"
      >
        <!-- sky background -->
        <div class="sky-bg">
          <div class="cloud gc1">☁️</div>
          <div class="cloud gc2">⛅</div>
          <div class="cloud gc3">☁️</div>
          <div class="beam b1"/><div class="beam b2"/><div class="beam b3"/>
        </div>

        <!-- trees -->
        <div class="trees">
          <span class="tree">🌳</span>
          <span class="tree sm">🌲</span>
          <span class="tree">🌳</span>
          <span class="tree sm">🌲</span>
        </div>

        <!-- falling items -->
        <div
          v-for="item in items"
          :key="item.id"
          class="item-wrap"
          :style="{ left: item.x+'px', top: item.y+'px', width: ITEM_SIZE+'px', height: ITEM_SIZE+'px' }"
        >
          <!-- UP token -->
          <template v-if="item.type === 'up'">
            <div class="up-trail"/>
            <div class="coin-circle up-coin">
              <img src="/assets/up.png" class="coin-img" alt="UP"/>
            </div>
            <div class="sparkle s1">✦</div>
            <div class="sparkle s2">✦</div>
          </template>

          <!-- bad token -->
          <template v-else>
            <div
              class="coin-circle bad-coin"
              :style="{
                background: TOKEN_META[item.type].bg,
                borderColor: TOKEN_META[item.type].border,
                boxShadow: `0 4px 16px ${TOKEN_META[item.type].glow}, inset 0 1.5px 0 rgba(255,255,255,0.28)`
              }"
            >
              <img
                v-if="TOKEN_META[item.type].img"
                :src="TOKEN_META[item.type].img!"
                class="coin-img"
                :alt="TOKEN_META[item.type].label"
              />
              <span v-else class="coin-icon-text">{{ TOKEN_META[item.type].icon }}</span>
            </div>
          </template>
        </div>

        <!-- score flashes -->
        <div
          v-for="f in flashes"
          :key="f.id"
          class="flash"
          :class="f.kind"
          :style="{ left: f.x+'px', top: f.y+'px' }"
        >{{ f.text }}</div>

        <!-- clay pig -->
        <div
          class="pig-wrap"
          :style="{
            left: pigX+'px',
            width: pigWidth+'px',
            bottom: GRASS_HEIGHT+'px',
            height: PIG_HEIGHT+'px',
          }"
        >
          <div class="pig-clay-container">
            <div class="pig-clay" :style="{ fontSize: pigFontSize+'px' }">🐷</div>
            <!-- 레벨 장식 -->
            <div
              v-if="pigDeco"
              class="pig-deco"
              :class="pigDeco.anim"
              :style="{
                top: pigDeco.top,
                left: pigDeco.left,
                fontSize: Math.round(pigFontSize * pigDeco.sizeRatio) + 'px',
              }"
            >{{ pigDeco.emoji }}</div>
          </div>
          <div class="pig-shadow" :style="{ width: pigWidth*0.72+'px' }"/>
        </div>

        <!-- move hint -->
        <div v-if="gameState==='playing'" class="move-hint">
          <span>◀</span>
          <span class="dash-line"/>
          <span>▶</span>
          <span>👆</span>
        </div>

        <!-- grass -->
        <div class="grass-layer"/>

        <!-- pause overlay -->
        <transition name="fade">
          <div v-if="gameState==='paused'" class="pause-overlay">
            <div class="pause-card">
              <div class="pause-emoji">⏸</div>
              <div class="pause-label">일시정지</div>
              <div class="pause-score">현재 점수 <strong>{{ safeScore }}</strong>점</div>
              <div class="pause-btn-row">
                <button class="btn-resume" @click="resumeGame">계속하기</button>
                <button class="btn-quit" @click="endGame">그만하기</button>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- ── Progress bar ── -->
      <div class="progress-area">
        <div class="prog-left">
          <span class="prog-label">다음 성장까지</span>
          <div class="prog-track">
            <div class="prog-fill" :style="{ width: levelProgress+'%' }"/>
          </div>
          <span class="prog-num">{{ levelProgressNum.cur }} / {{ levelProgressNum.max }}</span>
        </div>
        <div class="prog-right">
          <span class="prog-pig">🐷</span>
          <span class="prog-lv">{{ currentLevel.label }}</span>
        </div>
      </div>

    </template>

    <!-- ══════════ END SCREEN ══════════ -->
    <transition name="slide-up">
      <div v-if="gameState==='ended'" class="screen end-screen">
        <div class="sky-bg end-sky"/>
        <div class="end-grass"/>

        <div class="end-content">
          <div class="end-pig-wrap">
            <div class="pig-clay end-pig" :style="{ fontSize: pigFontSize+'px' }">🐷</div>
            <div
              v-if="pigDeco"
              class="end-pig-deco"
              :class="pigDeco.anim"
              :style="{
                top: pigDeco.top,
                left: pigDeco.left,
                fontSize: Math.round(pigFontSize * pigDeco.sizeRatio) + 'px',
              }"
            >{{ pigDeco.emoji }}</div>
          </div>
          <div v-if="safeScore > 0 && safeScore >= bestScore" class="new-best">🎉 신기록!</div>

          <div class="end-score-box">
            <div class="end-score-lbl">최종 점수</div>
            <div class="end-score-num">{{ safeScore }}</div>
            <div class="end-lv-badge">{{ currentLevel.label }} 달성</div>
          </div>

          <div class="end-best-row">
            <span>🏆 최고 점수</span>
            <span class="end-best-val">{{ bestScore }}</span>
          </div>

          <div class="end-growth">
            <div class="end-growth-title">돼지 성장 기록</div>
            <div class="end-growth-row">
              <div v-for="(lv,i) in LEVELS" :key="i" class="end-lv-step" :class="{ reached: i<=levelIndex }">
                <div class="end-lv-pig-wrap">
                  <div :style="{ fontSize: (22+i*7)+'px', lineHeight:'1' }">🐷</div>
                  <div
                    v-if="DECO_CONFIG[i]"
                    class="end-lv-pig-deco"
                    :style="{
                      top: DECO_CONFIG[i]!.top,
                      left: DECO_CONFIG[i]!.left,
                      fontSize: Math.round((22+i*7) * DECO_CONFIG[i]!.sizeRatio) + 'px',
                    }"
                  >{{ DECO_CONFIG[i]!.emoji }}</div>
                </div>
                <span class="end-lv-label">{{ lv.label }}</span>
              </div>
            </div>
          </div>

          <!-- 랭킹 -->
          <div class="ranking-section ranking-end">
            <div class="ranking-header">
              <span class="ranking-title">🏆 랭킹</span>
            </div>
            <div v-if="saveError" class="ranking-error">⚠️ {{ saveError }}</div>
            <div v-if="isSavingScore" class="ranking-empty">점수 저장 중···</div>
            <div v-else-if="rankingLoading" class="ranking-empty">불러오는 중···</div>
            <div v-else-if="rankings.length === 0" class="ranking-empty">기록 없음</div>
            <template v-else>
              <div v-if="myRank" class="my-rank-badge">내 순위: {{ myRank }}위</div>
              <ol class="ranking-list">
                <li
                  v-for="(row, i) in rankings"
                  :key="row.nickname"
                  class="ranking-item"
                  :class="{
                    'rank-me': row.nickname === nickname.trim(),
                    'rank-1': i === 0,
                    'rank-2': i === 1,
                    'rank-3': i === 2,
                  }"
                >
                  <span class="rank-num">{{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1 }}</span>
                  <span class="rank-name">{{ row.nickname }}</span>
                  <span class="rank-score">{{ row.score }}<span class="rank-unit">점</span></span>
                </li>
              </ol>
            </template>
          </div>

          <button class="btn-start" @click="startGame">다시하기</button>
          <button class="btn-ghost" @click="gameState='start'">홈으로</button>
        </div>
      </div>
    </transition>

    <!-- ══════════ NICKNAME POPUP ══════════ -->
    <transition name="fade">
      <div v-if="showNicknamePopup" class="popup-overlay" @click.self="showNicknamePopup=false">
        <div class="popup-card">
          <div class="popup-title">닉네임 입력</div>
          <div class="popup-desc">랭킹에 표시될 이름을 입력해 주세요</div>
          <input
            v-model="nickname"
            class="popup-input"
            :class="{ error: nicknameError }"
            type="text"
            placeholder="최대 10자"
            maxlength="10"
            @keyup.enter="startGame"
            ref="nicknameInputRef"
          />
          <span v-if="nicknameError" class="popup-error">{{ nicknameError }}</span>
          <div class="popup-btn-row">
            <button class="popup-btn-cancel" @click="showNicknamePopup=false">취소</button>
            <button class="popup-btn-confirm" @click="startGame">시작하기</button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
/* ─── shell ─── */
.shell {
  width: 100%; height: 100dvh;
  max-width: 430px; margin: 0 auto;
  display: flex; flex-direction: column;
  position: relative; overflow: hidden;
  background: #1a1a2e;
  user-select: none; -webkit-user-select: none;
  touch-action: none;
  font-family: 'SUIT Variable', 'SUIT', -apple-system, sans-serif;
}
.app-shell button, .app-shell input {
  font-family: 'SUIT Variable', 'SUIT', -apple-system, sans-serif;
}

/* ════════════ CLAY COMPONENTS ════════════ */

/* Sky */
.clay-sky, .clay-sky-game {
  position: absolute; inset: 0;
  background: linear-gradient(180deg,
    #42B8E8 0%, #71CFF5 25%, #A6E3FB 55%,
    #C3EEF8 75%, #D5F5C8 90%, #B8E68A 100%
  );
  overflow: hidden;
}
.end-sky { position: absolute; inset: 0; }

/* Sun */
.clay-sun {
  position: absolute;
  width: 64px; height: 64px;
  top: 5%; right: 14%;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 38%, #FDE68A, #FBBF24);
  box-shadow:
    0 0 0 10px rgba(251,191,36,0.18),
    0 0 0 22px rgba(251,191,36,0.09),
    0 6px 18px rgba(251,191,36,0.4);
  animation: sunPulse 4s ease-in-out infinite;
}
.game-sun { top: 4%; right: 12%; width: 52px; height: 52px; }
@keyframes sunPulse {
  0%,100% { box-shadow: 0 0 0 10px rgba(251,191,36,0.18), 0 0 0 22px rgba(251,191,36,0.09); }
  50%      { box-shadow: 0 0 0 14px rgba(251,191,36,0.22), 0 0 0 30px rgba(251,191,36,0.11); }
}

/* Clouds — clay blob style */
.clay-cloud {
  position: absolute;
  pointer-events: none;
  background: #fff;
  border-radius: 999px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.08));
}
.clay-cloud::before, .clay-cloud::after {
  content: ''; position: absolute;
  background: inherit; border-radius: inherit;
}

/* start screen clouds */
.cc1 { width:100px; height:38px; top:10%; left:6%;
  animation: cloudDrift 18s ease-in-out infinite; }
.cc1::before { width:52px; height:52px; top:-22px; left:16px; }
.cc1::after  { width:38px; height:38px; top:-14px; left:52px; }

.cc2 { width:76px; height:30px; top:22%; right:8%;
  animation: cloudDrift 23s ease-in-out infinite reverse; }
.cc2::before { width:40px; height:40px; top:-16px; left:12px; }
.cc2::after  { width:30px; height:30px; top:-10px; left:42px; }

.cc3 { width:60px; height:24px; top:8%; left:52%;
  animation: cloudDrift 20s ease-in-out infinite 4s; }
.cc3::before { width:30px; height:30px; top:-12px; left:10px; }

/* game area clouds */
.gc1 { width:90px; height:34px; top:7%; left:4%;
  animation: cloudDrift 18s ease-in-out infinite; }
.gc1::before { width:46px; height:46px; top:-20px; left:14px; }
.gc1::after  { width:34px; height:34px; top:-12px; left:48px; }

.gc2 { width:68px; height:26px; top:18%; right:8%;
  animation: cloudDrift 24s ease-in-out infinite reverse; }
.gc2::before { width:36px; height:36px; top:-14px; left:10px; }
.gc2::after  { width:26px; height:26px; top:-8px; left:38px; }

.gc3 { width:52px; height:20px; top:6%; left:54%;
  animation: cloudDrift 20s ease-in-out infinite 5s; }
.gc3::before { width:26px; height:26px; top:-10px; left:8px; }

@keyframes cloudDrift {
  0%,100% { transform: translateX(0); }
  50%      { transform: translateX(14px); }
}

/* Beams */
.beam { position: absolute; top:0; bottom:0; transform:skewX(-10deg); pointer-events:none; }
.b1 { left:12%; width:32px; background:linear-gradient(180deg,transparent,rgba(255,255,255,0.13),transparent); animation:beamFade 7s ease-in-out infinite; }
.b2 { left:47%; width:22px; background:linear-gradient(180deg,transparent,rgba(255,255,255,0.09),transparent); animation:beamFade 9s ease-in-out infinite 2.5s; }
.b3 { left:74%; width:16px; background:linear-gradient(180deg,transparent,rgba(255,255,255,0.07),transparent); animation:beamFade 6s ease-in-out infinite 5s; }
@keyframes beamFade { 0%,100%{opacity:0} 35%,65%{opacity:1} }

/* Ground / Hills */
.clay-ground-start {
  position: absolute; bottom:0; left:0; right:0;
  height: 120px;
  background: linear-gradient(180deg, #7ED035 0%, #5CA020 100%);
  border-top: 5px solid #96DE45;
  overflow: hidden;
}
.end-ground { position: absolute; bottom:0; left:0; right:0; }

.clay-hill {
  position: absolute;
  border-radius: 50% 50% 0 0;
  bottom: 0;
}
.h1 { width:180px; height:80px; left:-20px; background:#6CC72E; box-shadow: inset 0 8px 0 rgba(255,255,255,0.15); }
.h2 { width:160px; height:70px; right:-10px; background:#72CC30; box-shadow: inset 0 8px 0 rgba(255,255,255,0.12); }

/* Game hills */
.clay-hills-game {
  position: absolute; bottom: 90px; left:0; right:0;
  height: 80px; pointer-events:none; overflow:hidden;
}
.gh1 { width:200px; height:90px; left:-30px;  background:#7ED035; box-shadow:inset 0 8px 0 rgba(255,255,255,0.12); }
.gh2 { width:180px; height:80px; right:-20px; background:#78CA30; box-shadow:inset 0 8px 0 rgba(255,255,255,0.10); }
.gh3 { width:140px; height:70px; left:100px;  background:#82D436; box-shadow:inset 0 8px 0 rgba(255,255,255,0.10); }

/* Clay grass */
.clay-grass {
  position: absolute; bottom:0; left:0; right:0;
  height: 96px;
  background: linear-gradient(180deg, #7ED035 0%, #5CA020 100%);
  border-top: 5px solid #96DE45;
  z-index: 2;
}
.clay-grass::before {
  content:'';
  position:absolute; top:-10px; left:0; right:0;
  height:16px;
  background: repeating-linear-gradient(
    90deg,
    #96DE45 0, #96DE45 14px,
    #7ED035 14px, #7ED035 30px
  );
  border-radius: 8px 8px 0 0;
}

/* Trees */
.trees {
  position:absolute; bottom:92px; left:0; right:0;
  display:flex; justify-content:space-between;
  padding:0 6px; pointer-events:none; z-index:1;
}
.tree { font-size:40px; opacity:0.82;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.12)); }
.tree.sm { font-size:32px; }

/* ════════════ PIG ════════════ */
.pig-wrap {
  position: absolute;
  display: flex; flex-direction:column; align-items:center;
  z-index: 5;
  transition: width 0.35s cubic-bezier(0.34,1.56,0.64,1);
  will-change: left;
}

/* clay pig style */
.pig-clay {
  line-height: 1;
  pointer-events: none;
  filter:
    drop-shadow(0 6px 12px rgba(0,0,0,0.22))
    drop-shadow(0 2px 0px rgba(0,0,0,0.12))
    saturate(1.25)
    brightness(1.05);
  transition: font-size 0.35s cubic-bezier(0.34,1.56,0.64,1);
  animation: pigIdle 2.2s ease-in-out infinite;
}
@keyframes pigIdle {
  0%,100% { transform: scaleX(1) scaleY(1); }
  50%      { transform: scaleX(1.03) scaleY(0.97); }
}

.pig-shadow {
  height: 10px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.20) 0%, transparent 70%);
  border-radius: 50%; margin-top: 3px; flex-shrink:0;
}

/* ── pig container (for deco overlay) ── */
.pig-clay-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 장식이 위로 삐져나와도 잘리지 않게 */
  padding-top: 18%;
  margin-top: -18%;
}

.pig-deco {
  position: absolute;
  line-height: 1;
  pointer-events: none;
  transform: translateX(-50%);
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
  z-index: 2;
}

/* 장식별 애니메이션 */
.deco-bow   { animation: decoWiggle 2.4s ease-in-out infinite; }
.deco-star  { animation: decoSpin   2.0s ease-in-out infinite; }
.deco-gem   { animation: decoFloat  1.8s ease-in-out infinite; }
.deco-crown { animation: decoPulse  2.2s ease-in-out infinite; }

@keyframes decoWiggle {
  0%,100% { transform: translateX(-50%) rotate(-8deg); }
  50%      { transform: translateX(-50%) rotate(8deg); }
}
@keyframes decoSpin {
  0%,100% { transform: translateX(-50%) scale(1)    rotate(-10deg); }
  50%      { transform: translateX(-50%) scale(1.15) rotate(10deg); }
}
@keyframes decoFloat {
  0%,100% { transform: translateX(-50%) translateY(0);    }
  50%      { transform: translateX(-50%) translateY(-3px); }
}
@keyframes decoPulse {
  0%,100% { transform: translateX(-50%) scale(1);    }
  50%      { transform: translateX(-50%) scale(1.12); }
}

/* lv preview pig in start screen */
.lv-pig-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-top: 18%;
  margin-top: -4px;
}
.lv-pig-deco {
  position: absolute;
  line-height: 1;
  transform: translateX(-50%);
  pointer-events: none;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.2));
}

/* end screen pig */
.end-pig-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-top: 18%;
  margin-top: -8px;
  margin-bottom: -4px;
}
.end-pig-deco {
  position: absolute;
  line-height: 1;
  transform: translateX(-50%);
  pointer-events: none;
  filter: drop-shadow(0 2px 5px rgba(0,0,0,0.25));
}
.end-pig { line-height: 1; margin-bottom: 0; }

/* end growth pig */
.end-lv-pig-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-top: 18%;
}
.end-lv-pig-deco {
  position: absolute;
  line-height: 1;
  transform: translateX(-50%);
  pointer-events: none;
}

/* Start pig */
.start-pig-wrap { display:flex; flex-direction:column; align-items:center; }
.clay-pig-anim {
  font-size: 88px; line-height:1;
  filter:
    drop-shadow(0 10px 20px rgba(0,0,0,0.2))
    saturate(1.3) brightness(1.05);
  animation: startPigBounce 1.8s ease-in-out infinite;
}
@keyframes startPigBounce {
  0%,100% { transform: translateY(0) rotate(-3deg) scale(1); }
  50%      { transform: translateY(-16px) rotate(3deg) scale(1.04); }
}
.start-pig-shadow {
  width:70px; height:12px; margin-top:4px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.18) 0%, transparent 70%);
  border-radius:50%;
  animation: shadowScale 1.8s ease-in-out infinite;
}
@keyframes shadowScale {
  0%,100% { transform:scaleX(1); opacity:0.7; }
  50%      { transform:scaleX(0.7); opacity:0.4; }
}

/* ════════════ COINS ════════════ */
.coin-circle {
  width: 100%; height: 100%;
  border-radius: 50%;
  display: flex; align-items:center; justify-content:center;
  border: 2.5px solid;
  overflow: hidden;
  position: relative;
}
.coin-circle::after {
  content:'';
  position:absolute; top:6%; left:16%;
  width:32%; height:22%;
  background: rgba(255,255,255,0.35);
  border-radius:50%;
  transform: rotate(-30deg);
}

.up-coin {
  background: radial-gradient(circle at 40% 35%, #DDD6FE, #6D28D9);
  border-color: rgba(221,214,254,0.75);
  box-shadow:
    0 0 18px rgba(109,40,217,0.65),
    0 4px 12px rgba(0,0,0,0.25),
    inset 0 1.5px 0 rgba(255,255,255,0.35);
  animation: upCoinFloat 0.7s ease-in-out infinite alternate;
}
@keyframes upCoinFloat {
  from { transform: scale(1); }
  to   { transform: scale(1.06); }
}

.bad-coin { border-width: 2.5px; }

.coin-img {
  width: 72%; height: 72%;
  object-fit: contain;
  position: relative; z-index:1;
  pointer-events: none;
}

.coin-icon-text {
  font-size: 18px; font-weight:900; color:#fff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.35);
  position:relative; z-index:1;
}

/* UP trail */
.up-trail {
  position:absolute; left:50%; top:-22px;
  transform:translateX(-50%);
  width:8px; height:32px;
  background: linear-gradient(180deg, transparent, rgba(139,92,246,0.7), rgba(167,139,250,0.9));
  border-radius:4px; filter:blur(3px);
  animation: trailPulse 0.4s ease-in-out infinite alternate;
}
@keyframes trailPulse { from{opacity:0.5} to{opacity:1} }

.sparkle {
  position:absolute; font-size:11px; color:#FCD34D;
  animation:sparkleSpin 1.2s linear infinite; pointer-events:none;
}
.s1 { top:-3px; right:1px; }
.s2 { bottom:0; left:-3px; animation-delay:0.6s; }
@keyframes sparkleSpin {
  0%   { transform:scale(0.5) rotate(0deg);   opacity:1; }
  50%  { transform:scale(1.2) rotate(180deg); opacity:0.7; }
  100% { transform:scale(0.5) rotate(360deg); opacity:1; }
}

.item-wrap { position:absolute; pointer-events:none; will-change:top; }

/* ════════════ SCORE FLASH ════════════ */
.flash {
  position:absolute; font-size:22px; font-weight:900;
  pointer-events:none; transform:translateX(-50%);
  animation:flashPop 0.9s ease-out forwards; z-index:20;
  text-shadow:0 2px 6px rgba(0,0,0,0.25); white-space:nowrap;
}
.flash.good { color:#34D399; }
.flash.bad  { color:#F87171; }
@keyframes flashPop {
  0%   { opacity:1; transform:translateX(-50%) translateY(0) scale(1.3); }
  25%  { transform:translateX(-50%) translateY(-18px) scale(1); }
  100% { opacity:0; transform:translateX(-50%) translateY(-50px) scale(0.8); }
}

/* ════════════ HUD ════════════ */
.hud {
  flex-shrink:0; height:72px;
  background: #1B2340;
  display:flex; align-items:center;
  padding:8px 14px; gap:8px; z-index:10;
  border-bottom:1px solid rgba(255,255,255,0.06);
}
.hud-block {
  display: flex; flex-direction: column; gap: 4px;
  background: #2A3454; border-radius: 12px;
  padding: 8px 12px; min-width: 100px;
}
.hud-row {
  display: flex; align-items: baseline;
  justify-content: space-between; gap: 8px;
}
.hud-tiny  { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.45); white-space: nowrap; }
.hud-score { font-size: 20px; font-weight: 900; color: #FBBF24; letter-spacing: -0.5px; line-height: 1; }
.hud-best  { font-size: 20px; font-weight: 900; color: rgba(255,255,255,0.75); letter-spacing: -0.5px; line-height: 1; }
.hud-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 1px 0; }

.hud-right {
  display: flex; align-items: center; gap: 8px;
  margin-left: auto;
}
.timer-svg  { width:52px; height:52px; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4)); flex-shrink:0; }
.timer-txt  { font-size:10px; font-weight:800; font-family:'SUIT Variable',sans-serif; }
.btn-pause {
  width:44px; height:44px; border-radius:50%;
  background:#2A3454; border:none;
  font-size:20px; color:#fff; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  flex-shrink: 0;
}
.btn-pause:active { background:#3A4464; }

/* ════════════ GAME AREA ════════════ */
.game-area {
  flex:1; position:relative; overflow:hidden;
  cursor:grab; touch-action:none;
}
.game-area:active { cursor:grabbing; }

/* 원본 하늘 배경 */
.sky-bg {
  position: absolute; inset: 0;
  background: linear-gradient(180deg,
    #5BC8E8 0%, #82D8F0 30%,
    #A8E6F7 60%, #C8F0FD 82%,
    #D4F5A0 93%, #A8D850 100%
  );
  overflow: hidden;
}
.end-sky { position:absolute; inset:0; }

/* 원본 이모지 구름 */
.cloud {
  position: absolute;
  font-size: 38px; opacity: 0.9;
  pointer-events: none;
  animation: cloudDrift ease-in-out infinite;
}
.gc1 { top:7%;  left:4%;  font-size:36px; animation-duration:18s; }
.gc2 { top:18%; right:9%; font-size:28px; animation-duration:24s; animation-direction:reverse; }
.gc3 { top:5%;  left:54%; font-size:24px; animation-duration:20s; animation-delay:5s; }

/* 원본 잔디 */
.grass-layer {
  position:absolute; bottom:0; left:0; right:0;
  height: 96px;
  background: linear-gradient(180deg, #7DC836 0%, #4E9926 100%);
  border-top: 4px solid #8ED63C;
  z-index: 2;
}
.grass-layer::before {
  content:''; position:absolute; top:-10px; left:0; right:0; height:16px;
  background: repeating-linear-gradient(
    90deg, #96DE45 0, #96DE45 14px, #7ED035 14px, #7ED035 30px
  );
  border-radius: 8px 8px 0 0;
}

/* 종료화면 잔디 */
.end-grass {
  position:absolute; bottom:0; left:0; right:0;
  height:100px;
  background: linear-gradient(180deg, #7DC836 0%, #4E9926 100%);
  border-top: 4px solid #8ED63C;
}

/* move hint */
.move-hint {
  position:absolute; bottom:104px; left:50%; transform:translateX(-50%);
  display:flex; align-items:center; gap:6px;
  opacity:0.38; pointer-events:none; z-index:4; font-size:13px; color:#333;
  animation:hintFade 3s ease-in-out 1.5s forwards;
}
.dash-line { width:52px; height:2px; background:repeating-linear-gradient(90deg,#555 0,#555 5px,transparent 5px,transparent 10px); }
@keyframes hintFade { 0%{opacity:0.38} 100%{opacity:0} }

/* ── pause overlay — UI-COMMON.md Overlay + Card 기준 ── */
.pause-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.50);          /* UI-COMMON Overlay */
  display: flex; align-items: center; justify-content: center;
  z-index: 30; backdrop-filter: blur(3px);
  padding: 0 24px;                        /* 좌우 여백 확보 */
}

/* UI-COMMON Standard Card */
.pause-card {
  width: 100%;
  background: #FFFFFF;                    /* --card-bg */
  border-radius: 16px;                    /* radius-lg */
  padding: 24px;                          /* space-6 */
  box-shadow: 0 4px 16px rgba(0,0,0,0.10); /* Level 2 */
  display: flex; flex-direction: column;
  align-items: center; gap: 8px;
  text-align: center;
}

.pause-emoji { font-size: 40px; line-height: 1; }

/* Title 2 — 22px 700 */
.pause-label {
  font-size: 22px; font-weight: 700; letter-spacing: -0.3px;
  color: #111827;                         /* --text-1 */
  margin-top: 4px;
}

/* Body 2 — 14px */
.pause-score {
  font-size: 14px; color: #6B7280;        /* --text-2 */
  margin-bottom: 4px;
}
.pause-score strong {
  font-size: 16px; font-weight: 700;
  color: #5F46FF;                         /* --primary */
}

/* UI-COMMON btn-row — 나란히 48px */
.pause-btn-row {
  display: flex; gap: 10px;              /* btn-row */
  width: 100%; margin-top: 4px;
}

/* btn-primary-md */
.btn-resume {
  flex: 1; height: 48px;
  background: #5F46FF; color: #FFFFFF;
  font-size: 15px; font-weight: 600; letter-spacing: -0.3px;
  border-radius: 12px; border: none; cursor: pointer;
}
.btn-resume:active { background: #4A35E0; }

/* btn-secondary */
.btn-quit {
  flex: 1; height: 48px;
  background: #F2F0FF; color: #5F46FF;   /* --primary-200 / --primary */
  font-size: 15px; font-weight: 700; letter-spacing: -0.3px;
  border-radius: 12px; border: none; cursor: pointer;
}
.btn-quit:active { background: #EEEAFF; }

/* ════════════ PROGRESS ════════════ */
.progress-area {
  flex-shrink:0; height:56px;
  background:#1B2340;
  border-top:1px solid rgba(255,255,255,0.06);
  display:flex; align-items:center;
  padding:0 16px; gap:12px;
}
.prog-left  { flex:1; display:flex; flex-direction:column; gap:3px; }
.prog-label { font-size:10px; color:rgba(255,255,255,0.45); font-weight:600; }
.prog-track { height:10px; background:rgba(255,255,255,0.12); border-radius:5px; overflow:hidden; }
.prog-fill  { height:100%; background:linear-gradient(90deg,#5F46FF,#818CF8); border-radius:5px; transition:width 0.5s cubic-bezier(0.34,1.56,0.64,1); }
.prog-num   { font-size:11px; color:rgba(255,255,255,0.5); font-weight:600; }
.prog-right { display:flex; flex-direction:column; align-items:center; gap:1px; }
.prog-pig   { font-size:22px; }
.prog-lv    { font-size:11px; font-weight:800; color:#818CF8; }

/* ════════════ START SCREEN ════════════ */
.screen { position:absolute; inset:0; z-index:50; display:flex; flex-direction:column; overflow:hidden; }
.start-screen { background:#87CEEB; }

.start-content {
  position:relative; z-index:1;
  margin-top:auto;
  padding:20px 20px 44px;
  display:flex; flex-direction:column;
  align-items:center; gap:14px;
}

.start-title {
  font-size:34px; font-weight:900; color:#fff;
  text-shadow:0 3px 14px rgba(0,0,0,0.22);
  letter-spacing:-1.5px; margin:0;
}
.start-sub {
  font-size:14px; color:rgba(255,255,255,0.9);
  font-weight:500; margin-top:-6px;
  text-shadow:0 1px 4px rgba(0,0,0,0.15);
}

/* rules */
.rule-row { display:flex; gap:10px; width:100%; }
.rule-item {
  flex:1; background:rgba(255,255,255,0.93);
  border-radius:16px; padding:12px 10px;
  display:flex; flex-direction:column;
  align-items:center; gap:8px;
  box-shadow:0 3px 14px rgba(0,0,0,0.10);
}
/* 아이콘 영역 고정 높이 — 양쪽 카드 텍스트 기준선 맞춤 */
.rule-icon-area {
  height: 52px;
  display: flex; align-items: center; justify-content: center;
}
.rule-coin-wrap {
  width:48px; height:48px; border-radius:50%;
  overflow:hidden;
  background: radial-gradient(circle at 40% 35%, #DDD6FE, #6D28D9);
  border:2.5px solid rgba(221,214,254,0.8);
  box-shadow:0 0 14px rgba(109,40,217,0.5);
  display:flex; align-items:center; justify-content:center;
}
.rule-coin-img { width:70%; height:70%; object-fit:contain; }
.rule-coins-row { display:flex; gap:4px; flex-wrap:wrap; justify-content:center; }
.mini-coin-img {
  width:26px; height:26px; border-radius:50%;
  object-fit:cover; border:1.5px solid rgba(255,255,255,0.5);
  box-shadow:0 2px 6px rgba(0,0,0,0.15);
}
.rule-text { display:flex; flex-direction:column; align-items:center; gap:2px; }
.rule-name { font-size:11px; color:#6B7280; font-weight:500; text-align:center; }
.rule-score { font-size:17px; font-weight:900; }
.green-txt { color:#10B981; }
.red-txt   { color:#EF4444; }

/* level preview */
.lv-section {
  background:rgba(255,255,255,0.9); border-radius:16px;
  padding:12px 14px; width:100%;
  box-shadow:0 2px 10px rgba(0,0,0,0.08);
}
.lv-title { font-size:13px; font-weight:800; color:#5F46FF; margin-bottom:8px; }
.lv-row   { display:flex; justify-content:space-between; align-items:flex-end; }
.lv-item  { display:flex; flex-direction:column; align-items:center; gap:2px; }
.lv-pig   { line-height:1; filter:saturate(1.2); }
.lv-label { font-size:10px; font-weight:800; color:#111827; }
.lv-range { font-size:9px; color:#9CA3AF; }

/* buttons */
.btn-start {
  width:100%; height:56px;
  background:#5F46FF; color:#fff;
  border:none; border-radius:12px;
  font-size:16px; font-weight:700;
  cursor:pointer; letter-spacing:-0.3px;
  font-family: 'SUIT Variable', 'SUIT', -apple-system, sans-serif;
  box-shadow:0 6px 24px rgba(95,70,255,0.5);
}
.btn-start:active { background:#4A35E0; transform:scale(0.97); }
.start-best { font-size:14px; color:rgba(255,255,255,0.82); font-weight:600; }

/* ════════════ NICKNAME ════════════ */
.nickname-section {
  width:100%; display:flex; flex-direction:column; gap:6px;
}
.nickname-label {
  font-size:13px; font-weight:700; color:rgba(255,255,255,0.9);
  padding-left:2px;
}
.nickname-input {
  width:100%; height:52px; box-sizing:border-box;
  border-radius:12px; border:2px solid rgba(255,255,255,0.4);
  background:rgba(255,255,255,0.92);
  padding:0 16px; font-size:16px; font-weight:600; color:#1a1a2e;
  outline:none; transition:border-color .2s;
}
.nickname-input:focus { border-color:#5F46FF; }
.nickname-input.error { border-color:#FF4D4D; }
.nickname-error {
  font-size:12px; color:#FFD6D6; font-weight:600; padding-left:2px;
}

/* ════════════ RANKING ════════════ */
.ranking-section {
  width:100%; display:flex; flex-direction:column; gap:0;
  background:#fff; border-radius:16px;
  padding:16px; box-sizing:border-box;
  box-shadow:0 2px 12px rgba(0,0,0,0.10);
}
.ranking-end { margin-top:4px; }
.ranking-header {
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:10px;
}
.ranking-title { font-size:16px; font-weight:800; color:#1a1a2e; }
.ranking-refresh {
  background:#f0f0f5; border:none; border-radius:8px;
  color:#5F46FF; font-size:18px; width:32px; height:32px;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; padding:0;
}
.ranking-refresh:disabled { opacity:0.4; }
.ranking-empty { font-size:13px; color:#888; text-align:center; padding:12px 0; }
.ranking-list {
  list-style:none; margin:0; padding:0;
  display:flex; flex-direction:column; gap:6px;
}
.ranking-item {
  display:flex; align-items:center; gap:8px;
  background:#f7f7fb; border-radius:10px;
  padding:9px 12px; transition:background .15s;
}
.ranking-item.rank-me {
  background:#FFF9E0; border:1.5px solid #FFD700;
}
.rank-num { font-size:18px; width:28px; text-align:center; flex-shrink:0; }
.rank-name { flex:1; font-size:14px; font-weight:700; color:#1a1a2e; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.rank-score { font-size:15px; font-weight:800; color:#5F46FF; flex-shrink:0; }
.rank-unit { font-size:11px; font-weight:600; color:#9985ff; margin-left:1px; }
.my-rank-badge {
  font-size:13px; font-weight:700; color:#5F46FF;
  text-align:center; margin-bottom:8px;
}
.ranking-error {
  font-size:11px; color:#c0392b; background:#fdecea;
  border-radius:8px; padding:8px 10px; margin-bottom:8px;
  word-break:break-all; line-height:1.4;
}

/* ════════════ END SCREEN ════════════ */
.end-screen { background:#87CEEB; }
.end-content {
  position:relative; z-index:1;
  margin-top:auto;
  padding:16px 20px 44px;
  display:flex; flex-direction:column;
  align-items:center; gap:12px;
}


.new-best {
  background:linear-gradient(135deg,#F59E0B,#FBBF24);
  color:#fff; font-size:13px; font-weight:800;
  padding:4px 18px; border-radius:9999px;
  box-shadow:0 2px 10px rgba(245,158,11,0.45);
}
.end-score-box {
  background:rgba(255,255,255,0.95); border-radius:20px;
  padding:18px 40px; text-align:center; width:100%;
  box-shadow:0 4px 20px rgba(0,0,0,0.10);
}
.end-score-lbl { font-size:12px; color:#9CA3AF; font-weight:600; }
.end-score-num { font-size:58px; font-weight:900; color:#5F46FF; letter-spacing:-3px; line-height:1; }
.end-lv-badge  { font-size:14px; font-weight:700; color:#374151; margin-top:2px; }

.end-best-row {
  width:100%; display:flex; justify-content:space-between; align-items:center;
  background:rgba(255,255,255,0.9); border-radius:12px;
  padding:12px 16px; font-size:15px; font-weight:600; color:#374151;
}
.end-best-val { font-size:18px; font-weight:800; color:#F59E0B; }

.end-growth {
  width:100%; background:rgba(255,255,255,0.9);
  border-radius:16px; padding:12px 14px;
}
.end-growth-title { font-size:13px; font-weight:800; color:#5F46FF; margin-bottom:8px; text-align:center; }
.end-growth-row { display:flex; justify-content:space-between; align-items:flex-end; }
.end-lv-step { display:flex; flex-direction:column; align-items:center; gap:2px; opacity:0.28; transition:opacity 0.3s; }
.end-lv-step.reached { opacity:1; }
.end-lv-label { font-size:10px; font-weight:800; color:#5F46FF; }

.btn-ghost {
  width:100%; height:48px;
  background:rgba(255,255,255,0.18); color:rgba(255,255,255,0.88);
  border:1px solid rgba(255,255,255,0.22);
  border-radius:12px; font-size:15px; font-weight:700; cursor:pointer;
  font-family: inherit;
}
.btn-ghost:active { background:rgba(255,255,255,0.26); }

/* ════════════ NICKNAME POPUP ════════════ */
.popup-overlay {
  position:absolute; inset:0; z-index:200;
  background:rgba(0,0,0,0.50);
  display:flex; align-items:center; justify-content:center;
  padding:24px; box-sizing:border-box;
}
.popup-card {
  width:100%; background:#fff;
  border-radius:20px; padding:28px 20px 20px;
  display:flex; flex-direction:column; gap:12px;
  box-shadow:0 8px 32px rgba(0,0,0,0.18);
}
.popup-title {
  font-size:18px; font-weight:700; color:#111827;
  letter-spacing:-0.3px; text-align:center;
}
.popup-desc {
  font-size:13px; color:#6B7280; text-align:center; margin-top:-4px;
}
.popup-input {
  width:100%; height:52px; box-sizing:border-box;
  padding:0 16px;
  background:#fff; border:1.5px solid #E5E7EB;
  border-radius:12px; font-size:15px; color:#111827;
  font-family:inherit; outline:none; transition:border-color .2s;
}
.popup-input:focus { border-color:#5F46FF; border-width:2px; }
.popup-input.error { border-color:#EF4444; }
.popup-input::placeholder { color:#9CA3AF; }
.popup-error {
  font-size:12px; color:#EF4444; font-weight:600;
  padding-left:2px; margin-top:-4px;
}
.popup-btn-row {
  display:flex; gap:10px; margin-top:4px;
}
.popup-btn-cancel {
  flex:1; height:48px;
  background:#F2F0FF; color:#5F46FF;
  border:none; border-radius:12px;
  font-size:15px; font-weight:700; font-family:inherit;
  cursor:pointer; letter-spacing:-0.3px;
}
.popup-btn-cancel:active { background:#e4e0ff; }
.popup-btn-confirm {
  flex:1; height:48px;
  background:#5F46FF; color:#fff;
  border:none; border-radius:12px;
  font-size:15px; font-weight:700; font-family:inherit;
  cursor:pointer; letter-spacing:-0.3px;
}
.popup-btn-confirm:active { background:#4A35E0; }

/* ════════════ TRANSITIONS ════════════ */
.fade-enter-active,.fade-leave-active { transition:opacity 0.22s; }
.fade-enter-from,.fade-leave-to { opacity:0; }

.slide-up-enter-active { transition:transform 0.4s cubic-bezier(0.32,1,0.55,1),opacity 0.3s; }
.slide-up-leave-active { transition:transform 0.3s ease-in,opacity 0.25s; }
.slide-up-enter-from   { transform:translateY(50px); opacity:0; }
.slide-up-leave-to     { transform:translateY(-30px); opacity:0; }
</style>
