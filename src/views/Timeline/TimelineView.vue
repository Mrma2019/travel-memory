<script setup lang="ts">
defineOptions({ name: 'TimelineView' })
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTravelStore } from '@/stores/useTravelStore'
import TimelineCard from '@/components/cards/TimelineCard.vue'
import StickerStamp from '@/components/stickers/StickerStamp.vue'

type EventFilter = 'all' | 'flight' | 'photo' | 'story' | 'achievement'

const router = useRouter()
const travelStore = useTravelStore()
const loading = ref(true)
const activeFilter = ref<EventFilter>('all')

const collapsedYears = ref<Set<string>>(new Set())
const collapsedMonths = ref<Set<string>>(new Set())

// 筛选后的数据
const filteredTimeline = computed(() => {
  if (activeFilter.value === 'all') return travelStore.timeline
  return travelStore.timeline.filter((e) => e.type === activeFilter.value)
})

const groupedEvents = computed(() => {
  const groups: Record<string, { months: Record<string, typeof travelStore.timeline> }> = {}
  const sorted = [...filteredTimeline.value].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  sorted.forEach((event) => {
    const d = new Date(event.date)
    const year = d.getFullYear().toString()
    const month = d.getMonth() + 1
    if (!groups[year]) groups[year] = { months: {} }
    const monthKey = `${year}-${String(month).padStart(2, '0')}`
    if (!groups[year].months[monthKey]) groups[year].months[monthKey] = []
    groups[year].months[monthKey].push(event)
  })
  return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a))
})

function setFilter(type: EventFilter) {
  if (activeFilter.value === type) {
    activeFilter.value = 'all'
  } else {
    activeFilter.value = type
  }
}

function toggleYear(year: string) {
  if (collapsedYears.value.has(year)) {
    collapsedYears.value.delete(year)
  } else {
    collapsedYears.value.add(year)
  }
}

function toggleMonth(key: string) {
  if (collapsedMonths.value.has(key)) {
    collapsedMonths.value.delete(key)
  } else {
    collapsedMonths.value.add(key)
  }
}

function expandAll() {
  collapsedYears.value.clear()
  collapsedMonths.value.clear()
}

function collapseAll() {
  groupedEvents.value.forEach(([year]) => collapsedYears.value.add(year))
  groupedEvents.value.forEach(([_, data]) => {
    Object.keys(data.months).forEach((mk) => collapsedMonths.value.add(mk))
  })
}

function isYearCollapsed(year: string) { return collapsedYears.value.has(year) }
function isMonthCollapsed(key: string) { return collapsedMonths.value.has(key) }

const monthLabels: Record<string, string> = {
  '01': '一月', '02': '二月', '03': '三月', '04': '四月',
  '05': '五月', '06': '六月', '07': '七月', '08': '八月',
  '09': '九月', '10': '十月', '11': '十一月', '12': '十二月',
}

const filterLabels: { type: EventFilter; icon: string; label: string }[] = [
  { type: 'all', icon: '📋', label: '全部' },
  { type: 'flight', icon: '✈️', label: '飞行' },
  { type: 'photo', icon: '📸', label: '照片' },
  { type: 'story', icon: '📝', label: '故事' },
  { type: 'achievement', icon: '🏆', label: '成就' },
]

const eventCounts = computed(() => ({
  flights: travelStore.timeline.filter((e) => e.type === 'flight').length,
  photos: travelStore.timeline.filter((e) => e.type === 'photo').length,
  stories: travelStore.timeline.filter((e) => e.type === 'story').length,
  achievements: travelStore.timeline.filter((e) => e.type === 'achievement').length,
}))

onMounted(async () => {
  if (travelStore.timeline.length === 0) await travelStore.fetchTravels()
  loading.value = false
})

function handleEventClick(event: { id: string; travelId: string; photoId?: string; type: string }) {
  switch (event.type) {
    case 'photo':
      if (event.photoId) router.push(`/album/${event.photoId}`)
      break
    case 'story':
      if (event.photoId) router.push(`/album/${event.photoId}/story`)
      break
    case 'flight':
    case 'arrival':
      if (event.travelId) router.push(`/album?travelId=${event.travelId}`)
      break
    case 'achievement':
      // 成就无详情
      break
  }
}
</script>

<template>
  <div class="timeline-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          <span class="title-emoji">⏳</span> 旅行时间轴
        </h1>
        <p class="page-subtitle">记录每一次旅程的点滴 ✨</p>
      </div>
      <div class="header-stamps">
        <StickerStamp
          v-for="f in filterLabels.filter((f) => f.type !== 'all')"
          :key="f.type"
          :icon="f.icon"
          :label="f.label"
          :rotation="f.type === 'flight' ? -5 : f.type === 'photo' ? 3 : -2"
          :active="activeFilter === f.type"
          @click="setFilter(f.type)"
        />
      </div>
    </div>

    <div class="plane-trail">
      <span class="trail">· · · · · · · · · · · ·</span>
      <span class="plane">✈️</span>
    </div>

    <!-- 筛选活跃提示 -->
    <div v-if="activeFilter !== 'all'" class="filter-active-bar">
      <span>当前筛选：{{ filterLabels.find((f) => f.type === activeFilter)?.icon }} {{ filterLabels.find((f) => f.type === activeFilter)?.label }}</span>
      <button @click="activeFilter = 'all'">✕ 清除筛选</button>
    </div>

    <!-- 折叠控制 -->
    <div class="timeline-controls">
      <button @click="expandAll">📖 全部展开</button>
      <button @click="collapseAll">📕 全部折叠</button>
    </div>

    <!-- 时间轴 -->
    <div v-if="!loading && groupedEvents.length > 0" class="timeline">
      <div v-for="[year, data] in groupedEvents" :key="year" class="year-group">
        <div class="year-header" @click="toggleYear(year)">
          <div class="year-stamp">
            <span class="year-num">{{ year }}</span>
            <span class="year-toggle">{{ isYearCollapsed(year) ? '▶' : '▼' }}</span>
          </div>
          <div class="year-line"></div>
          <span class="year-count">{{ Object.values(data.months).flat().length }} 事件</span>
        </div>

        <div v-if="!isYearCollapsed(year)" class="year-content">
          <div
            v-for="[monthKey, events] in Object.entries(data.months).sort(([a], [b]) => b.localeCompare(a))"
            :key="monthKey"
            class="month-group"
          >
            <div
              v-if="events.length >= 3"
              class="month-header"
              @click="toggleMonth(monthKey)"
            >
              <span class="month-toggle">{{ isMonthCollapsed(monthKey) ? '▶' : '▼' }}</span>
              <span class="month-label">{{ monthLabels[monthKey.slice(5)] || monthKey }}</span>
              <span class="month-count">{{ events.length }}件事</span>
              <div class="month-line"></div>
            </div>

            <div v-if="!isMonthCollapsed(monthKey) || events.length < 3" class="events-list">
              <TimelineCard
                v-for="(event, idx) in events"
                :key="event.id"
                :type="event.type"
                :date="event.date"
                :title="event.title"
                :description="event.description"
                :icon="event.icon"
                :is-last="idx === events.length - 1"
                :collapsed="false"
                :event-id="event.id"
                :travel-id="event.travelId"
                :photo-id="event.photoId"
                @click="handleEventClick"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loading && activeFilter !== 'all'" class="empty-filter">
      <span>🔍 没有找到"{{ filterLabels.find((f) => f.type === activeFilter)?.label }}"类型的事件</span>
    </div>

    <!-- 统计（可点击筛选） -->
    <div class="timeline-stats">
      <div
        v-for="f in filterLabels.filter((f) => f.type !== 'all')"
        :key="f.type"
        class="stat-item"
        :class="{ 'stat-active': activeFilter === f.type }"
        @click="setFilter(f.type)"
      >
        <span class="stat-num">{{ eventCounts[f.type === 'flight' ? 'flights' : f.type === 'photo' ? 'photos' : f.type === 'story' ? 'stories' : 'achievements'] }}</span>
        <span class="stat-label">{{ f.icon }} {{ f.label }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <span>⏳ 加载时间轴...</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.timeline-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  @include mobile { padding: 16px; padding-bottom: 80px; }
}

.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 8px; flex-wrap: wrap; gap: 12px;
}

.page-title {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 28px; color: var(--text-primary);
  .title-emoji { display: inline-block; animation: heartbeat 2s ease-in-out infinite; }
}

@keyframes heartbeat { 0%,100%{transform:scale(1)} 25%{transform:scale(1.12)} 50%{transform:scale(1)} 75%{transform:scale(1.12)} }
.page-subtitle { font-size: 13px; color: #aaa; margin-top: 2px; }
.header-stamps { display: flex; gap: 6px; }

.plane-trail {
  display: flex; align-items: center; gap: 8px;
  margin: 8px 0 12px; overflow: hidden;
  .trail { color: #ddd; font-size: 12px; letter-spacing: 4px; white-space: nowrap; }
  .plane { font-size: 24px; animation: plane-bounce 2s ease-in-out infinite; flex-shrink: 0; }
}

@keyframes plane-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

.filter-active-bar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px; padding: 8px 16px;
  background: var(--card-bg); border-radius: 20px;
  font-size: 13px; color: var(--text-primary);
  border: 2px solid var(--primary-color, #FF6B8A);
  button {
    background: none; border: none; cursor: pointer;
    color: #999; font-weight: 600; font-size: 13px;
    &:hover { color: #ff4444; }
  }
}

.timeline-controls {
  display: flex; gap: 10px; margin-bottom: 20px;
  button {
    padding: 6px 16px;
    border: 2px solid var(--border-color, rgba(0,0,0,0.08));
    border-radius: 20px; background: var(--card-bg);
    cursor: pointer; font-size: 12px; font-weight: 600;
    font-family: 'Nunito', 'Noto Sans SC', sans-serif;
    color: var(--text-secondary); transition: all 0.2s;
    &:hover { border-color: var(--primary-color); color: var(--primary-color); }
  }
}

.year-group { margin-bottom: 8px; }
.year-header {
  display: flex; align-items: center; gap: 14px;
  margin-bottom: 16px; cursor: pointer; user-select: none;
}
.year-stamp {
  background: linear-gradient(135deg, var(--primary-color, #FF6B8A), var(--accent-color, #FFD93D));
  color: white; padding: 8px 20px;
  border-radius: 6px 18px 6px 18px;
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 20px; font-weight: 800;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  flex-shrink: 0; display: flex; align-items: center; gap: 8px;
  .year-toggle { font-size: 12px; }
}
.year-line {
  flex: 1; height: 3px;
  background: linear-gradient(to right, var(--primary-color), transparent);
  border-radius: 2px;
}
.year-count { font-size: 12px; color: #bbb; white-space: nowrap; }
.year-content { animation: slide-down 0.3s ease; }

@keyframes slide-down { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

.month-group { margin-bottom: 4px; }
.month-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 10px; margin-left: 14px;
  cursor: pointer; user-select: none; padding: 4px 0;
  .month-toggle { font-size: 10px; color: #bbb; }
  .month-label { font-size: 13px; font-weight: 700; color: #888; }
  .month-count { font-size: 11px; color: #ccc; }
  .month-line { flex:1;height:1px;background:linear-gradient(to right,rgba(0,0,0,0.06),transparent); }
}

.events-list { padding-left: 4px; }
.empty-filter { text-align: center; padding: 60px 0; font-size: 16px; color: #bbb; }

.timeline-stats {
  display: flex; justify-content: center; gap: 24px;
  margin-top: 40px; padding: 20px;
  background: var(--card-bg); border-radius: 24px;
  border: 2px dashed var(--border-color);
  @include mobile { gap: 16px; }
}

.stat-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  cursor: pointer; padding: 8px 16px; border-radius: 16px;
  transition: all 0.2s;
  &:hover { background: rgba(0,0,0,0.03); }
  &.stat-active {
    background: var(--primary-color); color: white;
    .stat-num { color: white; }
    .stat-label { color: rgba(255,255,255,0.8); }
  }
  .stat-num { font-family: 'Fredoka One','ZCOOL KuaiLe',cursive; font-size: 28px; color: var(--primary-color); }
  .stat-label { font-size: 11px; color: var(--text-secondary); }
}

.loading-state { text-align: center; padding: 80px 0; font-size: 20px; color: #aaa; }
</style>
