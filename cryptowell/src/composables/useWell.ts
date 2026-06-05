import { ref, computed } from 'vue'
import { TALISMANS } from '../data/talismans'
import type { Phase, ThrowRecord, Talisman } from '../types'

export const COST = 10
const SK = 'cw_v3'

function getToday() { return new Date().toDateString() }

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function hashCode(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function getUserId() {
  let id = localStorage.getItem('cw_uid')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('cw_uid', id) }
  return id
}

function pickTalisman(uid: string, idx: number): Talisman {
  return TALISMANS[hashCode(uid + getToday() + String(idx)) % TALISMANS.length]
}

export function useWell() {
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SK) || '{}')
      const isToday = s.lastDate === getToday()
      return {
        pts: (s.pts as number) ?? 1240,
        throwCount: isToday ? ((s.throwCount as number) ?? 0) : 0,
        sharedToday: isToday ? ((s.sharedToday as boolean) ?? false) : false,
        throwHistory: (s.throwHistory as ThrowRecord[]) ?? [],
      }
    } catch {
      return { pts: 1240, throwCount: 0, sharedToday: false, throwHistory: [] as ThrowRecord[] }
    }
  }

  const init = load()
  const pts = ref(init.pts)
  const throwCount = ref(init.throwCount)
  const sharedToday = ref(init.sharedToday)
  const throwHistory = ref<ThrowRecord[]>(init.throwHistory)
  const phase = ref<Phase>('idle')
  const coinGo = ref(false)
  const rippleGo = ref(false)
  const dots = ref('...')
  const currentTalisman = ref<Talisman | null>(null)
  const todayStr = computed(() => getTodayStr())
  const throwHistoryReversed = computed(() => [...throwHistory.value].reverse())

  function save() {
    try {
      localStorage.setItem(SK, JSON.stringify({
        pts: pts.value,
        throwCount: throwCount.value,
        sharedToday: sharedToday.value,
        throwHistory: throwHistory.value,
        lastDate: getToday(),
      }))
    } catch { /* storage unavailable */ }
  }

  function markShared() {
    sharedToday.value = true
    save()
  }

  function throwCoin() {
    if (pts.value < COST) return
    phase.value = 'throwing'
    coinGo.value = false
    requestAnimationFrame(() => requestAnimationFrame(() => { coinGo.value = true }))
    setTimeout(() => { rippleGo.value = true }, 500)

    setTimeout(() => {
      phase.value = 'loading'
      coinGo.value = false
      rippleGo.value = false
      let i = 0
      const seq = ['', '.', '..', '...']
      const dt = setInterval(() => { dots.value = seq[i++ % seq.length] }, 400)
      setTimeout(() => {
        clearInterval(dt)
        pts.value -= COST
        throwCount.value += 1
        const talisman = pickTalisman(getUserId(), throwCount.value)
        currentTalisman.value = talisman
        throwHistory.value.push({ date: todayStr.value, talisman })
        save()
        phase.value = 'result'
      }, 1800)
    }, 900)
  }

  function resetWell() {
    if (pts.value < COST) return
    phase.value = 'idle'
    currentTalisman.value = null
    coinGo.value = false
    rippleGo.value = false
  }

  return {
    COST,
    pts, throwCount, sharedToday, throwHistory, throwHistoryReversed,
    phase, coinGo, rippleGo, dots, currentTalisman, todayStr,
    throwCoin, resetWell, markShared,
  }
}
