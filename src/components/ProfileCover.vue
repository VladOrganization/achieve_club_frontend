<template>
  <div
      ref="rootRef"
      class="overflow-hidden"
      :class="[background ? 'bg-gradient-to-br from-[#eec35a] to-[#f56f10]' : '', adaptive ? '' : 'h-32 relative']"
  >
    <!-- Наклонная сетка иконок Achieve Club, «натянутая» на выпуклый 3D-меш.
         Рисуем на canvas: сотни SVG-элементов с перерисовкой каждый кадр сильно тормозят в Firefox -->
    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full" aria-hidden="true"></canvas>
  </div>
</template>

<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import {apiUrl} from '@/api/config'

const props = defineProps({
  // Подстраивать сетку под реальный размер блока (для фона страницы), а не под шапку 896x128
  adaptive: {type: Boolean, default: false},
  // Реагировать на мышь и тапы
  interactive: {type: Boolean, default: true},
  // Масштаб иконок и сетки (1.5 = крупнее на 50%)
  scale: {type: Number, default: 1},
  // Плавное затухание иконок по диагонали
  fade: {type: Boolean, default: true},
  // Сила 3D-изгиба сетки в адаптивном режиме (больше — сильнее выпуклость; безопасно до 1.5-2)
  bend: {type: Number, default: 1},
  // Хаотичный 3D-рельеф: сетка деформируется «буграми» и «ямами» по всей площади, а не одним шаром по центру
  chaos: {type: Boolean, default: false},
  // Рельеф медленно «плывёт» со временем (только вместе с chaos и без interactive)
  drift: {type: Boolean, default: false},
  // Наклон сетки в градусах (-30 = из левого нижнего в правый верхний, 0 = ровная сетка)
  tilt: {type: Number, default: -30},
  // Оранжевый градиентный фон под иконками (для фона страницы он не нужен)
  background: {type: Boolean, default: true},
})

// Затухание по диагонали (как linear-gradient to bottom right): точки опоры [положение 0..1, прозрачность]
const fadeStops = [[0, 1], [0.33, 0.7], [0.66, 0.1], [1, 0.01]]
const fadeAt = (t) => {
  if (t <= 0) return fadeStops[0][1]
  for (let n = 1; n < fadeStops.length; n++) {
    const [t1, a1] = fadeStops[n]
    if (t <= t1) {
      const [t0, a0] = fadeStops[n - 1]
      return a0 + ((a1 - a0) * (t - t0)) / (t1 - t0)
    }
  }
  return fadeStops[fadeStops.length - 1][1]
}
const baseOpacity = 0.85

let W = 896 // ширина области (по умолчанию max-w-4xl)
let H = 128 // высота области (по умолчанию h-32)
const iconSize = 28 * props.scale
const gap = 16 * props.scale
const step = iconSize + gap

const angle = (props.tilt * Math.PI) / 180 // наклон сетки
const u = [Math.cos(angle), Math.sin(angle)]
const v = [-Math.sin(angle), Math.cos(angle)]

// Параметры «меша»: эллипсоид, на поверхность которого натянута плоская сетка
const maxLon = 1.4 // дальше этого угла поверхность «уходит за горизонт»

// Детерминированный генератор случайных чисел, чтобы рельеф не «прыгал» при каждой пересборке
const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

let retime = null // пересчёт рельефа во времени для текущей сетки (задаётся в buildTiles)

const buildTiles = (w, h) => {
  const cx = w / 2
  const cy = h / 2
  // Чем меньше радиусы, тем сильнее изгиб. Для шапки это 900x300, для фона страницы — пропорционально размеру
  const Rx = props.adaptive ? w / props.bend : 900
  const Ry = props.adaptive ? (h * 2.3) / props.bend : 300

  // Псевдослучайные (но стабильные) бугры и ямы: центр, радиус влияния и знак/сила смещения
  const bumps = []
  if (props.chaos) {
    const rand = mulberry32(7)
    const count = Math.min(14, Math.max(5, Math.round((w * h) / 120000)))
    for (let n = 0; n < count; n++) {
      const k0 = (rand() < 0.5 ? -1 : 1) * (0.1 + rand() * 0.12) // > 0 увеличивает иконки, < 0 сжимает
      const x0 = rand() * w
      const y0 = rand() * h
      bumps.push({
        x: x0,
        y: y0,
        k: k0,
        sigma: (0.35 + rand() * 0.2) * Math.max(w, h) * 0.6,
        // Параметры «плавания» во времени: бугры медленно ходят по экрану, а их сила плавно меняет знак
        x0, y0,
        ax: (0.1 + rand() * 0.1) * Math.max(w, h),
        ay: (0.1 + rand() * 0.1) * Math.max(w, h),
        kmax: Math.abs(k0) * 1.3,
        fx: (2 * Math.PI) / (40 + rand() * 40), // период 40–80 с
        fy: (2 * Math.PI) / (40 + rand() * 40),
        fk: (2 * Math.PI) / (25 + rand() * 25), // период смены знака 25–50 с
        phx: rand() * Math.PI * 2,
        phy: rand() * Math.PI * 2,
        phk: rand() * Math.PI * 2,
      })
    }
  }

  const projectChaos = (x, y) => {
    const px = cx + x
    const py = cy + y
    let dx = 0
    let dy = 0
    for (const b of bumps) {
      const rx = px - b.x
      const ry = py - b.y
      const e = Math.exp(-(rx * rx + ry * ry) / (2 * b.sigma * b.sigma))
      dx += b.k * rx * e
      dy += b.k * ry * e
    }
    return [px + dx, py + dy]
  }

  const projectSphere = (x, y) => {
    const lon = x / Rx
    const lat = y / Ry
    if (Math.abs(lon) > maxLon || Math.abs(lat) > maxLon) return null
    return [
      cx + Rx * Math.cos(lat) * Math.sin(lon),
      cy + Ry * Math.sin(lat),
    ]
  }

  const project = props.chaos ? projectChaos : projectSphere

  const eps = 0.5
  const range = Math.max(40, Math.ceil(Math.hypot(w, h) / step) + 2)

  // Узлы сетки. Для хаотичного рельефа заранее оставляем только те, что могут попасть в видимую область
  // (с запасом на смещение), чтобы пересчитывать рельеф каждый кадр было дёшево
  const margin = 0.3 * Math.max(w, h)
  const candidates = []
  for (let i = -range; i <= range; i++) {
    for (let j = -range; j <= range; j++) {
      const x = (i * u[0] + j * v[0]) * step
      const y = (i * u[1] + j * v[1]) * step
      if (props.chaos) {
        const px = cx + x
        const py = cy + y
        if (px < -margin || px > w + margin || py < -margin || py > h + margin) continue
      }
      candidates.push([x, y])
    }
  }

  const computeTiles = () => {
    const result = []
    for (const [x, y] of candidates) {
      const p = project(x, y)
      const pu1 = project(x + u[0] * eps, y + u[1] * eps)
      const pu0 = project(x - u[0] * eps, y - u[1] * eps)
      const pv1 = project(x + v[0] * eps, y + v[1] * eps)
      const pv0 = project(x - v[0] * eps, y - v[1] * eps)
      if (!p || !pu1 || !pu0 || !pv1 || !pv0) continue
      if (p[0] < -step || p[0] > w + step || p[1] < -step || p[1] > h + step) continue

      // Локальная матрица преобразования: иконка сжимается и скашивается вместе с поверхностью
      const a = (pu1[0] - pu0[0]) / (2 * eps)
      const b = (pu1[1] - pu0[1]) / (2 * eps)
      const c = (pv1[0] - pv0[0]) / (2 * eps)
      const d = (pv1[1] - pv0[1]) / (2 * eps)
      const det = Math.abs(a * d - b * c)

      result.push({
        x: p[0], y: p[1], a, b, c, d,
        opacity: Math.min(1, Math.max(props.adaptive ? 0.35 : 0.6, det)),
      })
    }
    return result
  }

  // Пересчёт рельефа для момента времени t (в секундах)
  retime = (t) => {
    for (const b of bumps) {
      b.x = b.x0 + b.ax * Math.sin(t * b.fx + b.phx)
      b.y = b.y0 + b.ay * Math.sin(t * b.fy + b.phy)
      b.k = b.kmax * Math.sin(t * b.fk + b.phk)
    }
    return computeTiles()
  }

  return computeTiles()
}

// Мышь: иконки мягко отталкиваются от курсора
const pushRadius = 90 // радиус влияния курсора
const pushStrength = 12 // максимальное смещение иконки
const easing = 0.15 // плавность возврата и следования

// Тап или клик: «взрыв» — иконки разлетаются от точки касания и пружиной возвращаются
const blastRadius = 220 // радиус взрыва
const blastAcceleration = 15.3 // сила разлёта (чем больше, тем дальше разлетаются иконки)
const blastFrames = 16 // сколько кадров иконки разлетаются (около 0.27 с)
const spring = 0.225 // жёсткость возврата
const damping = 0.611 // затухание: чем меньше, тем меньше «пружинит»

const rootRef = ref(null)
const canvasRef = ref(null)
const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let tiles = []
let offsets = [] // смещение от наведения мыши
let blast = [] // смещение от взрыва
let blastVelocity = []
const blasts = [] // активные взрывы: точка и номер кадра разгона

const icon = new Image()
let ctx = null
// Соответствие координат сетки (W x H) пикселям canvas: как preserveAspectRatio slice (шапка) или none (фон страницы)
const view = {scale: 1, ox: 0, oy: 0, dpr: 1}

const updateView = (width, height) => {
  const canvas = canvasRef.value
  if (!canvas) return
  // Фон страницы почти невидим (opacity 4.5%), ему хватает 1x; шапке — чёткость на ретине, но не больше 2x
  view.dpr = props.adaptive ? 1 : Math.min(window.devicePixelRatio || 1, 2)
  const pw = Math.max(1, Math.round(width * view.dpr))
  const ph = Math.max(1, Math.round(height * view.dpr))
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw
    canvas.height = ph
  }
  if (props.adaptive) {
    view.scale = 1
    view.ox = 0
    view.oy = 0
  } else {
    view.scale = Math.max(width / W, height / H)
    view.ox = (width - W * view.scale) / 2
    view.oy = (height - H * view.scale) / 2
  }
}

const draw = () => {
  if (!ctx || !icon.complete || !icon.naturalWidth) return
  const canvas = canvasRef.value
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const s = view.scale * view.dpr
  const ox = view.ox * view.dpr
  const oy = view.oy * view.dpr
  const half = iconSize / 2
  const moving = props.interactive
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i]
    let x = tile.x
    let y = tile.y
    if (moving) {
      const o = offsets[i]
      const bo = blast[i]
      if (o && bo) {
        x += o[0] + bo[0]
        y += o[1] + bo[1]
      }
    }
    const alpha = tile.opacity * baseOpacity * (props.fade ? fadeAt((x / W + y / H) / 2) : 1)
    if (alpha < 0.005) continue
    ctx.globalAlpha = alpha
    ctx.setTransform(s * tile.a, s * tile.b, s * tile.c, s * tile.d, s * x + ox, s * y + oy)
    ctx.drawImage(icon, -half, -half, iconSize, iconSize)
  }
}

const rebuild = (w, h) => {
  W = w
  H = h
  tiles = buildTiles(w, h)
  if (props.drift && props.chaos && !reducedMotion && retime) tiles = retime(performance.now() / 1000) // без скачка на первом кадре
  offsets = tiles.map(() => [0, 0])
  blast = tiles.map(() => [0, 0])
  blastVelocity = tiles.map(() => [0, 0])
  draw()
}

rebuild(W, H)

let pointer = null
let frame = null

const animate = () => {
  let moving = blasts.length > 0
  tiles.forEach((tile, i) => {
    const bo = blast[i]
    const bv = blastVelocity[i]
    let ax = 0
    let ay = 0
    // Разгон: сила взрыва нарастает от нуля, а после разгона остаётся только пружина
    for (const b of blasts) {
      const dx = tile.x - b.x
      const dy = tile.y - b.y
      const dist = Math.hypot(dx, dy) || 1
      const force = Math.exp(-((dist / blastRadius) ** 2)) * blastAcceleration * ((b.frame + 1) / blastFrames)
      ax += (dx / dist) * force
      ay += (dy / dist) * force
    }
    bv[0] = (bv[0] + ax - bo[0] * spring) * damping
    bv[1] = (bv[1] + ay - bo[1] * spring) * damping
    bo[0] += bv[0]
    bo[1] += bv[1]
    if (Math.abs(bo[0]) > 0.01 || Math.abs(bo[1]) > 0.01 || Math.abs(bv[0]) > 0.01 || Math.abs(bv[1]) > 0.01) {
      moving = true
    }

    let tx = 0
    let ty = 0
    if (pointer) {
      const dx = tile.x - pointer[0]
      const dy = tile.y - pointer[1]
      const dist = Math.hypot(dx, dy) || 1
      const force = Math.exp(-((dist / pushRadius) ** 2)) * pushStrength
      tx = (dx / dist) * force
      ty = (dy / dist) * force
    }
    const o = offsets[i]
    o[0] += (tx - o[0]) * easing
    o[1] += (ty - o[1]) * easing
    if (Math.abs(tx - o[0]) > 0.01 || Math.abs(ty - o[1]) > 0.01) moving = true
  })
  for (let n = blasts.length - 1; n >= 0; n--) {
    if (++blasts[n].frame >= blastFrames) blasts.splice(n, 1)
  }
  draw()
  frame = moving ? requestAnimationFrame(animate) : null
}

const start = () => {
  if (frame === null) frame = requestAnimationFrame(animate)
}

// Координаты курсора в системе сетки (W x H)
const toLocal = (event) => {
  const rect = rootRef.value?.getBoundingClientRect()
  if (!rect || !view.scale) return null
  return [
    (event.clientX - rect.left - view.ox) / view.scale,
    (event.clientY - rect.top - view.oy) / view.scale,
  ]
}

// Слушаем события на window: поверх шапки лежит блок с аватаркой, который перехватывал бы касания и мышь
const isInside = (event) => {
  const rect = rootRef.value?.getBoundingClientRect()
  return !!rect
      && event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom
}

const resetPointer = () => {
  if (pointer === null) return
  pointer = null
  start()
}

const onPointerMove = (event) => {
  if (reducedMotion || event.pointerType !== 'mouse') return
  const local = isInside(event) ? toLocal(event) : null
  if (!local) return resetPointer()
  pointer = local
  start()
}

const onPointerDown = (event) => {
  if (reducedMotion || !isInside(event)) return
  const local = toLocal(event)
  if (!local) return
  blasts.push({x: local[0], y: local[1], frame: 0})
  start()
}

let driftFrame = null
let lastDrift = 0

const driftStep = (now) => {
  driftFrame = requestAnimationFrame(driftStep)
  if (now - lastDrift < 80) return // около 12 кадров в секунду: рельеф плывёт с периодом десятки секунд, больше не нужно
  lastDrift = now
  if (!retime) return
  tiles = retime(now / 1000)
  draw()
}

let resizeObserver = null

onMounted(() => {
  ctx = canvasRef.value.getContext('2d')
  icon.onload = draw
  icon.src = iconUrl

  if (rootRef.value) {
    resizeObserver = new ResizeObserver(([entry]) => {
      const {width, height} = entry.contentRect
      if (width <= 0 || height <= 0) return
      updateView(width, height)
      if (props.adaptive) rebuild(Math.round(width), Math.round(height))
      else draw()
    })
    resizeObserver.observe(rootRef.value)
  }
  if (props.drift && props.chaos && !props.interactive && !reducedMotion) {
    driftFrame = requestAnimationFrame(driftStep)
  }
  if (!props.interactive) return
  window.addEventListener('pointermove', onPointerMove, {passive: true})
  window.addEventListener('pointerdown', onPointerDown, {passive: true})
  document.documentElement.addEventListener('pointerleave', resetPointer)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  icon.onload = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerdown', onPointerDown)
  document.documentElement.removeEventListener('pointerleave', resetPointer)
  if (frame !== null) cancelAnimationFrame(frame)
  if (driftFrame !== null) cancelAnimationFrame(driftFrame)
})

const iconUrl = apiUrl('email/achieveclub.png')
</script>
