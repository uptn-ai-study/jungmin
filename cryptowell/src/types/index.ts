export interface Talisman {
  symbol: string
  grade: string
  main: string
  sub: string
}

export interface ThrowRecord {
  date: string
  talisman: Talisman
}

export type Phase = 'idle' | 'throwing' | 'loading' | 'result'
export type TabId = 'well' | 'history'

export interface ToastState {
  visible: boolean
  leaving: boolean
  msg: string
}
