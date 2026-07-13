import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Photo } from '@/types'
import mockPhoto from '@/mock/photo.json'
import { photoDB, type PhotoRecord } from '@/utils/db'

export const usePhotoStore = defineStore('photo', () => {
  const photos = ref<Photo[]>([])
  const loading = ref(false)
  const uploadingCount = ref(0)

  const photoCount = computed(() => photos.value.length)

  async function fetchPhotos() {
    loading.value = true
    await new Promise((r) => setTimeout(r, 400))
    const storedPhotos = await photoDB.photos.toArray()
    const mockPhotos = mockPhoto as Photo[]
    const merged: Photo[] = mockPhotos.map((mp) => {
      const stored = storedPhotos.find((sp) => sp.id === mp.id)
      return stored ? { ...mp, url: stored.url, thumbnailUrl: stored.thumbnailUrl } : mp
    })
    photos.value = merged
    loading.value = false
  }

  function getPhotoById(id: string): Photo | undefined {
    return photos.value.find((p) => p.id === id)
  }

  function getPhotosByTravelId(travelId: string): Photo[] {
    return photos.value
      .filter((p) => p.travelId === travelId)
      .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())
  }

  /** 按位置范围查询照片 */
  function getPhotosByLocation(lat: number, lng: number, radiusKm = 10): Photo[] {
    return photos.value.filter((p) => {
      if (!p.location.lat || !p.location.lng) return false
      const dLat = (p.location.lat - lat) * 111
      const dLng = (p.location.lng - lng) * 111 * Math.cos((lat * Math.PI) / 180)
      return Math.sqrt(dLat * dLat + dLng * dLng) <= radiusKm
    })
  }

  /** 上传单张照片 */
  async function uploadPhoto(
    file: File,
    info: {
      title: string
      description: string
      location: Photo['location']
      takenAt: string
      travelId: string
      tags: string[]
    }
  ): Promise<Photo> {
    uploadingCount.value++

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target?.result as string
          const thumbnail = await createThumbnail(dataUrl, 400)

          const newPhoto: Photo = {
            id: 'photo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            title: info.title || '未命名照片',
            description: info.description || '',
            url: dataUrl,
            thumbnailUrl: thumbnail,
            location: info.location || { name: '未知地点', lat: 0, lng: 0 },
            takenAt: info.takenAt || new Date().toISOString(),
            travelId: info.travelId || '',
            tags: info.tags || [],
            size: file.size,
            width: 0,
            height: 0,
            createdAt: new Date().toISOString(),
          }

          const img = new Image()
          img.onload = async () => {
            newPhoto.width = img.width
            newPhoto.height = img.height

            await photoDB.photos.put({
              id: newPhoto.id,
              url: dataUrl,
              thumbnailUrl: thumbnail,
              title: newPhoto.title,
            } as PhotoRecord)

            photos.value.unshift(newPhoto)
            uploadingCount.value--
            resolve(newPhoto)
          }
          img.src = dataUrl
        } catch (err) {
          uploadingCount.value--
          reject(err)
        }
      }
      reader.onerror = () => {
        uploadingCount.value--
        reject(new Error('文件读取失败'))
      }
      reader.readAsDataURL(file)
    })
  }

  /** 批量上传 */
  async function uploadPhotos(
    files: File[],
    baseInfo: {
      title: string
      description: string
      location: Photo['location']
      takenAt: string
      travelId: string
      tags: string[]
    }
  ): Promise<Photo[]> {
    const results: Photo[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const info = { ...baseInfo, title: baseInfo.title || `照片 ${i + 1}` }
      try {
        const photo = await uploadPhoto(file, info)
        results.push(photo)
      } catch {
        // 单张失败继续上传其他
      }
    }
    return results
  }

  async function deletePhoto(id: string) {
    await photoDB.photos.delete(id)
    photos.value = photos.value.filter((p) => p.id !== id)
  }

  async function updatePhoto(id: string, updates: Partial<Photo>) {
    const index = photos.value.findIndex((p) => p.id === id)
    if (index !== -1) {
      photos.value[index] = { ...photos.value[index], ...updates }
      // 同步到 IndexedDB
      const p = photos.value[index]
      await photoDB.photos.put({
        id: p.id,
        url: p.url,
        thumbnailUrl: p.thumbnailUrl,
        title: p.title,
      } as PhotoRecord)
    }
  }

  /** 更新照片故事 */
  async function updatePhotoStory(
    id: string,
    storyData: { storyTitle: string; story: string; tags?: string[] }
  ) {
    const updates: Partial<Photo> = {
      storyTitle: storyData.storyTitle,
      story: storyData.story,
      storyUpdatedAt: new Date().toISOString(),
    }
    if (storyData.tags) {
      updates.tags = storyData.tags
    }
    await updatePhoto(id, updates)
  }

  return {
    photos,
    loading,
    uploadingCount,
    photoCount,
    fetchPhotos,
    getPhotoById,
    getPhotosByTravelId,
    getPhotosByLocation,
    uploadPhoto,
    uploadPhotos,
    deletePhoto,
    updatePhoto,
    updatePhotoStory,
  }
})

function createThumbnail(dataUrl: string, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > height) {
        if (width > maxSize) { height *= maxSize / width; width = maxSize }
      } else {
        if (height > maxSize) { width *= maxSize / height; height = maxSize }
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.src = dataUrl
  })
}
