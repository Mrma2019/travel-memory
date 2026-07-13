import { computed } from 'vue'
import { useTravelStore } from '@/stores/useTravelStore'

export function useTravelStats() {
  const travelStore = useTravelStore()

  const stats = computed(() => travelStore.stats)

  const statCards = computed(() => [
    {
      label: '旅行次数',
      value: stats.value.totalTrips,
      icon: '✈️',
      color: '#FF6B6B',
      unit: '次',
    },
    {
      label: '探索国家',
      value: stats.value.totalCountries,
      icon: '🌍',
      color: '#4ECDC4',
      unit: '个',
    },
    {
      label: '到访城市',
      value: stats.value.totalCities,
      icon: '🏙️',
      color: '#45B7D1',
      unit: '座',
    },
    {
      label: '旅行天数',
      value: stats.value.totalDays,
      icon: '📅',
      color: '#BB8FCE',
      unit: '天',
    },
    {
      label: '年度旅行',
      value: stats.value.yearlyTrend[stats.value.yearlyTrend.length - 1]?.count || 0,
      icon: '🎯',
      color: '#FF8A65',
      unit: '次',
    },
    {
      label: '旅行故事',
      value: stats.value.yearlyTrend[stats.value.yearlyTrend.length - 1]?.count || 0,
      icon: '📖',
      color: '#8b8b8b',
      unit: '次',
    }
  ])

  return {
    stats,
    statCards,
  }
}
