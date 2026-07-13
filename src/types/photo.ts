/** 照片数据模型 */
export interface Photo {
  id: string
  title: string
  description: string
  url: string
  thumbnailUrl: string
  location: PhotoLocation
  takenAt: string
  travelId: string
  tags: string[]
  size: number
  width: number
  height: number
  createdAt: string
  /** 照片故事 */
  story?: string
  storyTitle?: string
  storyUpdatedAt?: string
}

/** 照片位置信息 */
export interface PhotoLocation {
  name: string
  lat: number
  lng: number
}

/** 照片上传表单 */
export interface PhotoUploadForm {
  file: File
  title: string
  description: string
  location: PhotoLocation
  takenAt: string
  travelId: string
  tags: string[]
}

/** 瀑布流列数 */
export type MasonryColumns = 2 | 3 | 4

/** 预设标签类别 */
export const PRESET_TAGS: { category: string; emoji: string; tags: string[] }[] = [
  { category: '风景', emoji: '🌅', tags: ['日出', '日落', '海滩', '雪山', '森林', '湖泊', '星空', '沙漠'] },
  { category: '城市', emoji: '🏙️', tags: ['街景', '建筑', '夜景', '市场', '博物馆', '咖啡店', '地铁', '地标'] },
  { category: '美食', emoji: '🍜', tags: ['小吃', '甜品', '咖啡', '餐厅', '早午餐', '夜市', '水果', '海鲜'] },
  { category: '人物', emoji: '👤', tags: ['自拍', '合照', '当地人', '街头艺人', '旅伴'] },
  { category: '活动', emoji: '🎭', tags: ['徒步', '潜水', '骑行', '节日', '演出', '购物', '博物馆'] },
]
