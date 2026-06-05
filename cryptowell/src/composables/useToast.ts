import { ref } from 'vue'
import type { ToastState } from '../types'

export function useToast() {
  const toast = ref<ToastState>({ visible: false, leaving: false, msg: '' })
  let timer: ReturnType<typeof setTimeout> | null = null

  function showToast(msg: string) {
    if (timer) clearTimeout(timer)
    toast.value = { visible: true, leaving: false, msg }
    timer = setTimeout(() => {
      toast.value.leaving = true
      setTimeout(() => { toast.value.visible = false }, 300)
    }, 2200)
  }

  return { toast, showToast }
}
