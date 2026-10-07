<template>
  <!-- Неравномерное перетекание цветов (non-regular blending): шейдер с искажёнными шумом градиентами -->
  <canvas ref="canvasRef" class="block w-full h-full" aria-hidden="true"></canvas>
</template>

<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'

const props = defineProps({
  // Максимальная доля цвета над белым: 0.42 даёт в среднем около 7% оранжевого
  strength: {type: Number, default: 0.42},
  // Скорость течения (1 = спокойная)
  speed: {type: Number, default: 1},
  // Во сколько раз рендерим меньше экрана: градиенты гладкие, так что хватает и 0.5
  resolution: {type: Number, default: 0.35},
  // Сколько пятен: больше — мельче и чаще (1.3 — крупные потоки, 2.9 — много пятен)
  detail: {type: Number, default: 2.9},
})

const canvasRef = ref(null)

const vertexSource = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

// Цвета логотипа ByteSchool: жёлтый #eec35a, оранжевый #f19834, красно-оранжевый #f56f10
const fragmentSource = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uStrength;
uniform float uDetail;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = p * 2.0 + vec2(3.1, 1.7);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = gl_FragCoord.xy / max(uRes.x, uRes.y) * uDetail * 0.6;
  float t = uTime;

  // Двойное искажение координат: из-за него потоки изогнуты и «текут», а не идут ровными полосами
  vec2 q = vec2(fbm(p + t * 0.5), fbm(p + vec2(5.2, 1.3) - t * 0.4));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 0.6),
                fbm(p + 3.0 * q + vec2(8.3, 2.8) - t * 0.5));
  float w = fbm(p + 3.0 * r);

  // Периодические полосы вдоль искажённого поля: пятна распределены по всему экрану равномерно,
  // а не скапливаются в кучи, и у потоков чёткие границы
  float bands = sin((p.x * 0.8 + p.y * 0.6) * 5.0 + w * 10.0);
  float m = smoothstep(-0.5, 0.8, bands);

  // Прозрачность потока меняется от места к месту: где-то он плотный, где-то почти растворяется в белом
  float alpha = 0.2 + 0.8 * smoothstep(0.2, 0.8, fbm(p * 1.8 + q * 2.0 + vec2(3.0, 7.0)));

  // Цвет потока плавно меняется между цветами логотипа ByteSchool
  float h = clamp((fbm(p * 0.6 + r * 2.0 + vec2(9.0, 4.0)) - 0.25) * 2.4, 0.0, 1.0);
  vec3 yellow = vec3(0.933, 0.765, 0.353);
  vec3 orange = vec3(0.945, 0.596, 0.204);
  vec3 red = vec3(0.961, 0.435, 0.063);
  vec3 col = mix(yellow, orange, smoothstep(0.2, 0.5, h));
  col = mix(col, red, smoothstep(0.55, 0.9, h));

  gl_FragColor = vec4(mix(vec3(1.0), col, uStrength * m * alpha), 1.0);
}
`

let gl = null
let program = null
let frame = null
let resizeObserver = null
let uniforms = {}
const startedAt = performance.now()

const compile = (type, source) => {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
}

// Размер берём из ResizeObserver: чтение clientWidth на каждом кадре заставляет браузер пересчитывать layout
let cssWidth = 0
let cssHeight = 0

const resize = () => {
  const canvas = canvasRef.value
  if (!canvas || !gl) return
  const width = Math.max(1, Math.round(cssWidth * props.resolution))
  const height = Math.max(1, Math.round(cssHeight * props.resolution))
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
    gl.viewport(0, 0, width, height)
  }
}

const draw = (now = performance.now()) => {
  if (!gl) return
  resize()
  const canvas = canvasRef.value
  gl.uniform2f(uniforms.res, canvas.width, canvas.height)
  gl.uniform1f(uniforms.time, ((now - startedAt) / 1000) * 0.04 * props.speed)
  gl.uniform1f(uniforms.strength, props.strength)
  gl.uniform1f(uniforms.detail, props.detail)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

let lastDraw = 0

const loop = (now) => {
  frame = requestAnimationFrame(loop)
  if (now - lastDraw < 66) return // около 15 кадров в секунду: течение очень медленное (время идёт со скоростью 0.04)
  lastDraw = now
  draw(now)
}

onMounted(() => {
  const canvas = canvasRef.value
  gl = canvas.getContext('webgl', {antialias: false, alpha: false, powerPreference: 'low-power'})
  if (!gl) return // без WebGL остаётся просто белый фон

  const vertex = compile(gl.VERTEX_SHADER, vertexSource)
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource)
  if (!vertex || !fragment) return

  program = gl.createProgram()
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.useProgram(program)

  // Один треугольник на весь экран
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  uniforms = {
    res: gl.getUniformLocation(program, 'uRes'),
    time: gl.getUniformLocation(program, 'uTime'),
    strength: gl.getUniformLocation(program, 'uStrength'),
    detail: gl.getUniformLocation(program, 'uDetail'),
  }

  resizeObserver = new ResizeObserver(([entry]) => {
    cssWidth = entry.contentRect.width
    cssHeight = entry.contentRect.height
    draw()
  })
  resizeObserver.observe(canvas)

  // При «уменьшить движение» показываем один статичный кадр
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    draw()
  } else {
    frame = requestAnimationFrame(loop)
  }
})

onBeforeUnmount(() => {
  if (frame !== null) cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  gl = null
})
</script>
