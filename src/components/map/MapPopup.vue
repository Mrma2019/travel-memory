<script setup lang="ts">
import { computed } from 'vue'
import { formatDate } from '@/utils/format'

const props = defineProps<{
  title: string
  description: string
  photoCount: number
  travelDate: string
  locationName: string
}>()

const displayDate = computed(() => formatDate(props.travelDate))
</script>

<template>
  <div class="map-popup">
    <div class="popup-header">
      <span class="popup-pin">📍</span>
      <h4>{{ title }}</h4>
    </div>
    <p class="popup-location">{{ locationName }}</p>
    <div class="popup-meta">
      <span>📅 {{ displayDate }}</span>
      <span>📷 {{ photoCount }}张照片</span>
    </div>
    <p class="popup-desc">{{ description }}</p>
  </div>
</template>

<style lang="scss" scoped>
.map-popup {
  min-width: 180px;
  padding: 4px;
}

.popup-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;

  h4 {
    font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
    font-size: 14px;
    color: #333;
    margin: 0;
  }
  .popup-pin { font-size: 16px; }
}

.popup-location {
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
}

.popup-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #aaa;
  margin-bottom: 6px;
}

.popup-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
