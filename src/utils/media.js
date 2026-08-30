import { API_CONFIG } from '@/api/config'

export function mediaUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const trimmed = String(path).replace(/^\/+/, '')

  // Dev: same-origin proxy in vite.config.js (local wwwroot, no prod, no self-signed cert).
  // Prod build: VITE_API_URL from CI/Docker, same host as the API.
  if (import.meta.env.DEV) {
    return `/media/${trimmed}`
  }

  return `${API_CONFIG.baseURL}:${API_CONFIG.port}/${trimmed}`
}

export function isMainCategory(category) {
  const title = (category?.title || '').trim().toLowerCase()
  return title.startsWith('главн') || title === 'main'
}

export function pickDefaultCategory(categories) {
  if (!categories?.length) return null
  return (
    categories.find(isMainCategory)
    || categories.find((c) => !c.startDate && !c.endDate)
    || categories.find((c) => c.available)
    || categories[0]
  )
}

export function sortCategories(categories) {
  return [...(categories || [])].sort((a, b) => {
    const aMain = isMainCategory(a) ? 0 : 1
    const bMain = isMainCategory(b) ? 0 : 1
    if (aMain !== bMain) return aMain - bMain
    return (a.id || 0) - (b.id || 0)
  })
}

export function formatXp(value) {
  const n = Number(value) || 0
  return `${n.toLocaleString('ru-RU')} XP`
}

export function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('ru-RU')
}

export function isCancelledStatus(title) {
  const t = (title || '').toLowerCase()
  return t.includes('отклон') || t.includes('отмен') || t.includes('cancel')
}

export function isReceivedStatus(title) {
  const t = (title || '').toLowerCase()
  return t.includes('получен') || t.includes('received')
}

export function isActiveOrderStatus(title) {
  return !isCancelledStatus(title) && !isReceivedStatus(title)
}

export function isCssColor(value) {
  if (!value) return false
  return value.startsWith('#') || value.startsWith('rgb') || /^[a-z]+$/i.test(value)
}
