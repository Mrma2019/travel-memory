<script setup lang="ts">
const props = defineProps<{
  id: string
  name: string
  emoji: string
  country: string
  city: string
  startDate: string
  rating: number
  photoCount: number
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <div class="country-card" @click="emit('click')">
    <div class="card-emoji">{{ emoji }}</div>
    <div class="card-info">
      <h4 class="card-name">{{ name }}</h4>
      <p class="card-location">📍 {{ country }} · {{ city }}</p>
      <div class="card-meta">
        <span>📷 {{ photoCount }}张</span>
        <span class="card-rating">
          <template v-for="i in 5" :key="i">
            {{ i <= rating ? '⭐' : '☆' }}
          </template>
        </span>
      </div>
    </div>
    <div class="card-sticker">📮</div>
  </div>
</template>

<style lang="scss" scoped>
.country-card {
  background: var(--card-bg);
  border-radius: var(--card-radius, 20px);
  padding: 16px;
  display: flex; align-items: center; gap: 14px;
  cursor: pointer;
  border: 2px solid var(--border-color);
  box-shadow: var(--card-shadow);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative; overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.1);
    .card-sticker { transform: rotate(0deg) scale(1.15); }
  }

  &::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 3px; background: var(--primary-color, #FF6B8A);
    opacity: 0.4;
    border-radius: 0 0 var(--card-radius) var(--card-radius);
  }
}

.card-emoji { font-size: 40px; flex-shrink: 0; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
.card-info { flex: 1; min-width: 0; }

.card-name {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 15px; color: var(--text-primary); margin-bottom: 2px;
}

.card-location { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }

.card-meta {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: var(--text-secondary);
  .card-rating { font-size: 10px; }
}

.card-sticker {
  position: absolute; top: -4px; right: 8px;
  font-size: 24px; transform: rotate(12deg); transition: transform 0.3s;
}
</style>
