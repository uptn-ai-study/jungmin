import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) ?? ''
const supabaseKey = (import.meta.env.VITE_SUPABASE_KEY as string) ?? ''

if (!supabaseUrl || !supabaseKey) {
  console.warn('[supabase] 환경변수 없음 — 랭킹 기능 비활성화')
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null as any

export interface RankingRow {
  nickname: string
  score: number
}

/** 닉네임별 최고 점수만 top 10 */
export async function fetchRankings(): Promise<RankingRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('Piggy Cathcer')
    .select('nickname, score')
    .order('score', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[fetchRankings] error:', error.message, error.code)
    return []
  }
  if (!data) return []

  const seen = new Set<string>()
  const result: RankingRow[] = []
  for (const row of data) {
    if (!seen.has(row.nickname)) {
      seen.add(row.nickname)
      result.push({ nickname: row.nickname, score: row.score })
    }
    if (result.length >= 10) break
  }
  return result
}

/** 닉네임의 기존 최고 점수보다 높을 때만 저장. 에러 메시지 반환 */
export async function saveScore(nickname: string, score: number): Promise<string | null> {
  if (!supabase) return null
  const trimmed = nickname.trim()
  if (!trimmed) return null

  const { data: existing, error: selectError } = await supabase
    .from('Piggy Cathcer')
    .select('id, score')
    .eq('nickname', trimmed)
    .maybeSingle()

  if (selectError) {
    console.error('[saveScore] select error:', selectError.message, selectError.code)
    return selectError.message
  }

  if (existing) {
    if (score > existing.score) {
      const { error } = await supabase
        .from('Piggy Cathcer')
        .update({ score })
        .eq('id', existing.id)
      if (error) {
        console.error('[saveScore] update error:', error.message, error.code)
        return error.message
      }
    }
  } else {
    const { error } = await supabase
      .from('Piggy Cathcer')
      .insert({ nickname: trimmed, score })
    if (error) {
      console.error('[saveScore] insert error:', error.message, error.code)
      return error.message
    }
  }
  return null
}
