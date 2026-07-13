/**
 * EXIF 解析工具（预留）
 * 未来可通过 exif-js 或 exifr 库解析 GPS 和拍摄时间
 */

export interface EXIFData {
  gps?: {
    lat: number
    lng: number
  }
  dateTaken?: string
  make?: string
  model?: string
}

/** 解析图片 EXIF 数据 */
export async function parseEXIF(_file: File): Promise<EXIFData | null> {
  // TODO: 集成 exifr 库解析 EXIF
  // const exifr = await import('exifr')
  // const data = await exifr.parse(file, ['GPSLatitude', 'GPSLongitude', 'DateTimeOriginal'])
  console.warn('EXIF解析功能待实现')
  return null
}
