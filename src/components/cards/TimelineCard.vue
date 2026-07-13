<script setup lang="ts">
import type { TimelineEvent } from '@/types'
import { computed } from 'vue'
import { formatDate } from '@/utils/format'

const props = defineProps<
  Omit<TimelineEvent, 'id' | 'travelId' | 'photoId' | 'location'> & {
    isLast: boolean
    collapsed: boolean
    eventId: string
    travelId: string
    photoId?: string
  }
>()

const emit = defineEmits<{ click: [event: TimelineEventLike] }>()

interface TimelineEventLike {
  id: string
  travelId: string
  photoId?: string
  type: 'flight' | 'arrival' | 'photo' | 'story' | 'achievement'
}

const formattedDate = computed(() => formatDate(props.date))

function handleClick() {
  emit('click', {
    id: props.eventId,
    travelId: props.travelId,
    photoId: props.photoId,
    type: props.type,
  })
}
</script>

<template>
  <div class="timeline-card" :class="[`type-${type}`, { collapsed }]" @click="handleClick">
    <div class="timeline-axis">
      <div class="axis-dot">{{ icon }}</div>
      <div v-if="!isLast" class="axis-line"></div>
    </div>

    <div class="timeline-content">
      <div class="content-row">
        <span class="content-date">{{ formattedDate }}</span>
        <h4 class="content-title">{{ title }}</h4>
      </div>
      <transition name="expand">
        <div v-if="!collapsed" class="content-expand">
          <p class="content-desc">{{ description }}</p>
          <div class="click-hint">点击查看详情 →</div>
        </div>
      </transition>
      <div class="content-badge">
        {{ type === 'achievement' ? '🏆' : type === 'flight' ? '✈️' : type === 'photo' ? '📸' : type === 'story' ? '📝' : '📍' }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.timeline-card {
  display: flex; gap: 14px; position: relative; cursor: pointer;

  &.collapsed .timeline-content { padding: 10px 16px; }
}

.timeline-axis {
  display: flex; flex-direction: column; align-items: center; flex-shrink: 0;
}

.axis-dot {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(255,255,255,0.9);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 2px solid rgba(0,0,0,0.06); z-index: 1;
  transition: transform 0.3s;
}

.axis-line {
  width: 3px; flex: 1; min-height: 20px;
  background: linear-gradient(to bottom, var(--primary-color), rgba(0,0,0,0.05));
  border-radius: 2px; margin-top: -2px;
}

.timeline-content {
  flex: 1; background: rgba(255,255,255,0.85); border-radius: 18px;
  padding: 14px 18px; margin-bottom: 16px; position: relative;
  border: 2px solid rgba(0,0,0,0.04);
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    border-color: var(--primary-color);
  }

  &::before {
    content: '';
    position: absolute; left: -8px; top: 16px;
    width: 0; height: 0;
    border-top: 7px solid transparent;
    border-bottom: 7px solid transparent;
    border-right: 7px solid white;
  }
}

.content-row { display: flex; align-items: center; gap: 10px; }

.content-date {
  font-size: 11px; color: #999; font-weight: 600;
  white-space: nowrap; flex-shrink: 0;
}

.content-title {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 15px; color: #333; margin: 0;
}

.content-expand { margin-top: 8px; }

.content-desc {
  font-size: 13px; color: #777; line-height: 1.6;
}

.click-hint {
  margin-top: 6px; font-size: 11px; color: var(--primary-color);
  opacity: 0; transition: opacity 0.3s;
  .timeline-card:hover & { opacity: 1; }
}

.content-badge {
  position: absolute; top: -8px; right: 10px;
  font-size: 20px;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
}

.type-flight .axis-dot { background: #e3f2fd; }
.type-arrival .axis-dot { background: #fce4ec; }
.type-photo .axis-dot { background: #fff3e0; }
.type-story .axis-dot { background: #e8f5e9; }
.type-achievement .axis-dot {
  background: linear-gradient(135deg, #ffd700, #ff9800);
  color: white; font-size: 20px;
}

.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; margin-top: 0; }
.expand-enter-to, .expand-leave-from { opacity: 1; max-height: 100px; }
</style>
