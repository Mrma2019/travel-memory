<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { Travel, Photo } from '@/types'
import AMapLoader from '@amap/amap-jsapi-loader'

const props = withDefaults(defineProps<{
  travels: Travel[]
  photos?: Photo[]
  center?: { lat: number; lng: number }
  zoom?: number
  showRoute?: boolean
  height?: string
}>(), {
  photos: () => [],
  center: () => ({ lat: 30, lng: 40 }),
  zoom: 2,
  showRoute: false,
  height: '100%',
})

const mapContainer = ref<HTMLDivElement>()
let mapInstance: AMap.Map | null = null
let AMapClass: any = null
const markers: AMap.Marker[] = []
let polyline: AMap.Polyline | null = null
const mapLoaded = ref(false)
const mapError = ref(false)

const countryEmojis: Record<string, string> = {
  JP: '🗾', FR: '🥐', TH: '🛕', IT: '🍕', CN: '🏮', AU: '🦘', US: '🗽', GB: '💂', DE: '🍺', ES: '💃',
}

function getMarkerContent(travel: Travel): string {
  const emoji = countryEmojis[travel.countryCode] || '📍'
  return `<div style="font-size:32px;filter:drop-shadow(0 3px 5px rgba(0,0,0,0.35));cursor:pointer;">${emoji}</div>`
}

function buildPopupHtml(travel: Travel): string {
  const nearbyPhotos = props.photos?.filter((p) => {
    if (!p.location.lat || !p.location.lng) return false
    const dLat = (p.location.lat - travel.lat) * 111
    const dLng = (p.location.lng - travel.lng) * 111 * Math.cos((travel.lat * Math.PI) / 180)
    return Math.sqrt(dLat * dLat + dLng * dLng) <= 50
  }) || []

  const photosHtml = nearbyPhotos.length > 0
    ? `<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">${nearbyPhotos.slice(0, 4).map((p) =>
        `<div style="width:60px;height:60px;border-radius:8px;overflow:hidden;border:2px solid rgba(0,0,0,0.06);cursor:pointer;" data-photo-id="${p.id}" class="popup-photo-thumb">
           ${p.thumbnailUrl ? `<img src="${p.thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;" />` : '<div style="width:100%;height:100%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:20px;">📷</div>'}
         </div>`).join('')}
         ${nearbyPhotos.length > 4 ? `<span style="font-size:11px;color:#999;align-self:center;">+${nearbyPhotos.length - 4}张</span>` : ''}
       </div>`
    : ''

  return `
    <div style="min-width:200px;max-width:300px;padding:14px;font-family:'Nunito','Noto Sans SC',sans-serif;background:#ffffff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.15);border:1px solid rgba(0,0,0,0.06);">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="font-size:18px">📍</span>
        <h4 style="margin:0;font-size:15px;color:#222;font-family:'Fredoka One',cursive">${travel.title}</h4>
      </div>
      <p style="font-size:12px;color:#666;margin-bottom:6px">${travel.country} · ${travel.city}</p>
      <div style="display:flex;gap:12px;font-size:11px;color:#888;margin-bottom:6px">
        <span>📅 ${travel.startDate}</span>
        <span>📷 ${travel.photos.length}张照片</span>
      </div>
      <p style="font-size:12px;color:#555;line-height:1.6;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${travel.story}</p>
      ${photosHtml}
    </div>
  `
}

async function initMap() {
  if (!mapContainer.value || mapLoaded.value) return

  try {
    const AMap = await AMapLoader.load({
      key: import.meta.env.VITE_AMAP_API_KEY || '',
      version: import.meta.env.VITE_AMAP_API_VERSION || '2.0',
    })
    AMapClass = AMap

    mapInstance = new AMap.Map(mapContainer.value, {
      center: [props.center.lng, props.center.lat],
      zoom: props.zoom,
      mapStyle: 'amap://styles/light',
      features: ['bg', 'road', 'building', 'point'],
    })

    // 注册全局回调
    ;(window as any).__openPhoto = (id: string) => {
      window.dispatchEvent(new CustomEvent('travel-memory:open-photo', { detail: { id } }))
    }
    ;(window as any).__openAlbum = (travelId: string) => {
      window.dispatchEvent(new CustomEvent('travel-memory:open-album', { detail: { travelId } }))
    }

    mapLoaded.value = true
    addMarkers()
    if (props.showRoute) drawRoute()
  } catch (err) {
    console.error('高德地图加载失败:', err)
    mapError.value = true
  }
}

function addMarkers() {
  if (!mapInstance || !AMapClass) return
  markers.forEach((m) => { try { mapInstance!.remove(m) } catch { /* ignore */ } })
  markers.length = 0

  props.travels.forEach((t) => {
    if (!t.lat || !t.lng) return

    const marker = new AMapClass.Marker({
      position: [t.lng, t.lat],
      content: getMarkerContent(t),
      offset: new AMapClass.Pixel(-16, -40),
    })

    const infoWindow = new AMapClass.InfoWindow({
      content: buildPopupHtml(t),
      offset: new AMapClass.Pixel(0, -42),
      isCustom: true,
    })

    marker.on('click', () => {
      infoWindow.open(mapInstance!, marker.getPosition())

      // 给弹出窗口中的缩略图绑定点击事件
      setTimeout(() => {
        const thumbs = document.querySelectorAll('.popup-photo-thumb')
        thumbs.forEach((el) => {
          const photoId = el.getAttribute('data-photo-id')
          if (photoId && !(el as HTMLElement).dataset.bound) {
            (el as HTMLElement).dataset.bound = '1'
            el.addEventListener('click', () => {
              ;(window as any).__openPhoto?.(photoId)
            })
          }
        })
      }, 100)
    })

    marker.addTo(mapInstance!)
    markers.push(marker)
  })
}

function drawRoute() {
  if (!mapInstance || !AMapClass) return
  if (polyline) { try { mapInstance.remove(polyline) } catch { /* ignore */ }; polyline = null }
  if (!props.showRoute) return

  const points = props.travels
    .filter((t) => t.lat && t.lng)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .map((t) => [t.lng, t.lat] as [number, number])

  if (points.length < 2) return

  try {
    polyline = new AMapClass.Polyline({
      path: points,
      strokeColor: '#FF6B6B',
      strokeWeight: 3,
      strokeStyle: 'dashed',
      strokeOpacity: 0.7,
      lineJoin: 'round',
    })
    polyline!.addTo(mapInstance)
    // 不再调用 setFitView() ——这是导致卡死的根因
  } catch (err) {
    console.error('绘制路线失败:', err)
  }
}

watch(() => props.travels, () => {
  if (mapLoaded.value) {
    addMarkers()
    if (props.showRoute) drawRoute()
  }
}, { deep: true })

watch(() => props.showRoute, () => {
  if (mapLoaded.value) drawRoute()
})

onMounted(() => nextTick(() => initMap()))

onUnmounted(() => {
  delete (window as any).__openPhoto
  delete (window as any).__openAlbum
  if (mapInstance) {
    try { mapInstance.destroy() } catch { /* ignore */ }
    mapInstance = null
  }
})
</script>

<template>
  <div class="world-map-wrapper" :style="{ height }">
    <div ref="mapContainer" class="map-container"></div>
    <div v-if="!mapLoaded && !mapError" class="map-loading">
      <span>🗺️ 地图加载中...</span>
    </div>
    <div v-if="mapError" class="map-error">
      <span>😢 地图加载失败，请检查API Key</span>
    </div>
    <div class="map-cloud cloud-1">☁️</div>
    <div class="map-cloud cloud-2">☁️</div>
  </div>
</template>

<style lang="scss" scoped>
.world-map-wrapper {
  position: relative;
  width: 100%;
  border-radius: var(--card-radius, 20px);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  min-height: 250px;
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-loading, .map-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.9);
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 18px;
  color: #aaa;
  z-index: 100;
}
.map-error { color: #e74c3c; }

.map-cloud {
  position: absolute;
  pointer-events: none;
  font-size: 48px;
  opacity: 0.2;
  z-index: 50;
  animation: cloud-float 8s ease-in-out infinite;
}

.cloud-1 { top: 10px; right: 20px; }
.cloud-2 { bottom: 30px; left: 10px; animation-duration: 12s; animation-delay: -3s; }

@keyframes cloud-float {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(25px); }
}
</style>
