<script setup lang="ts">
defineProps<{ icon: string; label: string; rotation?: number; active?: boolean }>()
</script>

<template>
  <div
    class="sticker-stamp"
    :class="{ 'stamp-active': active }"
    :style="{ transform: `rotate(${rotation || -3}deg)` }"
  >
    <div class="stamp-body">
      <span class="stamp-emoji">{{ icon }}</span>
      <span class="stamp-label">{{ label }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sticker-stamp {
  display: inline-block;
  transition: transform $transition-spring, filter 0.2s;
  cursor: pointer;

  &:hover {
    transform: rotate(0deg) scale(1.15) !important;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
  }

  &.stamp-active {
    .stamp-body {
      border-color: var(--primary-color, #FF6B8A);
      background: rgba(255,255,255,1);
    }
    .stamp-label { color: var(--primary-color, #FF6B8A); }
  }
}

.stamp-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.9);
  border: 3px dashed #d4a574;
  border-radius: $radius-stamp;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.08));
  transition: border-color 0.3s, background 0.3s;
}

.stamp-emoji { font-size: 24px; }
.stamp-label {
  font-size: 10px;
  font-weight: 700;
  color: #8b4513;
  font-family: $font-title;
  transition: color 0.3s;
}
</style>
