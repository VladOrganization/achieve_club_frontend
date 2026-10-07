import {ref} from 'vue'
import api from '@/api/client'

export const TOP_COUNT = 4 // сколько первых мест выделяем
const CACHE_MS = 60_000

// Единая сортировка «Топа»: по убыванию XP (порядок равных XP остаётся как в ответе сервера)
export const sortByXp = (students) => [...students].sort((a, b) => (b.xpSum || 0) - (a.xpSum || 0))

// Места (1..TOP_COUNT) по id пользователя. Нулевой XP места не даёт.
export const ranksOf = (students) => {
  const ranks = {}
  sortByXp(students)
      .slice(0, TOP_COUNT)
      .forEach((student, index) => {
        if ((student.xpSum || 0) > 0) ranks[student.id] = index + 1
      })
  return ranks
}

// Места общие для всех страниц, поэтому список студентов кешируем, чтобы не дёргать сервер на каждый профиль
const ranks = ref({})
let loadedAt = 0
let pending = null

export const useTopRanks = () => {
  const load = async (force = false) => {
    if (!force && Date.now() - loadedAt < CACHE_MS) return
    pending ??= api.get('/api/users')
        .then((response) => {
          ranks.value = ranksOf(response.data || [])
          loadedAt = Date.now()
        })
        .catch((error) => {
          // Выделение — украшение, поэтому ошибку не показываем пользователю
          console.error('Error fetching top ranks:', error)
        })
        .finally(() => {
          pending = null
        })
    await pending
  }

  return {ranks, load}
}
