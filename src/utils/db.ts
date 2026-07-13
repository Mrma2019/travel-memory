/**
 * IndexedDB 封装 — 使用 Dexie.js
 * 存储上传照片的 Base64 数据和缩略图
 */
import Dexie, { type Table } from 'dexie'

export interface PhotoRecord {
  id: string
  url: string // Base64 data URL
  thumbnailUrl: string
  title: string
}

export interface SettingsRecord {
  key: string
  value: unknown
}

class TravelMemoryDB extends Dexie {
  photos!: Table<PhotoRecord, string>
  settings!: Table<SettingsRecord, string>

  constructor() {
    super('TravelMemoryDB')
    this.version(1).stores({
      photos: 'id, title',
      settings: 'key',
    })
  }
}

export const photoDB = new TravelMemoryDB()
