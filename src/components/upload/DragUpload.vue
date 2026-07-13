<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  filesSelected: [files: File[]]
}>()

const isDragging = ref(false)
const previewUrls = ref<string[]>([])
const selectedFiles = ref<File[]>([])
const MAX_FILES = 9

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}
function onDragLeave() { isDragging.value = false }

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
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
  const currentCount = selectedFiles.value.length
  const remaining = MAX_FILES - currentCount

  if (remaining <= 0) {
    alert(`一次最多上传${MAX_FILES}张照片哦~ 📷`)
    return
  }

  const toAdd = files.slice(0, remaining)
  if (files.length > remaining) {
    alert(`最多还能添加${remaining}张，超过的部分已忽略~`)
  }

  toAdd.forEach((file) => {
    selectedFiles.value.push(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      previewUrls.value.push(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  })

  emit('filesSelected', [...selectedFiles.value])
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
  previewUrls.value.splice(index, 1)
  emit('filesSelected', [...selectedFiles.value])
}

function clearAll() {
  selectedFiles.value = []
  previewUrls.value = []
  emit('filesSelected', [])
}
</script>

<template>
  <div class="drag-upload-wrap">
    <!-- 拖拽区 -->
    <div
      v-if="previewUrls.length === 0"
      class="drag-upload"
      :class="{ dragging: isDragging }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div class="upload-zone">
        <div class="upload-icon">📁</div>
        <p class="upload-text">拖拽照片到这里</p>
        <p class="upload-sub">或</p>
        <label class="upload-btn">
          <span>📷 选择照片</span>
          <input type="file" accept="image/*" multiple class="upload-input" @change="onFileSelect" />
        </label>
        <p class="upload-hint">支持 JPG、PNG、WebP，最多 {{ MAX_FILES }} 张</p>
      </div>
    </div>

    <!-- 预览区（多图网格） -->
    <div v-else class="preview-grid-wrap">
      <div class="preview-header">
        <span>已选择 {{ selectedFiles.length }}/{{ MAX_FILES }} 张</span>
        <button class="clear-btn" @click="clearAll">🔄 清空重选</button>
      </div>
      <div class="preview-grid">
        <div v-for="(url, idx) in previewUrls" :key="idx" class="preview-item">
          <img :src="url" alt="预览" />
          <button class="remove-btn" @click="removeFile(idx)">✕</button>
          <span class="preview-index">{{ idx + 1 }}</span>
        </div>
        <!-- 添加更多 -->
        <label v-if="selectedFiles.length < MAX_FILES" class="preview-add">
          <span>+</span>
          <input type="file" accept="image/*" multiple class="upload-input" @change="onFileSelect" />
        </label>
      </div>

      <!-- 重新拖拽添加 -->
      <div
        class="drag-more"
        :class="{ dragging: isDragging }"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        📥 拖拽到此处添加更多照片
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.drag-upload-wrap {
  margin-bottom: 16px;
}

// 初始拖拽区
.drag-upload {
  border: 3px dashed rgba(0,0,0,0.1);
  border-radius: var(--card-radius, 20px);
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
  background: rgba(255,255,255,0.5);

  &.dragging {
    border-color: var(--primary-color, #FF6B8A);
    background: rgba(255,255,255,0.8);
    transform: scale(1.02);
    box-shadow: 0 0 0 8px rgba(255,107,138,0.1);
  }

  &:hover {
    border-color: var(--primary-color, #FF6B8A);
    background: rgba(255,255,255,0.7);
  }
}

.upload-zone {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}

.upload-icon {
  font-size: 48px;
  animation: bounce-soft 2s ease-in-out infinite;
}

@keyframes bounce-soft {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.upload-text { font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive; font-size: 16px; color: #555; }
.upload-sub { font-size: 13px; color: #bbb; }

.upload-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 24px;
  background: var(--primary-color, #FF6B8A);
  color: white;
  border-radius: 24px; font-weight: 700; cursor: pointer;
  transition: all 0.3s; font-size: 14px;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
}

.upload-input { display: none; }
.upload-hint { font-size: 11px; color: #ccc; margin-top: 4px; }

// 预览区
.preview-grid-wrap {
  border: 2px solid rgba(0,0,0,0.06);
  border-radius: var(--card-radius, 20px);
  padding: 16px;
  background: rgba(255,255,255,0.6);
}

.preview-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px; font-size: 13px; font-weight: 600; color: #666;

  .clear-btn {
    background: none; border: none; color: #999; cursor: pointer; font-size: 12px;
    &:hover { color: #ff6b6b; }
  }
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
}

.preview-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(0,0,0,0.06);

  img { width: 100%; height: 100%; object-fit: cover; }

  .remove-btn {
    position: absolute; top: 4px; right: 4px;
    width: 24px; height: 24px; border-radius: 50%;
    background: rgba(0,0,0,0.5); color: white; border: none;
    font-size: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    &:hover { background: #ff4444; }
  }

  .preview-index {
    position: absolute; bottom: 4px; left: 4px;
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--primary-color, #FF6B8A); color: white;
    font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }
}

.preview-add {
  aspect-ratio: 4/3;
  border: 2px dashed rgba(0,0,0,0.15);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.3s;
  font-size: 32px; color: #ccc;

  &:hover { border-color: var(--primary-color, #FF6B8A); color: var(--primary-color, #FF6B8A); }

  input { display: none; }
}

.drag-more {
  margin-top: 10px;
  border: 2px dashed rgba(0,0,0,0.08);
  border-radius: 12px;
  padding: 14px;
  text-align: center;
  font-size: 13px;
  color: #bbb;
  transition: all 0.2s;

  &.dragging {
    border-color: var(--primary-color, #FF6B8A);
    color: var(--primary-color, #FF6B8A);
  }
}
</style>
