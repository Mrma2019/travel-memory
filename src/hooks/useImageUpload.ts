import { ref } from 'vue'
import type { Photo } from '@/types'
import { usePhotoStore } from '@/stores/usePhotoStore'

export function useImageUpload() {
  const selectedFiles = ref<File[]>([])
  const previewUrls = ref<string[]>([])
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const MAX_FILES = 9

  const photoStore = usePhotoStore()

  function onDragOver(e: DragEvent) {
    e.preventDefault()
  }

  function onDragLeave() {}

  function onDrop(e: DragEvent) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/'))
    addFiles(files)
  }

  function onFileSelect(e: Event) {
    const target = e.target as HTMLInputElement
    const files = Array.from(target.files || [])
    addFiles(files)
    target.value = ''
  }

  function addFiles(files: File[]) {
    error.value = null
    const remaining = MAX_FILES - selectedFiles.value.length
    if (remaining <= 0) {
      error.value = `一次最多上传${MAX_FILES}张照片哦~ 📷`
      return
    }
    const toAdd = files.slice(0, remaining)
    if (files.length > remaining) {
      error.value = `最多还能添加${remaining}张，已忽略超出的~`
    }
    toAdd.forEach((file) => {
      if (!file.type.startsWith('image/')) return
      if (file.size > 10 * 1024 * 1024) {
        error.value = '图片太大了，不能超过10MB哦~'
        return
      }
      selectedFiles.value.push(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        previewUrls.value.push(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    })
  }

  function removeFile(index: number) {
    selectedFiles.value.splice(index, 1)
    previewUrls.value.splice(index, 1)
  }

  async function uploadAll(info: {
    titles?: string[]
    description: string
    location: Photo['location']
    takenAt: string
    travelId: string
    tags: string[]
  }): Promise<Photo[]> {
    if (selectedFiles.value.length === 0) {
      error.value = '请先选择照片~'
      return []
    }
    uploading.value = true
    error.value = null
    const results: Photo[] = []

    for (let i = 0; i < selectedFiles.value.length; i++) {
      try {
        const title = info.titles?.[i] || `照片 ${i + 1}`
        const photo = await photoStore.uploadPhoto(selectedFiles.value[i], {
          title,
          description: info.description,
          location: info.location,
          takenAt: info.takenAt,
          travelId: info.travelId,
          tags: info.tags,
        })
        results.push(photo)
      } catch {
        error.value = `第${i + 1}张上传失败`
      }
    }

    uploading.value = false
    if (results.length > 0) reset()
    return results
  }

  function reset() {
    selectedFiles.value = []
    previewUrls.value = []
    error.value = null
  }

  return {
    selectedFiles,
    previewUrls,
    uploading,
    error,
    MAX_FILES,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect,
    addFiles,
    removeFile,
    uploadAll,
    reset,
  }
}
