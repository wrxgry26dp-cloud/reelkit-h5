export type DramaStatus = 'draft' | 'published' | 'archived'

export type Drama = {
  id: string
  title: string
  slug: string
  synopsis: string | null
  cover_url: string | null
  cover_path?: string | null
  status: DramaStatus
  is_trending: boolean
  tags: string[] | null
  primary_locale?: string | null
  created_at?: string
  updated_at?: string
}

export type Episode = {
  id: string
  drama_id: string
  episode_number: number
  title: string
  duration_seconds: number
  video_url: string | null
  is_free: boolean
  coin_price: number
  created_at?: string
}

export type EpisodeVideo = {
  id: string
  episode_id: string
  locale: string
  video_url: string | null
  storage_path: string | null
}

export type FeedItem = {
  dramaId: string
  dramaTitle: string
  slug: string
  synopsis: string | null
  coverUrl: string | null
  tags: string[]
  isTrending: boolean
  episodeId: string
  episodeNumber: number
  episodeTitle: string
  durationSeconds: number
  videoUrl: string
  isFree: boolean
  coinPrice: number
  episodeCount: number
}

export type HomeSectionView = {
  id: string
  title: string
  slug: string
  sort_order: number
  is_active: boolean
  created_at?: string
  items: Array<{
    id: string
    sort_order: number
    drama: Drama
  }>
}
