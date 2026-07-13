<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'

const props = withDefaults(defineProps<{
  modelValue?: { lat: number; lng: number; name: string }
  height?: string
}>(), {
  modelValue: () => ({ lat: 0, lng: 0, name: '' }),
  height: '280px',
})

const emit = defineEmits<{
  'update:modelValue': [value: { lat: number; lng: number; name: string }]
}>()

const pickerContainer = ref<HTMLDivElement>()
const searchInput = ref('')
const addressName = ref(props.modelValue.name || '')
const selectedPos = ref<{ lat: number; lng: number } | null>(
  props.modelValue.lat ? { lat: props.modelValue.lat, lng: props.modelValue.lng } : null
)
const mapLoaded = ref(false)

let mapInstance: AMap.Map | null = null
let pickerMarker: AMap.Marker | null = null
let geocoder: AMap.Geocoder | null = null
let autoComplete: AMap.AutoComplete | null = null

async function init() {
  if (!pickerContainer.value || mapLoaded.value) return

  try {
    const AMap = await AMapLoader.load({
      key: import.meta.env.VITE_AMAP_API_KEY || '',
      version: import.meta.env.VITE_AMAP_API_VERSION || '2.0',
      plugins: ['AMap.Geocoder', 'AMap.AutoComplete', 'AMap.PlaceSearch'],
    })

    const defaultCenter: [number, number] = selectedPos.value
      ? [selectedPos.value.lng, selectedPos.value.lat]
      : [116.3974, 39.9092]

    mapInstance = new AMap.Map(pickerContainer.value, {
      center: defaultCenter,
      zoom: selectedPos.value ? 14 : 5,
      mapStyle: 'amap://styles/light',
    })

    geocoder = new AMap.Geocoder({})

    // 点击地图放置标记
    mapInstance!.on('click', async (e: any) => {
      const lng = (e as any).lnglat?.getLng()
      const lat = (e as any).lnglat?.getLat()
      if (!lng || !lat) return
      placeMarker(lng, lat)
    })

    // 如果已有位置，放置标记
    if (selectedPos.value) {
      placeMarker(selectedPos.value.lng, selectedPos.value.lat)
    }

    mapLoaded.value = true
  } catch (err) {
    console.error('MapPicker 加载失败:', err)
  }
}

async function placeMarker(lng: number, lat: number) {
  if (!mapInstance) return

  if (pickerMarker) {
    mapInstance.remove(pickerMarker)
    pickerMarker = null
  }

  selectedPos.value = { lat, lng }

  const AMap = window.AMap || (await import('@amap/amap-jsapi-loader')).default

  const markerContent = '<div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">📌</div>'
  pickerMarker = new (AMap as any).Marker({
    position: [lng, lat],
    content: markerContent,
    offset: new (AMap as any).Pixel(-14, -36),
  })
  if (pickerMarker) {
    pickerMarker.addTo(mapInstance)
  }

  // 反向地理编码
  if (geocoder) {
    geocoder.getAddress([lng, lat], (_status: string, result: any) => {
      if (result.regeocode) {
        addressName.value = result.regeocode.formattedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        emit('update:modelValue', { lat, lng, name: addressName.value })
      }
    })
  } else {
    addressName.value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    emit('update:modelValue', { lat, lng, name: addressName.value })
  }
}

async function handleSearch() {
  if (!searchInput.value || !mapInstance) return

  const AMap = window.AMap || (await import('@amap/amap-jsapi-loader')).default

  if (!autoComplete) {
    autoComplete = new (AMap as any).AutoComplete({ city: '全国' })
  }

  autoComplete!.search(searchInput.value, (_status: string, result: any) => {
    if (result.info === 'OK' && result.tips?.length > 0) {
      const tip = result.tips[0]
      if (tip.location) {
        mapInstance!.setCenter([tip.location.lng, tip.location.lat])
        mapInstance!.setZoom(14)
        placeMarker(tip.location.lng, tip.location.lat)
      }
    }
  })
}

watch(() => props.modelValue, (val) => {
  if (val.lat && val.lng && mapLoaded.value) {
    placeMarker(val.lng, val.lat)
  }
})

onMounted(() => nextTick(() => init()))
onUnmounted(() => {
  if (mapInstance) { mapInstance.destroy(); mapInstance = null }
})

import { nextTick } from 'vue'
</script>

<template>
  <div class="map-picker">
    <div class="picker-search">
      <input
        v-model="searchInput"
        type="text"
        placeholder="🔍 搜索地点..."
        @keyup.enter="handleSearch"
      />
      <button class="search-btn" @click="handleSearch">搜索</button>
    </div>
    <div ref="pickerContainer" class="picker-map" :style="{ height }"></div>
    <div v-if="!mapLoaded" class="picker-loading">🗺️ 加载中...</div>
    <div class="picker-info" v-if="addressName">
      <span class="picker-pin">📍</span>
      <span class="picker-addr">{{ addressName }}</span>
      <span v-if="selectedPos" class="picker-coord">
        {{ selectedPos.lat.toFixed(4) }}, {{ selectedPos.lng.toFixed(4) }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.map-picker {
  border: 2px solid var(--border-color, rgba(0,0,0,0.08));
  border-radius: var(--card-radius, 20px);
  overflow: hidden;
  background: white;
}

.picker-search {
  display: flex;
  padding: 10px;
  gap: 8px;
  border-bottom: 1px solid rgba(0,0,0,0.05);

  input {
    flex: 1;
    padding: 8px 14px;
    border: 2px solid rgba(0,0,0,0.08);
    border-radius: 20px;
    font-size: 13px;
    font-family: 'Nunito', 'Noto Sans SC', sans-serif;
    outline: none;
    &:focus { border-color: var(--primary-color, #FF6B8A); }
  }

  .search-btn {
    padding: 8px 16px;
    background: var(--primary-color, #FF6B8A);
    color: white;
    border: none;
    border-radius: 20px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  }
}

.picker-map {
  position: relative;
  min-height: 200px;
}

.picker-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.8);
  z-index: 10;
  font-size: 14px;
  color: #aaa;
}

.picker-info {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary, #666);
  border-top: 1px solid rgba(0,0,0,0.05);
  flex-wrap: wrap;

  .picker-pin { font-size: 16px; }
  .picker-addr { font-weight: 600; color: var(--text-primary, #333); }
  .picker-coord { font-size: 11px; color: #bbb; }
}
</style>
