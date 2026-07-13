/**
 * API 层 — Mock 模拟
 * 未来可替换为真实 HTTP 请求
 */

import type { User, Travel, Photo, TimelineEvent } from '@/types'

// 模拟延迟
function delay(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---- 用户 API ----
export const userAPI = {
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    await delay()
    if (!username || password.length < 3) throw new Error('用户名或密码错误')
    return {
      token: 'mock-token-' + Date.now(),
      user: {
        id: 'user-001',
        username,
        avatar: '',
        email: username + '@travel.com',
        bio: '',
        hobbies: [],
        createdAt: new Date().toISOString(),
        preferences: { theme: 'cartoon', language: 'zh' },
        role:'admin',
        status:'active'
      },
    }
  },

  async register(data: { username: string; password: string; email: string }): Promise<User> {
    await delay()
    return {
      id: 'user-' + Date.now(),
      username: data.username,
      avatar: '',
      email: data.email,
      bio: '',
      hobbies: [],
      createdAt: new Date().toISOString(),
      preferences: { theme: 'cartoon', language: 'zh' },
      role:'admin',
      status:'active'
    }
  },
}

// ---- 旅行 API ----
export const travelAPI = {
  async getTravels(): Promise<Travel[]> {
    await delay(400)
    const { default: data } = await import('@/mock/travel.json')
    return data as Travel[]
  },

  async getTravelById(id: string): Promise<Travel | null> {
    await delay(300)
    const { default: data } = await import('@/mock/travel.json')
    return ((data as Travel[]).find((t) => t.id === id) || null)
  },
}

// ---- 照片 API ----
export const photoAPI = {
  async getPhotos(): Promise<Photo[]> {
    await delay(300)
    const { default: data } = await import('@/mock/photo.json')
    return data as Photo[]
  },

  async getPhotoById(id: string): Promise<Photo | null> {
    await delay(200)
    const { default: data } = await import('@/mock/photo.json')
    return ((data as Photo[]).find((p) => p.id === id) || null)
  },
}

// ---- 时间轴 API ----
export const timelineAPI = {
  async getEvents(): Promise<TimelineEvent[]> {
    await delay(400)
    const { default: data } = await import('@/mock/timeline.json')
    return data as TimelineEvent[]
  },
}
