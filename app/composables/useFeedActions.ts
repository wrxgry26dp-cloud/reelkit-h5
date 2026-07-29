const LIKES_KEY = 'reelkit-h5-likes'
const FAVS_KEY = 'reelkit-h5-favorites'

function readIds(key: string): string[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

function writeIds(key: string, ids: string[]) {
  if (!import.meta.client) return
  localStorage.setItem(key, JSON.stringify(ids))
}

export function useFeedActions() {
  const likedIds = useState<string[]>('h5-liked-ids', () => [])
  const favoritedIds = useState<string[]>('h5-fav-ids', () => [])
  const hydrated = useState('h5-actions-hydrated', () => false)

  function hydrate() {
    if (!import.meta.client || hydrated.value) return
    likedIds.value = readIds(LIKES_KEY)
    favoritedIds.value = readIds(FAVS_KEY)
    hydrated.value = true
  }

  onMounted(hydrate)

  function isLiked(dramaId: string) {
    hydrate()
    return likedIds.value.includes(dramaId)
  }

  function isFavorited(dramaId: string) {
    hydrate()
    return favoritedIds.value.includes(dramaId)
  }

  function toggleLike(dramaId: string) {
    hydrate()
    const set = new Set(likedIds.value)
    if (set.has(dramaId)) set.delete(dramaId)
    else set.add(dramaId)
    likedIds.value = [...set]
    writeIds(LIKES_KEY, likedIds.value)
    return set.has(dramaId)
  }

  function toggleFavorite(dramaId: string) {
    hydrate()
    const set = new Set(favoritedIds.value)
    if (set.has(dramaId)) set.delete(dramaId)
    else set.add(dramaId)
    favoritedIds.value = [...set]
    writeIds(FAVS_KEY, favoritedIds.value)
    return set.has(dramaId)
  }

  async function shareDrama(input: { title: string; dramaId: string }) {
    const url = `${window.location.origin}/drama/${input.dramaId}`
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: input.title,
          text: input.title,
          url,
        })
        return 'shared' as const
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled' as const
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      return 'copied' as const
    } catch {
      return 'failed' as const
    }
  }

  return {
    likedIds,
    favoritedIds,
    isLiked,
    isFavorited,
    toggleLike,
    toggleFavorite,
    shareDrama,
  }
}
