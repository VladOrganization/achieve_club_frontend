<template>
  <!-- Размер задаётся родителем (w-full h-full); буквы масштабируются вместе с блоком -->
  <div class="user-avatar w-full h-full relative overflow-hidden select-none">
    <img
        v-if="src && !failed"
        :src="src"
        :alt="alt || fullName"
        class="w-full h-full object-cover"
        @error="failed = true"
    />
    <div
        v-else
        class="w-full h-full flex items-center justify-center font-bold text-white tracking-wide"
        :style="{background: gradient}"
        role="img"
        :aria-label="alt || fullName"
    >
      <span class="user-avatar-initials">{{ initials }}</span>
    </div>
  </div>
</template>

<script setup>
import {computed, ref, watch} from 'vue'

const props = defineProps({
  // Готовая ссылка на аватарку (если пусто — рисуем сгенерированную)
  src: {type: String, default: ''},
  firstName: {type: String, default: ''},
  lastName: {type: String, default: ''},
  alt: {type: String, default: ''},
})

const failed = ref(false)
watch(() => props.src, () => {
  failed.value = false
})

const fullName = computed(() => `${props.firstName} ${props.lastName}`.trim())

// Две первые буквы: первая буква имени и первая буква фамилии
const initials = computed(() => {
  const first = props.firstName.trim().charAt(0)
  const last = props.lastName.trim().charAt(0)
  return (first + last).toUpperCase() || '?'
})

// Цвет зависит от первой буквы имени. Оттенки приглушённые и тёплые, в гамме логотипа ByteSchool
// (терракота, глина, песок, охра), чтобы аватарки различались, но не кричали и не выбивались из темы приложения.
const palette = [
  ['#d9936a', '#c27a50'], // терракота
  ['#d6a066', '#bd864a'], // глина
  ['#d4ab78', '#bb925c'], // песок
  ['#cfb27a', '#b79a5e'], // охра
  ['#d49a86', '#bb806c'], // пыльный коралл
  ['#c98f80', '#b07466'], // тёплая роза
  ['#c9a083', '#af866a'], // латте
  ['#bf9470', '#a57a56'], // карамель
  ['#d0a577', '#b78b5d'], // медовый
  ['#c8998a', '#ae7f70'], // какао-роза
  ['#c7a66f', '#ad8b55'], // горчичный
  ['#cc9873', '#b27e59'], // тёплая медь
]

const gradient = computed(() => {
  const letter = props.firstName.trim().charAt(0).toLowerCase()
  // Кириллица и латиница раскладываются по палитре по номеру буквы в алфавите
  let index = letter ? letter.charCodeAt(0) : 0
  if (index >= 0x430 && index <= 0x44f) index -= 0x430 // а..я
  else if (index === 0x451) index = 6 // ё
  const [from, to] = palette[index % palette.length]
  return `linear-gradient(135deg, ${from}, ${to})`
})
</script>

<style scoped>
.user-avatar {
  container-type: size;
}

/* Размер букв — доля от стороны блока, поэтому одинаково смотрится и в маленьком кружке, и в большой карточке */
.user-avatar-initials {
  font-size: 38cqmin;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.22);
}
</style>
