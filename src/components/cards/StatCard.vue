<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  label: string
  value: number
  icon: string
  color: string
  unit: string
}>()

const displayValue = ref(0)

// 数字滚动动画
onMounted(() => {
  const target = props.value
  if (target === 0) return

  const duration = 1000
  const steps = 40
  const increment = target / steps
  let current = 0
  const timer = setInterval(() => {
    current += increment
    if (current >= target) {
      displayValue.value = target
      clearInterval(timer)
    } else {
      displayValue.value = Math.floor(current)
    }
  }, duration / steps)
})
</script>

<template>
  <div class="stat-card" :style="{ '--card-color': color }">
    <div class="stat-bg-glow"></div>
    <div class="stat-header">
      <span class="stat-icon">{{ icon }}</span>
      <span class="stat-label">{{ label }}</span>
    </div>
    <div class="stat-body">
      <span class="stat-value">{{ displayValue }}</span>
      <span class="stat-unit">{{ unit }}</span>
    </div>
    <div class="stat-footer">
      <span class="stat-badge">✦</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stat-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: $radius-lg;
  padding: 20px;
  position: relative;
  overflow: hidden;
  border: 2px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: all $transition-smooth;
  cursor: default;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);

    .stat-icon {
      animation: heartbeat 0.6s ease;
    }
  }

  .stat-bg-glow {
    position: absolute;
    top: -20px;
    right: -20px;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--card-color);
    opacity: 0.08;
    pointer-events: none;
  }
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-icon {
  font-size: 24px;
  transition: transform 0.3s;
}

.stat-label {
  font-size: 13px;
  color: #888;
  font-weight: 600;
}

.stat-body {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-value {
  font-family: $font-title;
  font-size: 36px;
  font-weight: 800;
  color: var(--card-color);
  line-height: 1;
}

.stat-unit {
  font-size: 14px;
  color: #aaa;
  font-weight: 600;
}

.stat-footer {
  margin-top: 8px;

  .stat-badge {
    font-size: 12px;
    color: var(--card-color);
    opacity: 0.5;
  }
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.15); }
  50% { transform: scale(1); }
  75% { transform: scale(1.15); }
}
</style>
