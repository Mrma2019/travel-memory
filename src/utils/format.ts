/** 格式化日期 */
export function formatDate(dateStr: string, format: 'full' | 'short' | 'month' = 'full'): string {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  switch (format) {
    case 'full':
      return `${year}年${month}月${day}日`
    case 'short':
      return `${year}-${month}-${day}`
    case 'month':
      return `${year}年${month}月`
  }
}

/** 计算距离今天的天数 */
export function daysFromToday(dateStr: string): number {
  const now = new Date()
  const d = new Date(dateStr)
  return Math.ceil((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

/** 格式化文件大小 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/** 生成渐变颜色 */
export function randomGradient(): string {
  const colors = [
    ['#ff9a76', '#fbc2eb'],
    ['#a1c4fd', '#c2e9fb'],
    ['#fbc2eb', '#a6c1ee'],
    ['#ffecd2', '#fcb69f'],
    ['#a18cd1', '#fbc2eb'],
  ]
  const [c1, c2] = colors[Math.floor(Math.random() * colors.length)]
  return `linear-gradient(135deg, ${c1}, ${c2})`
}
