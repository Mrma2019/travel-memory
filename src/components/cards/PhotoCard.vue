<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { randomGradient } from '@/utils/format'

const props = defineProps<{
  id: string
  title: string
  location: string
  url: string
  thumbnailUrl: string
  date: string
  selectable?: boolean
  selected?: boolean
  showDelete?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  'delete': [id: string]
  'click': [id: string]
}>()

const router = useRouter()
const fallbackBg = computed(() => randomGradient())
const hasImage = computed(() => !!(props.url || props.thumbnailUrl))

function toDetail() {
  if (props.selectable) {
    emit('select', props.id)
    return
  }
  emit('click', props.id)
  router.push(`/album/${props.id}`)
}

function onDelete(e: Event) {
  e.stopPropagation()
  emit('delete', props.id)
}
</script>

<template>
  <div class="photo-card" :class="{ 'select-mode': selectable, 'is-selected': selected }" @click="toDetail">
    <!-- 选择框 -->
    <div v-if="selectable" class="select-check" :class="{ checked: selected }">
      <span v-if="selected">✓</span>
    </div>
    <!-- 删除按钮（hover显示） -->
    <button v-if="showDelete && !selectable" class="delete-single" title="删除照片" @click="onDelete">🗑️</button>
    <div class="photo-frame">
      <!-- 拍立得效果 -->
      <div class="polaroid-inner" :style="hasImage ? '' : { background: fallbackBg }">
        <img v-if="hasImage" :src="thumbnailUrl || url" :alt="title" loading="lazy" />
        <span v-else class="photo-placeholder">📷</span>
      </div>
      <!-- 底部文字 -->
      <div class="photo-caption">
        <span class="caption-title">{{ title }}</span>
        <span class="caption-location">📍 {{ location }}</span>
      </div>
    </div>
    <!-- 邮票角标 -->
    <div class="stamp-corner">
      <span>📮</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.photo-card {
  position: relative;
  cursor: pointer;
  break-inside: avoid;
  margin-bottom: 20px;
  transition: all $transition-spring;

  &:hover {
    transform: rotate(0deg) scale(1.03) !important;

    .stamp-corner {
      transform: rotate(0deg) scale(1.1);
    }

    .delete-single {
      opacity: 1;
      pointer-events: auto;
    }
  }

  // 交替旋转
  transform: rotate(-1.5deg);

  &:nth-child(even) {
    transform: rotate(1.5deg);
  }

  &.select-mode {
    transform: none !important;
    &:nth-child(even) { transform: none !important; }
  }

  &.is-selected {
    .photo-frame {
      outline: 3px solid var(--primary-color);
      outline-offset: 2px;
      border-radius: 6px;
    }
  }
}

.delete-single {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #ff6b6b;
    color: white;
    border-color: #ff6b6b;
    transform: scale(1.1);
  }
}

.select-check {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.2);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.2s;

  &.checked {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
  }
}

.photo-frame {
  background: white;
  padding: 10px 10px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  transition: outline 0.2s;
}

.polaroid-inner {
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .photo-placeholder {
    font-size: 48px;
    opacity: 0.5;
  }
}

.photo-caption {
  padding-top: 10px;
  text-align: center;

  .caption-title {
    display: block;
    font-family: $font-handwrite;
    font-size: 16px;
    color: #555;
    line-height: 1.3;
  }
  .caption-location {
    display: block;
    font-size: 11px;
    color: #aaa;
    margin-top: 2px;
  }
}

.stamp-corner {
  position: absolute;
  top: -8px;
  right: 8px;
  font-size: 28px;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.15));
  transition: transform 0.3s;
  transform: rotate(10deg);
}
</style>
