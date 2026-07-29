import type { Drama, Episode, EpisodeVideo, FeedItem, HomeSectionView } from '~/types/feed.types'
import { resolvePlayableUrl } from '~/composables/usePlayableUrl'

type EpisodeRow = Episode & { episode_videos: EpisodeVideo[] | null }

function errMessage(err: unknown) {
  if (!err) return 'Load failed'
  if (typeof err === 'string') return err
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const msg = (err as { message?: unknown }).message
    if (typeof msg === 'string' && msg) return msg
  }
  return 'Load failed'
}

export function useDramaFeed() {
  const client = useSupabaseClient()
  const { locale } = useI18n()

  async function resolvePlayUrl(episode: EpisodeRow): Promise<string | null> {
    const url = await resolvePlayableUrl(
      client,
      (episode.episode_videos || []) as any,
      locale.value,
      episode.video_url,
    )
    return url || null
  }

  async function fetchFeed(): Promise<FeedItem[]> {
    const { data: dramas, error: dramaErr } = await client
      .from('dramas')
      .select('id, title, slug, synopsis, cover_url, tags, is_trending, status, updated_at, primary_locale')
      .eq('status', 'published')
      .eq('primary_locale', locale.value)
      .order('updated_at', { ascending: false })
      .limit(30)

    if (dramaErr) throw new Error(errMessage(dramaErr))

    const list = (dramas ?? []) as Drama[]
    if (!list.length) return []

    const ids = list.map((d) => d.id)
    const { data: episodes, error: epErr } = await client
      .from('episodes')
      .select(`
        id, drama_id, episode_number, title, duration_seconds, video_url, is_free, coin_price, created_at,
        episode_videos (id, episode_id, locale, video_url, storage_path)
      `)
      .in('drama_id', ids)

    if (epErr) throw new Error(errMessage(epErr))

    const epRows = (episodes ?? []) as EpisodeRow[]
    const byDrama = new Map<string, EpisodeRow[]>()
    for (const ep of epRows) {
      const arr = byDrama.get(ep.drama_id) ?? []
      arr.push(ep)
      byDrama.set(ep.drama_id, arr)
    }

    const ordered = [
      ...list.filter((d) => d.is_trending),
      ...list.filter((d) => !d.is_trending),
    ]

    const built = await Promise.all(
      ordered.map(async (drama) => {
        const eps = [...(byDrama.get(drama.id) ?? [])].sort(
          (a, b) => a.episode_number - b.episode_number,
        )
        const first = eps[0]
        if (!first) return null

        const videoUrl = await resolvePlayUrl(first)
        if (!videoUrl) return null

        const item: FeedItem = {
          dramaId: drama.id,
          dramaTitle: drama.title,
          slug: drama.slug,
          synopsis: drama.synopsis,
          coverUrl: drama.cover_url,
          tags: drama.tags ?? [],
          isTrending: drama.is_trending,
          episodeId: first.id,
          episodeNumber: first.episode_number,
          episodeTitle: first.title,
          durationSeconds: first.duration_seconds,
          videoUrl,
          isFree: first.is_free,
          coinPrice: first.coin_price,
          episodeCount: eps.length,
        }
        return item
      }),
    )

    return built.filter((item): item is FeedItem => item !== null)
  }

  async function fetchHomeSections(): Promise<HomeSectionView[]> {
    const { data: sections, error: secErr } = await client
      .from('home_sections')
      .select('id, title, slug, sort_order, is_active, created_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (secErr) throw new Error(errMessage(secErr))

    const { data: items, error: itemErr } = await client
      .from('home_section_items')
      .select(`
        id, section_id, drama_id, sort_order,
        dramas (id, title, slug, synopsis, cover_url, tags, is_trending, status, primary_locale)
      `)
      .order('sort_order', { ascending: true })

    if (itemErr) throw new Error(errMessage(itemErr))

    return (sections ?? []).map((section) => ({
      ...section,
      items: (items ?? [])
        .filter((row: any) => row.section_id === section.id && row.dramas)
        .map((row: any) => ({
          id: row.id as string,
          sort_order: row.sort_order as number,
          drama: row.dramas as Drama,
        }))
        .filter((row: any) =>
          row.drama.status === 'published'
          && (row.drama.primary_locale || 'en') === locale.value,
        ),
    })) as HomeSectionView[]
  }

  return { fetchFeed, fetchHomeSections }
}
