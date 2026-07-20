/** 旅行记录 */
export interface Travel {
  id?: string
  country: string
  countryCode: string // ISO 3166-1 alpha-2
  city: string
  lat: number
  lng: number
  startDate: string
  endDate: string
  title: string
  story: string
  photos: string[]
  tags: string[]
  rating: 0 | 1 | 2 | 3 | 4 | 5
  createdAt?: string
  coverUrl?: string // 相册封面图 (dataUrl)
}

/** 旅行统计数据 */
export interface TravelStats {
  totalTrips: number
  totalCountries: number
  totalCities: number
  totalPhotos: number
  totalDays: number
  yearlyTrend: { year: number; count: number }[]
  countryDistribution: { name: string; value: number }[]
  monthlyHeatmap: { month: string; count: number }[]
  photoTrend: { month: string; count: number }[]
  tagDistribution: { name: string; value: number }[]
}

/** 时间轴事件 */
export interface TimelineEvent {
  id: string
  type: 'flight' | 'arrival' | 'photo' | 'story' | 'achievement'
  date: string
  title: string
  description: string
  icon: string
  travelId: string
  photoId?: string
  location?: {
    lat: number
    lng: number
    name: string
  }
}

/** 旅行路线 */
export interface TravelRoute {
  id: string
  name: string
  points: RoutePoint[]
  color: string
}

export interface RoutePoint {
  lat: number
  lng: number
  name: string
  date: string
  photoCount: number
}
