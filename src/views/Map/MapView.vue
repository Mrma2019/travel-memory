<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/stores/useTravelStore'
import { usePhotoStore } from '@/stores/usePhotoStore'
import WorldMap from '@/components/map/WorldMap.vue'
import CountryCard from '@/components/cards/CountryCard.vue'
import TravelForm from '@/components/travel/TravelForm.vue'

const travelStore = useTravelStore()
const photoStore = usePhotoStore()
const router = useRouter()
const showRoute = ref(false)
const loading = ref(true)
const isMapExpanded = ref(false)
const showAddTravel = ref(false)

onMounted(async () => {
  if (travelStore.travels.length === 0) await travelStore.fetchTravels()
  if (photoStore.photos.length === 0) await photoStore.fetchPhotos()
  loading.value = false

  window.addEventListener('travel-memory:open-photo', ((e: CustomEvent) => {
    router.push(`/album/${e.detail.id}`)
  }) as EventListener)
  window.addEventListener('travel-memory:open-album', ((e: CustomEvent) => {
    router.push(`/album?travelId=${e.detail.travelId}`)
  }) as EventListener)
})

function toggleRoute() { showRoute.value = !showRoute.value }
function toggleMapExpand() { isMapExpanded.value = !isMapExpanded.value }
function goToCountryPhotos(travelId: string) { router.push(`/album?travelId=${travelId}`) } function onTravelSaved() {
  showAddTravel.value = false
  travelStore.fetchTravels()
}
const recentTravels = computed(() => {
  return [...travelStore.travels]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 3)
})

import { computed } from 'vue'
</script>

<template>
  <div class="map-page">
    <div class="page-header">
      <h1 class="page-title">
        <span class="title-emoji">🗺️</span> 世界地图
      </h1>
      <div class="header-actions">
        <button class="route-btn" :class="{ active: showRoute }" @click="toggleRoute">
          <span>{{ showRoute ? '🔴' : '✈️' }}</span>
          {{ showRoute ? '隐藏路线' : '显示路线' }}
        </button>
      </div>
    </div>

    <!-- 地图区域 -->
    <div class="map-section">
      <div class="map-card cartoon-card" :class="{ expanded: isMapExpanded }">
        <WorldMap :travels="travelStore.travels" :photos="photoStore.photos" :center="{ lat: 20, lng: 40 }" :zoom="2"
          :show-route="showRoute" />
        <button class="map-expand-btn" @click="toggleMapExpand" :title="isMapExpanded ? '缩小地图' : '放大地图'">
          {{ isMapExpanded ? '🔎' : '🔍' }}
        </button>
      </div>
    </div>

    <!-- 路线说明 -->
    <div class="route-info" v-if="showRoute && !isMapExpanded">
      <div class="route-card cartoon-card">
        <div class="route-header">
          <span class="route-plane">✈️</span>
          <div>
            <h3>我的旅行路线</h3>
            <p>按时间顺序排列的旅行足迹</p>
          </div>
        </div>
        <div class="route-steps">
          <template v-for="(point, idx) in travelStore.routePoints" :key="idx">
            <div class="route-step" @click="goToCountryPhotos(travelStore.travels[idx]?.id || '')">
              <span class="step-num">{{ idx + 1 }}</span>
              <span class="step-name">{{ point.name }}</span>
              <span class="step-date">{{ point.date }}</span>
            </div>
            <span v-if="idx < travelStore.routePoints.length - 1" class="step-arrow">→</span>
          </template>
        </div>
      </div>
    </div>

    <!-- 最近旅行 -->
    <div v-if="!isMapExpanded" class="section">
      <div class="section-header">
        <h2 class="section-title">🕐 最近旅行</h2>
        <button class="view-all-btn" @click="router.push('/album')">查看全部 →</button>
      </div>
      <div class="countries-grid">
        <CountryCard v-for="t in recentTravels" :key="t.id" :id="t.id" :name="t.country"
          :emoji="{ JP: '🗾', FR: '🥐', TH: '🛕', IT: '🍕', CN: '🏮', AU: '🦘', US: '🗽', GB: '💂', DE: '🍺', ES: '💃' }[t.countryCode] || '🌍'"
          :country="t.country" :city="t.city" :start-date="t.startDate" :rating="t.rating"
          :photo-count="t.photos.length" @click="goToCountryPhotos(t.id)" />
      </div>
    </div>

    <!-- 新增旅行弹窗 -->
    <Teleport to="body">
      <div v-if="showAddTravel" class="modal-overlay" @click.self="showAddTravel = false">
        <div class="modal-card cartoon-card">
          <div class="modal-header">
            <h2>🧳 新增旅行</h2>
            <button @click="showAddTravel = false">✕</button>
          </div>
          <TravelForm @saved="onTravelSaved" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.map-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;

  @include mobile {
    padding: 16px;
    padding-bottom: 80px;
  }
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 28px;
  color: var(--text-primary);

  .title-emoji {
    animation: heartbeat 2s ease-in-out infinite;
    display: inline-block;
  }
}

@keyframes heartbeat {

  0%,
  100% {
    transform: scale(1)
  }

  25% {
    transform: scale(1.12)
  }

  50% {
    transform: scale(1)
  }

  75% {
    transform: scale(1.12)
  }
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.add-travel-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #4CAF50, #8BC34A);
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(76, 175, 80, 0.3);
  }
}

.route-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: 2px solid var(--border-color);
  border-radius: 24px;
  background: var(--card-bg);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  color: var(--text-primary);

  &:hover {
    transform: translateY(-2px);
  }

  &.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
}

.map-section {
  margin-bottom: 28px;
}

.map-card {
  height: 500px;
  overflow: hidden;
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &.expanded {
    position: fixed;
    top: 0;
    left: 240px;
    right: 0;
    bottom: 0;
    height: auto;
    z-index: 150;
    border-radius: 0;
  }

  @include mobile {
    height: 350px;

    &.expanded {
      left: 0;
      bottom: 64px;
    }
  }
}

.map-expand-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid var(--border-color);
  font-size: 18px;
  cursor: pointer;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
  }
}

.section {
  margin-bottom: 28px;
}

.section-title {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.view-all-btn {
  background: none;
  border: none;
  font-size: 13px;
  color: var(--primary-color);
  cursor: pointer;
  font-weight: 600;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    text-decoration: underline
  }
}

.countries-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;

  @include tablet {
    grid-template-columns: repeat(2, 1fr);
  }

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.route-info {
  margin-bottom: 28px;
}

.route-card {
  padding: 20px;
}

.route-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  .route-plane {
    font-size: 32px;
    animation: plane-bob 2s ease-in-out infinite;
  }

  h3 {
    font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
    font-size: 16px;
    color: var(--text-primary);
  }

  p {
    font-size: 12px;
    color: var(--text-secondary);
  }
}

@keyframes plane-bob {

  0%,
  100% {
    transform: translateY(0)
  }

  50% {
    transform: translateY(-5px)
  }
}

.route-steps {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.route-step {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--primary-color);
    color: white;
  }

  .step-num {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--primary-color);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
  }

  .step-name {
    font-weight: 600;
    color: var(--text-primary);
  }

  .step-date {
    color: var(--text-secondary);
  }
}

.step-arrow {
  font-size: 18px;
  color: #ccc;
}
</style>
