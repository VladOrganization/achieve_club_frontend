import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  const apply = (dark = isDark.value) => {
    isDark.value = dark
  }

  watch(isDark, (dark) => {
    document.documentElement.classList.toggle('p-dark', dark)
  }, { immediate: true })

  const originFromEvent = (event) => {
    const host = event?.currentTarget instanceof Element
      ? event.currentTarget
      : document.querySelector('.theme-switch')
    if (!host) {
      return { x: window.innerWidth - 40, y: window.innerHeight - 96 }
    }
    const rect = host.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
  }

  const toggle = async (event) => {
    const next = !isDark.value
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const flip = () => apply(next)

    if (reduce || typeof document.startViewTransition !== 'function') {
      flip()
      return
    }

    const { x, y } = originFromEvent(event)
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )
    const root = document.documentElement
    root.style.setProperty('--theme-x', `${x}px`)
    root.style.setProperty('--theme-y', `${y}px`)
    root.style.setProperty('--theme-r', `${radius}px`)

    try {
      const transition = document.startViewTransition(flip)
      await Promise.race([
        transition.finished.catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 600)),
      ])
    } catch {
      flip()
    }
  }

  return { isDark, apply, toggle }
}, {
  persist: {
    key: 'achieve-theme',
    storage: localStorage,
    pick: ['isDark'],
  },
})
