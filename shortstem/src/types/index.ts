export type Category = '뷰티' | '전자기기' | '생활용품' | '식품' | '패션' | '기타'
export type PriceSource = 'description' | 'comment' | 'known' | 'estimated' | 'user'
export type Priority = 'high' | 'medium' | 'low'

export interface Product {
  id: string
  name: string
  seller: string
  category: Category
  itemCode: string | null
  price: number
  priceSource: PriceSource
  priority: Priority
  memo: string
  videoTitle?: string
  videoUrl?: string
  videoThumbnail?: string
  purchaseUrl?: string | null
  timestamp?: string | null
  savedAt: string
}

export interface VideoInfo {
  url: string
  title: string
  thumbnail: string
  channelName: string
  publishedAt: string
}

export interface AnalysisResult {
  video: VideoInfo
  products: Product[]
  noProductsReason?: 'too_long' | 'not_found'
}

export interface FolderInfo {
  key: Category
  label: string
  emoji: string
  color: string
  tabColor: string
  bgLight: string
}
