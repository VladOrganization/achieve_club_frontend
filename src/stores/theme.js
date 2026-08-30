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
    const thumb = host?.querySelector?.('.theme-switch__thumb')
    const target = thumb || host
    if (!target) {
      return { x: window.innerWidth - 40, y: window.innerHeight - 96 }
    }

    const rect = target.getBoundingClientRect()
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
    root.classList.add('theme-switching')

    try {
      const transition = document.startViewTransition(flip)
      await transition.ready
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 480,
          easing: 'ease-out',
          fill: 'both',
          pseudoElement: '::view-transition-new(root)',
        }
      )
      await Promise.race([
        transition.finished.catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 700)),
      ])
    } catch {
      if (isDark.value !== next) flip()
    } finally {
      root.classList.remove('theme-switching')
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
