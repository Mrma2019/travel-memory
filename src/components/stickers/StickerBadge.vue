<script setup lang="ts">
defineProps<{ text: string; achieved?: boolean }>()
</script>

<template>
  <div class="sticker-badge" :class="{ achieved }">
    <div class="badge-ribbon">
      <span class="badge-icon">{{ achieved ? '🎖️' : '🔒' }}</span>
    </div>
    <span class="badge-text">{{ text }}</span>
  </div>
</template>

<style lang="scss" scoped>
.sticker-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  opacity: 0.5;
  transition: all 0.3s;

  &.achieved {
    opacity: 1;

    .badge-ribbon {
      background: linear-gradient(135deg, #ffd700, #ff9800);
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
    }
  }

  &:hover {
    transform: translateY(-4px);
  }
}

.badge-ribbon {
  width: 56px;
  height: 64px;
  background: #ccc;
  border-radius: 8px 8px 12px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  clip-path: polygon(50% 100%, 0 85%, 0 0, 100% 0, 100% 85%);
}

.badge-icon {
  font-size: 26px;
}

.badge-text {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-align: center;
  font-family: $font-title;
}
</style>
