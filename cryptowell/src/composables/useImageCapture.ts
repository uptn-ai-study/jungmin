import { ref, type Ref } from 'vue'
import html2canvas from 'html2canvas'
import type { Talisman } from '../types'

export function useImageCapture(cardEl: Ref<HTMLElement | null>) {
  const saving = ref(false)
  const sharing = ref(false)

  async function captureCard(): Promise<Blob> {
    if (!cardEl.value) throw new Error('card element not found')
    const canvas = await html2canvas(cardEl.value, {
      scale: 3, useCORS: true, backgroundColor: null, logging: false,
    })
    return new Promise((resolve, reject) =>
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('blob failed')), 'image/png')
    )
  }

  async function saveImage(todayStr: string, onToast: (msg: string) => void) {
    saving.value = true
    try {
      const blob = await captureCard()
      const url = URL.createObjectURL(blob)
      Object.assign(document.createElement('a'), {
        href: url, download: `talisman-${todayStr}.png`,
      }).click()
      URL.revokeObjectURL(url)
      onToast('📥 부적이 저장되었습니다')
    } catch {
      onToast('⚠️ 저장 실패')
    } finally {
      saving.value = false
    }
  }

  async function shareImage(
    todayStr: string,
    talisman: Talisman,
    onToast: (msg: string) => void,
    onShared: () => void,
  ) {
    sharing.value = true
    try {
      const blob = await captureCard()
      const file = new File([blob], `talisman-${todayStr}.png`, { type: 'image/png' })
      const text = `[크립토 우물]\n${talisman.grade}\n${talisman.main}\n\n${talisman.sub}`
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: '🪙 오늘의 크립토 투자 부적', text, files: [file] })
      } else if (navigator.share) {
        await navigator.share({ title: '🪙 오늘의 크립토 투자 부적', text })
      } else {
        await navigator.clipboard.writeText(text)
        onToast('📋 텍스트가 복사되었습니다')
        sharing.value = false
        return
      }
      onShared()
      onToast('📤 공유 완료!')
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') onToast('⚠️ 공유 실패')
    } finally {
      sharing.value = false
    }
  }

  return { saving, sharing, saveImage, shareImage }
}
