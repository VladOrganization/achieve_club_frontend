<template>
  <!-- Статичная сетка логотипов, которая медленно едет вниз. Сетка рисуется один раз,
       движение — CSS-анимация сдвига ровно на один шаг сетки (JS-кадров и перерисовок нет) -->
  <div ref="rootRef" class="overflow-hidden" aria-hidden="true">
    <canvas
        ref="canvasRef"
        class="logo-grid absolute left-0 w-full"
        :style="{ top: `-${step}px`, height: `calc(100% + ${step}px)`, '--step': `${step}px`, '--duration': `${duration}s` }"
    ></canvas>
  </div>
</template>

<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import {apiUrl} from '@/api/config'

const props = defineProps({
  // Размер иконки в пикселях
  iconSize: {type: Number, default: 31.5},
  // Расстояние между иконками
  gap: {type: Number, default: 18},
  // Секунд на сдвиг на один шаг сетки (больше — медленнее)
  duration: {type: Number, default: 8},
})

const rootRef = ref(null)
const canvasRef = ref(null)
const step = props.iconSize + props.gap

const icon = new Image()
let resizeObserver = null

const draw = () => {
  const canvas = canvasRef.value
  if (!canvas || !icon.complete || !icon.naturalWidth) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.globalAlpha = 0.85
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      ctx.drawImage(icon, x + props.gap / 2, y + props.gap / 2, props.iconSize, props.iconSize)
    }
  }
}

onMounted(() => {
  icon.onload = draw
  icon.src = apiUrl('email/achieveclub.png')

  resizeObserver = new ResizeObserver(([entry]) => {
    const {width, height} = entry.contentRect
    if (width <= 0 || height <= 0) return
    // +step: запас сверху, чтобы при сдвиге вниз не появлялась пустая полоса
    canvasRef.value.width = Math.ceil(width)
    canvasRef.value.height = Math.ceil(height + step)
    draw()
  })
  resizeObserver.observe(rootRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  icon.onload = null
})
</script>

<style scoped>
.logo-grid {
  animation: logo-grid-scroll var(--duration) linear infinite;
  will-change: transform;
}

@keyframes logo-grid-scroll {
  from { transform: translateY(0); }
  to { transform: translateY(var(--step)); }
}

@media (prefers-reduced-motion: reduce) {
  .logo-grid { animation: none; }
}
</style>
