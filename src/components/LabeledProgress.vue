<template>
  <!-- Полоса прогресса с подписью внутри: на пустой части текст тёмный, на заполненной — белый -->
  <div
      class="relative h-5 rounded-full bg-stone-200 overflow-hidden"
      role="progressbar"
      :aria-valuenow="percent"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="label"
  >
    <!-- Тёмный текст на светлом фоне -->
    <span class="label text-stone-700">{{ label }}</span>

    <!-- Заполненная часть; белый текст внутри неё обрезается по её ширине, а сам текст растянут на всю полосу,
         поэтому оба слоя совпадают и цвет меняется ровно по границе заливки -->
    <div
        v-if="percent > 0"
        class="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
        :style="{width: `${percent}%`}"
    >
      <span class="label text-white" :style="{width: `${10000 / percent}%`}">{{ label }}</span>
    </div>
  </div>
</template>

<script setup>
import {computed} from 'vue'

const props = defineProps({
  // Значение от 0 до 100
  value: {type: Number, default: 0},
  label: {type: String, default: ''},
})

const percent = computed(() => Math.min(100, Math.max(0, Math.round(props.value || 0))))
</script>

<style scoped>
.label {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
</style>
