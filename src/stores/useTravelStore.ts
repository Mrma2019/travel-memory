import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Travel, TravelStats, TimelineEvent } from '@/types'
import mockTravel from '@/mock/travel.json'
import mockTimeline from '@/mock/timeline.json'
import mockPhoto from '@/mock/photo.json'
import { usePhotoStore } from './usePhotoStore'
import { createTravelApi, queryAllTravelApi } from '@/api/travel'

const STORAGE_KEY = 'travel-memory-travels'

function loadStoredTravels(): Travel[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

function saveTravels(travels: Travel[]) {
  // 只保存用户新增的（非 mock 的）
  const userTravels = travels.filter((t) => t.id.startsWith('user-travel-'))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userTravels))
}

export const useTravelStore = defineStore('travel', () => {
  const travels = ref<Travel[]>([])
  const timeline = ref<TimelineEvent[]>([])
  const loading = ref(false)

  const stats = computed<TravelStats>(() => {
    const allTravels = travels.value
    let totalPhotos = mockPhoto.length
    try {
      const photoStore = usePhotoStore()
      totalPhotos = photoStore.photos.length || mockPhoto.length
    } catch { /* not initialized */ }

    let totalDays = 0
    allTravels.forEach((t) => {
      const start = new Date(t.startDate)
      const end = new Date(t.endDate)
      totalDays += Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    })

    const yearlyMap: Record<number, number> = {}
    allTravels.forEach((t) => {
      const year = new Date(t.startDate).getFullYear()
      yearlyMap[year] = (yearlyMap[year] || 0) + 1
    })
    const yearlyTrend = Object.entries(yearlyMap)
      .map(([year, count]) => ({ year: Number(year), count }))
      .sort((a, b) => a.year - b.year)

    const countryMap: Record<string, number> = {}
    allTravels.forEach((t) => {
      countryMap[t.country] = (countryMap[t.country] || 0) + 1
    })
    const countryDistribution = Object.entries(countryMap).map(([name, value]) => ({ name, value }))

    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const monthMap: Record<string, number> = {}
    monthNames.forEach((m) => (monthMap[m] = 0))
    allTravels.forEach((t) => {
      const month = new Date(t.startDate).getMonth()
      monthMap[monthNames[month]]++
    })
    const monthlyHeatmap = monthNames.map((month) => ({ month, count: monthMap[month] }))

    const photoMonthMap: Record<string, number> = {}
    monthNames.forEach((m) => (photoMonthMap[m] = 0))
    mockPhoto.forEach((p) => {
      const month = new Date(p.takenAt).getMonth()
      photoMonthMap[monthNames[month]]++
    })
    const photoTrend = monthNames.map((month) => ({ month, count: photoMonthMap[month] }))

    const tagMap: Record<string, number> = {}
    allTravels.forEach((t) => {
      t.tags.forEach((tag) => { tagMap[tag] = (tagMap[tag] || 0) + 1 })
    })
    mockPhoto.forEach((p) => {
      (p as { tags?: string[] }).tags?.forEach((tag: string) => { tagMap[tag] = (tagMap[tag] || 0) + 1 })
    })
    const tagDistribution = Object.entries(tagMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12)

    const uniqueCountries = new Set(allTravels.map((t) => t.country))
    const uniqueCities = new Set(allTravels.map((t) => `${t.country}-${t.city}`))

    return {
      totalTrips: allTravels.length,
      totalCountries: uniqueCountries.size,
      totalCities: uniqueCities.size,
      totalPhotos,
      totalDays,
      yearlyTrend,
      countryDistribution,
      monthlyHeatmap,
      photoTrend,
      tagDistribution,
    }
  })

  async function fetchTravels() {
    loading.value = true
    await new Promise((r) => setTimeout(r, 500))
    const mockTravels = mockTravel as Travel[]
    const stored = loadStoredTravels()
    // 合并：mock 数据 + localStorage 中用户新增的
    const storedIds = new Set(stored.map((t) => t.id))
    const merged = [...mockTravels, ...stored.filter((t) => !mockTravels.some((m) => m.id === t.id))]
    // travels.value = merged
    timeline.value = mockTimeline as TimelineEvent[]
    loading.value = false

    //旅行列表
    queryAllTravelApi().then(resp => {
      const { code, msg, data } = resp?.data || {}
      if (code === 0) {
        // console.log(data.records)
        travels.value = data.records
      }
    })
  }

  function getTravelById(id: string): Travel | undefined {
    return travels.value.find((t) => t.id === id)
  }

  function getTimelineByTravelId(travelId: string): TimelineEvent[] {
    return timeline.value.filter((e) => e.travelId === travelId)
  }

  const routePoints = computed(() => {
    return travels.value.map((t) => ({
      lat: t.lat, lng: t.lng,
      name: `${t.country} ${t.city}`,
      date: t.startDate,
      photoCount: t.photos.length,
    }))
  })

  // ---- CRUD ----
  function addTravel(data: {
    title: string; country: string; countryCode: string; city: string
    lat: number; lng: number; startDate: string; endDate: string
    story: string; tags: string[]; coverUrl?: string
  }): Travel {
    const newTravel: Travel = {
      ...data,
      photos: [],
      rating: 0,
      // createdAt: new Date().toISOString(),
    } as any

    //新增旅行
    createTravelApi(newTravel).then(resp => {
      const { code, msg, data } = resp?.data || {}
      if (code === 0) {
        console.log('新增旅行成功', data)
      } else {
        console.error('新增旅行失败', msg)
      }
    })

    // travels.value.push(newTravel)
    // saveTravels(travels.value)
    // 同时创建一个 timeline 事件
    // timeline.value.push({
    //   id: 'event-user-' + Date.now(),
    //   type: 'arrival',
    //   date: data.startDate,
    //   title: `📍 抵达${data.city}`,
    //   description: data.story || `来到了${data.country}的${data.city}`,
    //   icon: '📍',
    //   travelId: newTravel.id,
    // })
    return newTravel
  }

  function updateTravel(id: string, updates: Partial<Travel>) {
    const idx = travels.value.findIndex((t) => t.id === id)
    if (idx !== -1) {
      travels.value[idx] = { ...travels.value[idx], ...updates }
      saveTravels(travels.value)
    }
  }

  function deleteTravel(id: string) {
    travels.value = travels.value.filter((t) => t.id !== id)
    timeline.value = timeline.value.filter((e) => e.travelId !== id)
    saveTravels(travels.value)
  }

  return {
    travels, timeline, loading, stats, routePoints,
    fetchTravels, getTravelById, getTimelineByTravelId,
    addTravel, updateTravel, deleteTravel,
  }
})
