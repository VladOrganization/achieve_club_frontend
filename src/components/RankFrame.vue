<template>
  <!-- Рамка вокруг аватарки для первых мест: 1 — алмазная, 2 — золотая, 3 — серебряная, 4 — бронзовая -->
  <div
      class="rank-frame box-border"
      :class="rank ? `rank-${rank}` : plainClass"
      :style="{padding: rank || reserve ? `${thickness}px` : '0'}"
  >
    <slot/>
  </div>
</template>

<script setup>
defineProps({
  // Место в топе: 1–4, 0 — без выделения
  rank: {type: Number, default: 0},
  // Толщина рамки в пикселях
  thickness: {type: Number, default: 3},
  // Оставлять место под рамку, даже если места нет (например, чтобы сохранить белую обводку)
  reserve: {type: Boolean, default: false},
  // Классы рамки, когда места нет
  plainClass: {type: String, default: ''},
})
</script>

<style scoped>
.rank-1,
.rank-2,
.rank-3,
.rank-4 {
  background-size: 300% 300%;
  animation: rank-shine 6s ease-in-out infinite;
}

/* Алмаз: ледяной голубой с бликами и мягким свечением */
.rank-1 {
  background-image: linear-gradient(135deg, #6fe0ff 0%, #ffffff 18%, #36b0ff 38%, #c4a2ff 58%, #ffffff 78%, #6fe0ff 100%);
  box-shadow: 0 0 14px rgba(54, 176, 255, 0.75), 0 0 4px rgba(255, 255, 255, 0.9);
}

.rank-2 {
  background-image: linear-gradient(135deg, #fff2a8 0%, #f5c542 30%, #b8860b 55%, #ffe27a 80%, #f5c542 100%);
  box-shadow: 0 0 14px rgba(255, 196, 40, 0.8), 0 0 4px rgba(255, 238, 160, 0.9);
}

.rank-3 {
  background-image: linear-gradient(135deg, #eef2f7 0%, #9aa6b8 25%, #5f6b7d 50%, #d9dfe8 75%, #8591a4 100%);
  box-shadow: 0 0 14px rgba(110, 125, 150, 0.8), 0 0 4px rgba(210, 220, 235, 0.95);
}

.rank-4 {
  background-image: linear-gradient(135deg, #f7c99a 0%, #e09550 30%, #c47a3a 55%, #f0b47a 80%, #dc9048 100%);
  box-shadow: 0 0 14px rgba(224, 136, 56, 0.8), 0 0 4px rgba(255, 196, 140, 0.85);
}

@keyframes rank-shine {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .rank-1, .rank-2, .rank-3, .rank-4 {
    animation: none;
  }
}
</style>
