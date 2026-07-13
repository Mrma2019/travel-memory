<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePhotoStore } from '@/stores/usePhotoStore'
import { useTravelStore } from '@/stores/useTravelStore'
import { PRESET_TAGS } from '@/types'
import MapPicker from '@/components/map/MapPicker.vue'
import PhotoCard from '@/components/cards/PhotoCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import TravelForm from '@/components/travel/TravelForm.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import Toast from '@/components/common/Toast.vue'
import type { ToastState } from '@/types/common'

const route = useRoute()
const router = useRouter()
const photoStore = usePhotoStore()
const travelStore = useTravelStore()

const showUpload = ref(false)
const loading = ref(true)
const showMapPicker = ref(false)
const uploading = ref(false)
const uploadError = ref<string | null>(null)
const showAddTravel = ref(false)
const viewMode = ref<'albums' | 'photos'>('albums')
const selectedTravelId = ref<string | null>(null)

// ---- 照片选择模式 ----
const selectMode = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const showBatchDeleteConfirm = ref(false)
const showSingleDeleteConfirm = ref(false)
const deletingPhotoId = ref<string | null>(null)

// ---- 相册选择模式 ----
const albumSelectMode = ref(false)
const selectedAlbumIds = ref<Set<string>>(new Set())
const showAlbumBatchDeleteConfirm = ref(false)
const showAlbumSingleDeleteConfirm = ref(false)
const deletingAlbumId = ref<string | null>(null)

const toast = reactive<ToastState>({ show: false, type: 'success', message: '' })

function toggleSelect(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function toggleSelectAll() {
  if (selectedIds.value.size === travelPhotos.value.length) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(travelPhotos.value.map((p) => p.id))
  }
}

function enterSelectMode() {
  selectMode.value = true
  selectedIds.value = new Set()
}

function exitSelectMode() {
  selectMode.value = false
  selectedIds.value = new Set()
}

function triggerSingleDelete(photoId: string) {
  deletingPhotoId.value = photoId
  showSingleDeleteConfirm.value = true
}

async function confirmSingleDelete() {
  if (!deletingPhotoId.value) return
  await photoStore.deletePhoto(deletingPhotoId.value)
  showSingleDeleteConfirm.value = false
  deletingPhotoId.value = null
  showToast('success', '照片已删除 🗑️')
}

async function confirmBatchDelete() {
  const ids = [...selectedIds.value]
  for (const id of ids) {
    await photoStore.deletePhoto(id)
  }
  showBatchDeleteConfirm.value = false
  exitSelectMode()
  showToast('success', `已删除 ${ids.length} 张照片 🗑️`)
}

// ---- 相册删除 ----
function enterAlbumSelectMode() {
  albumSelectMode.value = true
  selectedAlbumIds.value = new Set()
}

function exitAlbumSelectMode() {
  albumSelectMode.value = false
  selectedAlbumIds.value = new Set()
}

function toggleAlbumSelect(id: string) {
  const next = new Set(selectedAlbumIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedAlbumIds.value = next
}

function toggleAlbumSelectAll() {
  if (selectedAlbumIds.value.size === filteredTravels.value.length) {
    selectedAlbumIds.value = new Set()
  } else {
    selectedAlbumIds.value = new Set(filteredTravels.value.map((t) => t.id))
  }
}

function triggerAlbumSingleDelete(travelId: string) {
  deletingAlbumId.value = travelId
  showAlbumSingleDeleteConfirm.value = true
}

async function confirmAlbumSingleDelete() {
  if (!deletingAlbumId.value) return
  travelStore.deleteTravel(deletingAlbumId.value)
  showAlbumSingleDeleteConfirm.value = false
  deletingAlbumId.value = null
  showToast('success', '相册已删除 🗑️')
}

async function confirmAlbumBatchDelete() {
  const ids = [...selectedAlbumIds.value]
  for (const id of ids) {
    travelStore.deleteTravel(id)
  }
  showAlbumBatchDeleteConfirm.value = false
  exitAlbumSelectMode()
  showToast('success', `已删除 ${ids.length} 个相册 🗑️`)
}

function showToast(type: 'success' | 'error', message: string) {
  toast.show = true
  toast.type = type
  toast.message = message
  setTimeout(() => { toast.show = false }, 3000)
}

// ---- 上传 ----
const selectedFiles = ref<File[]>([])
const previewUrls = ref<string[]>([])
const MAX_FILES = 9

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || []).filter((f) => f.type.startsWith('image/'))
  target.value = ''
  if (files.length === 0) return
  const remaining = MAX_FILES - selectedFiles.value.length
  if (remaining <= 0) { uploadError.value = `一次最多上传${MAX_FILES}张照片哦~ 📷`; return }
  const toAdd = files.slice(0, remaining)
  if (files.length > remaining) uploadError.value = `最多还能添加${remaining}张，已忽略超出的~`
  const newFiles = [...selectedFiles.value, ...toAdd]
  selectedFiles.value = newFiles
  previewUrls.value = []
  newFiles.forEach((f) => {
    const reader = new FileReader()
    reader.onload = (e) => previewUrls.value.push(e.target?.result as string)
    reader.readAsDataURL(f)
  })
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/'))
  if (files.length === 0) return
  const remaining = MAX_FILES - selectedFiles.value.length
  if (remaining <= 0) { uploadError.value = `一次最多上传${MAX_FILES}张照片哦~ 📷`; return }
  const newFiles = [...selectedFiles.value, ...files.slice(0, remaining)]
  selectedFiles.value = newFiles
  previewUrls.value = []
  newFiles.forEach((f) => {
    const reader = new FileReader()
    reader.onload = (e) => previewUrls.value.push(e.target?.result as string)
    reader.readAsDataURL(f)
  })
}

function removeFile(idx: number) { selectedFiles.value.splice(idx, 1); previewUrls.value.splice(idx, 1) }
function clearFiles() { selectedFiles.value = []; previewUrls.value = [] }

const uploadForm = ref({
  titles: [] as string[], description: '', locationName: '',
  lat: 0, lng: 0,
  takenAt: new Date().toISOString().slice(0, 16),
  travelId: '', selectedTags: [] as string[], customTagInput: '',
})

function updatePhotoTitle(index: number, title: string) { uploadForm.value.titles[index] = title }
function toggleTag(tag: string) {
  const idx = uploadForm.value.selectedTags.indexOf(tag)
  if (idx >= 0) uploadForm.value.selectedTags.splice(idx, 1)
  else uploadForm.value.selectedTags.push(tag)
}
function addCustomTag() {
  const tag = uploadForm.value.customTagInput.trim()
  if (tag && !uploadForm.value.selectedTags.includes(tag)) uploadForm.value.selectedTags.push(tag)
  uploadForm.value.customTagInput = ''
}
function removeTag(tag: string) { uploadForm.value.selectedTags = uploadForm.value.selectedTags.filter((t) => t !== tag) }
function onMapPicked(pos: { lat: number; lng: number; name: string }) {
  uploadForm.value.lat = pos.lat; uploadForm.value.lng = pos.lng; uploadForm.value.locationName = pos.name
}

async function handleUpload() {
  if (selectedFiles.value.length === 0) { uploadError.value = '请先选择照片~'; return }
  uploading.value = true; uploadError.value = null
  const travelId = selectedTravelId.value || uploadForm.value.travelId
  for (let i = 0; i < selectedFiles.value.length; i++) {
    try {
      const title = uploadForm.value.titles[i] || `照片 ${i + 1}`
      await photoStore.uploadPhoto(selectedFiles.value[i], {
        title, description: uploadForm.value.description,
        location: { name: uploadForm.value.locationName || '未知地点', lat: uploadForm.value.lat, lng: uploadForm.value.lng },
        takenAt: uploadForm.value.takenAt, travelId, tags: uploadForm.value.selectedTags,
      })
    } catch { uploadError.value = `第${i + 1}张上传失败` }
  }
  uploading.value = false; showUpload.value = false; resetAll()
}

function resetAll() {
  selectedFiles.value = []; previewUrls.value = []
  uploadForm.value = { titles: [], description: '', locationName: '', lat: 0, lng: 0, takenAt: new Date().toISOString().slice(0, 16), travelId: '', selectedTags: [], customTagInput: '' }
  uploadError.value = null
}

// ---- 相册视图 ----
function openTravel(travelId: string) {
  selectedTravelId.value = travelId
  viewMode.value = 'photos'
}

function backToAlbums() {
  selectedTravelId.value = null
  viewMode.value = 'albums'
}

const currentTravel = computed(() => {
  if (!selectedTravelId.value) return null
  return travelStore.getTravelById(selectedTravelId.value)
})

// ---- 筛选 + 排序 ----
const filterYear = ref('all')
const filterCountry = ref('all')
const searchQuery = ref('')
const sortBy = ref<'newest' | 'oldest' | 'photos'>('newest')

const availableYears = computed(() => {
  const years = new Set(travelStore.travels.map(t => new Date(t.startDate).getFullYear()))
  return Array.from(years).sort((a, b) => b - a)
})

const availableCountries = computed(() => {
  const countries = new Set(travelStore.travels.map(t => t.country))
  return Array.from(countries).sort()
})

const albumCovers = computed(() => {
  const map: Record<string, string> = {}
  travelStore.travels.forEach(t => {
    // 优先使用旅行封面，其次用第一张照片的缩略图
    if (t.coverUrl) {
      map[t.id] = t.coverUrl
    } else {
      const first = photoStore.photos.find(p => p.travelId === t.id && p.thumbnailUrl)
      if (first) map[t.id] = first.thumbnailUrl
    }
  })
  return map
})

const filteredTravels = computed(() => {
  let list = [...travelStore.travels]

  // 年份筛选
  if (filterYear.value !== 'all') {
    const y = Number(filterYear.value)
    list = list.filter(t => new Date(t.startDate).getFullYear() === y)
  }
  // 国家筛选
  if (filterCountry.value !== 'all') {
    list = list.filter(t => t.country === filterCountry.value)
  }
  // 名称搜索
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(t => t.title.toLowerCase().includes(q) || t.country.toLowerCase().includes(q) || t.city.toLowerCase().includes(q))
  }

  // 排序
  switch (sortBy.value) {
    case 'newest':
      list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      break
    case 'oldest':
      list.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      break
    case 'photos':
      list.sort((a, b) => b.photos.length - a.photos.length)
      break
  }
  return list
})

// ---- 触底加载（仅照片模式） ----
const PAGE_SIZE = 12
const displayedCount = ref(PAGE_SIZE)
const travelPhotos = computed(() => {
  if (!selectedTravelId.value) return photoStore.photos
  return photoStore.photos.filter((p) => p.travelId === selectedTravelId.value)
})
const displayedPhotos = computed(() => travelPhotos.value.slice(0, displayedCount.value))
const hasMore = computed(() => displayedCount.value < travelPhotos.value.length)

function loadMore() { displayedCount.value += PAGE_SIZE }

function goToPhoto(photoId: string) { router.push(`/album/${photoId}`) }

// ---- 新增旅行 ----
function onTravelSaved() { showAddTravel.value = false }

// ---- 相册渐变背景色 ----
const ALBUM_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)',
]

function albumGradient(index: number): string {
  return ALBUM_GRADIENTS[index % ALBUM_GRADIENTS.length]
}

// ---- 初始化 ----
onMounted(async () => {
  await Promise.all([photoStore.fetchPhotos(), travelStore.fetchTravels()])
  loading.value = false

  // URL query 参数筛选
  const tid = route.query.travelId as string
  if (tid) { selectedTravelId.value = tid; viewMode.value = 'photos' }

  // 触底加载
  const sentinel = document.getElementById('album-sentinel')
  if (sentinel) {
    new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore.value) loadMore()
    }, { rootMargin: '100px' }).observe(sentinel)
  }

  window.addEventListener('travel-memory:open-photo', ((e: CustomEvent) => {
    router.push(`/album/${e.detail.id}`)
  }) as EventListener)
  window.addEventListener('travel-memory:open-album', ((e: CustomEvent) => {
    openTravel(e.detail.travelId)
  }) as EventListener)
})
</script>

<template>
  <div class="album-page">
    <!-- 头部 -->
    <div class="page-header">
      <div>
        <h1 class="page-title">
          <span class="title-emoji">📷</span>
          {{ viewMode === 'albums' ? '我的相册' : (currentTravel?.title || '旅行照片') }}
        </h1>
        <p v-if="viewMode === 'albums'" class="page-subtitle">用照片记录每一次旅行 ✨</p>
        <button v-if="viewMode === 'photos'" class="back-btn" @click="backToAlbums">← 返回相册列表</button>
      </div>
      <div class="header-actions">
        <template v-if="viewMode === 'albums'">
          <button v-if="!albumSelectMode" class="manage-btn" @click="enterAlbumSelectMode">
            📋 管理相册
          </button>
          <button v-if="albumSelectMode" class="done-btn" @click="exitAlbumSelectMode">
            ✅ 完成
          </button>
          <button class="add-travel-btn" @click="showAddTravel = true">
            <span>🧳</span> 新增旅行
          </button>
        </template>
        <template v-if="viewMode === 'photos' && !selectMode">
          <button class="manage-btn" @click="enterSelectMode">
            📋 管理照片
          </button>
        </template>
        <template v-if="viewMode === 'photos' && selectMode">
          <button class="done-btn" @click="exitSelectMode">
            ✅ 完成
          </button>
        </template>
        <button class="upload-toggle-btn" @click="showUpload = !showUpload">
          <span>{{ showUpload ? '📋' : '📤' }}</span> {{ showUpload ? '收起' : '上传照片' }}
        </button>
      </div>
    </div>

    <!-- 上传区 -->
    <transition name="fade">
      <div v-if="showUpload" class="upload-section">
        <div class="upload-card cartoon-card">
          <h3>📤 上传新照片</h3>
          <div v-if="previewUrls.length === 0" class="drag-area" @dragover.prevent @dragleave.prevent
            @drop="handleDrop">
            <div class="upload-zone">
              <div class="upload-icon">📁</div>
              <p class="upload-text">拖拽照片到这里</p>
              <p class="upload-sub">或</p>
              <label class="upload-btn-label"><span>📷 选择照片</span><input type="file" accept="image/*" multiple
                  class="upload-input" @change="handleFileSelect" /></label>
              <p class="upload-hint">支持 JPG、PNG、WebP，最多 {{ MAX_FILES }} 张</p>
            </div>
          </div>
          <div v-else class="preview-grid-wrap">
            <div class="preview-header"><span>已选择 {{ selectedFiles.length }}/{{ MAX_FILES }} 张</span><button
                class="clear-btn" @click="clearFiles">🔄 清空</button></div>
            <div class="preview-grid">
              <div v-for="(url, idx) in previewUrls" :key="idx" class="preview-item">
                <img :src="url" alt="预览" />
                <button class="rem-btn" @click="removeFile(idx)">✕</button>
                <span class="preview-idx">{{ idx + 1 }}</span>
              </div>
              <label v-if="selectedFiles.length < MAX_FILES" class="preview-add"><span>+</span><input type="file"
                  accept="image/*" multiple class="upload-input" @change="handleFileSelect" /></label>
            </div>
          </div>
          <div v-if="uploadError" class="error-msg">{{ uploadError }}</div>

          <div v-if="selectedFiles.length > 0" class="upload-form">
            <div class="batch-titles">
              <div v-for="(_, idx) in selectedFiles" :key="idx" class="batch-title-row">
                <img v-if="previewUrls[idx]" :src="previewUrls[idx]" class="batch-thumb" />
                <input :value="uploadForm.titles[idx] || ''" :placeholder="`照片 ${idx + 1} 标题`"
                  @input="updatePhotoTitle(idx, ($event.target as HTMLInputElement).value)" />
                <button class="remove-one" @click="removeFile(idx)">✕</button>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>📅 拍摄时间</label><input v-model="uploadForm.takenAt" type="datetime-local" />
              </div>
              <div class="form-group"><label>🧳 关联旅行</label><select v-model="uploadForm.travelId">
                  <option value="">未选择</option>
                  <option v-for="t in travelStore.travels" :key="t.id" :value="t.id">{{ t.title }}</option>
                </select></div>
            </div>
            <div class="form-group">
              <label>🏷️ 标签</label>
              <div class="tag-cats">
                <div v-for="cat in PRESET_TAGS" :key="cat.category" class="tag-cat"><span class="tag-cat-lbl">{{
                  cat.emoji }} {{ cat.category }}</span>
                  <div class="tag-chips"><button v-for="tag in cat.tags" :key="tag" class="tag-chip"
                      :class="{ selected: uploadForm.selectedTags.includes(tag) }" @click="toggleTag(tag)">{{ tag
                      }}</button></div>
                </div>
              </div>
              <div v-if="uploadForm.selectedTags.length" class="selected-tags"><span
                  v-for="tag in uploadForm.selectedTags" :key="tag" class="selected-tag">{{ tag }}<button
                    @click="removeTag(tag)">✕</button></span></div>
              <div class="custom-tag-input"><input v-model="uploadForm.customTagInput" placeholder="自定义标签..."
                  @keyup.enter="addCustomTag" /><button @click="addCustomTag">添加</button></div>
            </div>
            <div class="form-group">
              <label>📍 拍摄地点</label>
              <div class="location-row"><input v-model="uploadForm.locationName" placeholder="在地图上选择位置"
                  readonly /><button class="map-pick-btn" @click="showMapPicker = !showMapPicker">🗺️
                  {{ showMapPicker ? '收起' : '选择位置' }}</button></div>
              <transition name="fade">
                <MapPicker v-if="showMapPicker" height="250px" @update:model-value="onMapPicked" />
              </transition>
            </div>
            <div class="form-group"><label>💬 描述</label><textarea v-model="uploadForm.description" rows="3"
                placeholder="说说照片的故事吧~"></textarea></div>
            <button class="upload-submit-btn" :disabled="uploading" @click="handleUpload"><span v-if="uploading">📤
                上传中...</span><span v-else>✨ 上传 {{ selectedFiles.length }} 张照片</span></button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 相册列表视图 -->
    <div v-if="!loading && viewMode === 'albums'">
      <!-- 筛选条 -->
      <div class="filter-bar">
        <div class="filter-row">
          <div class="filter-item">
            <label>📅 年份</label>
            <select v-model="filterYear">
              <option value="all">全部时间</option>
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }}年</option>
            </select>
          </div>
          <div class="filter-item">
            <label>🌍 目的地</label>
            <select v-model="filterCountry">
              <option value="all">全部</option>
              <option v-for="c in availableCountries" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="filter-item filter-search">
            <label>🔍 搜索</label>
            <input v-model="searchQuery" placeholder="搜索相册名称..." />
          </div>
          <div class="filter-item">
            <label>↕️ 排序</label>
            <select v-model="sortBy">
              <option value="newest">最新优先</option>
              <option value="oldest">最早优先</option>
              <option value="photos">照片最多</option>
            </select>
          </div>
          <span class="filter-count">{{ filteredTravels.length }} 个相册</span>
        </div>
      </div>

      <!-- 相册批量操作栏 -->
      <transition name="fade">
        <div v-if="albumSelectMode" class="batch-bar album-batch-bar">
          <div class="batch-info">
            <span class="batch-count">已选 {{ selectedAlbumIds.size }} 个</span>
            <button class="batch-link" @click="toggleAlbumSelectAll">
              {{ selectedAlbumIds.size === filteredTravels.length ? '取消全选' : '全选' }}
            </button>
            <button class="batch-link cancel" @click="exitAlbumSelectMode">取消</button>
          </div>
          <button class="batch-delete-btn" :disabled="selectedAlbumIds.size === 0" @click="showAlbumBatchDeleteConfirm = true">
            🗑️ 删除选中
          </button>
        </div>
      </transition>

      <div v-if="filteredTravels.length > 0" class="albums-grid">
        <div
          v-for="(t, idx) in filteredTravels"
          :key="t.id"
          class="album-card cartoon-card"
          :class="{ 'select-mode': albumSelectMode, 'is-selected': selectedAlbumIds.has(t.id) }"
          @click="albumSelectMode ? toggleAlbumSelect(t.id) : openTravel(t.id)"
        >
          <!-- 选择勾选框 -->
          <div v-if="albumSelectMode" class="album-select-check" :class="{ checked: selectedAlbumIds.has(t.id) }">
            <span v-if="selectedAlbumIds.has(t.id)">✓</span>
          </div>
          <!-- 单个删除按钮（非选择模式下 hover 显示） -->
          <button
            v-if="!albumSelectMode"
            class="album-delete-btn"
            title="删除相册"
            @click.stop="triggerAlbumSingleDelete(t.id)"
          >🗑️</button>
          <!-- 封面区域 -->
          <div
            class="album-cover-area"
            :style="albumCovers[t.id]
              ? { backgroundImage: `url(${albumCovers[t.id]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: albumGradient(idx) }"
          >
            <div class="album-cover-badge">
              <span class="album-country-emoji">{{
                {
                  JP: '🗾', FR: '🥐', TH: '🛕', IT: '🍕', CN: '🏮', AU: '🦘', US: '🗽', GB: '💂', DE: '🍺', ES: '💃'
                }[t.countryCode] || '🌍'
              }}</span>
            </div>
            <div class="album-photo-count">
              <span>📷 {{ photoStore.photos.filter(p => p.travelId === t.id).length }}</span>
            </div>
            <!-- 底部渐变过渡 -->
            <div class="album-cover-fade"></div>
          </div>
          <!-- 信息区域 -->
          <div class="album-card-body">
            <h3 class="album-card-title">{{ t.title }}</h3>
            <div class="album-card-meta">
              <span class="album-card-loc">📍 {{ t.country }} · {{ t.city }}</span>
              <span class="album-card-date">📅 {{ t.startDate }} ~ {{ t.endDate }}</span>
            </div>
            <div v-if="t.tags.length" class="album-card-tags">
              <span v-for="tag in t.tags.slice(0, 3)" :key="tag" class="album-tag-chip">{{ tag }}</span>
              <span v-if="t.tags.length > 3" class="album-tag-more">+{{ t.tags.length - 3 }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-albums"><span>🔍</span>
        <p>没有找到匹配的相册~</p>
      </div>
    </div>

    <!-- 照片列表视图（进入单个旅行） -->
    <div v-if="!loading && viewMode === 'photos'">
      <!-- 批量操作栏 -->
      <transition name="fade">
        <div v-if="selectMode" class="batch-bar">
          <div class="batch-info">
            <span class="batch-count">已选 {{ selectedIds.size }} 张</span>
            <button class="batch-link" @click="toggleSelectAll">
              {{ selectedIds.size === travelPhotos.length ? '取消全选' : '全选' }}
            </button>
            <button class="batch-link cancel" @click="exitSelectMode">取消</button>
          </div>
          <button class="batch-delete-btn" :disabled="selectedIds.size === 0" @click="showBatchDeleteConfirm = true">
            🗑️ 删除选中
          </button>
        </div>
      </transition>
      <div v-if="travelPhotos.length > 0" class="photo-grid">
        <PhotoCard v-for="photo in displayedPhotos" :key="photo.id" :id="photo.id" :title="photo.title"
          :location="photo.location.name" :url="photo.url" :thumbnail-url="photo.thumbnailUrl" :date="photo.takenAt"
          :selectable="selectMode" :selected="selectedIds.has(photo.id)" :show-delete="!selectMode"
          @select="toggleSelect" @delete="triggerSingleDelete" @click="goToPhoto(photo.id)" />
      </div>
      <EmptyState v-else message="该旅行还没有照片哦~" show-action action-text="📤 上传照片" @action="showUpload = true" />
      <div id="album-sentinel" style="height:1px"></div>
      <div v-if="hasMore" class="loading-more">📷 加载更多...</div>
      <div v-if="!hasMore && travelPhotos.length > 0" class="loading-end">🎉 共 {{ travelPhotos.length }} 张照片</div>
    </div>

    <div v-if="loading" class="loading-area">📷 加载中...</div>

    <!-- 新增旅行弹窗 -->
    <Teleport to="body">
      <div v-if="showAddTravel" class="modal-overlay" @click.self="showAddTravel = false">
        <div class="modal-card cartoon-card">
          <div class="modal-header">
            <h2>🧳 新增旅行</h2><button @click="showAddTravel = false">✕</button>
          </div>
          <TravelForm @saved="onTravelSaved" />
        </div>
      </div>
    </Teleport>

    <!-- 照片批量删除确认 -->
    <ConfirmDialog v-model:visible="showBatchDeleteConfirm" title="批量删除"
      :content="`确定要删除选中的 ${selectedIds.size} 张照片吗？此操作不可恢复哦~ 📷`" confirmText="确认删除" cancelText="取消"
      @confirm="confirmBatchDelete" @cancel="showBatchDeleteConfirm = false" />

    <!-- 照片单个删除确认 -->
    <ConfirmDialog v-model:visible="showSingleDeleteConfirm" title="删除照片" content="确定要删除这张照片吗？📷" confirmText="确认删除"
      cancelText="取消" @confirm="confirmSingleDelete" @cancel="showSingleDeleteConfirm = false" />

    <!-- 相册批量删除确认 -->
    <ConfirmDialog v-model:visible="showAlbumBatchDeleteConfirm" title="批量删除相册"
      :content="`确定要删除选中的 ${selectedAlbumIds.size} 个相册吗？相册内的照片不会删除，此操作不可恢复哦~ 🗑️`" confirmText="确认删除" cancelText="取消"
      @confirm="confirmAlbumBatchDelete" @cancel="showAlbumBatchDeleteConfirm = false" />

    <!-- 相册单个删除确认 -->
    <ConfirmDialog v-model:visible="showAlbumSingleDeleteConfirm" title="删除相册" content="确定要删除这个相册吗？相册内的照片不会被删除哦~ 🗑️" confirmText="确认删除"
      cancelText="取消" @confirm="confirmAlbumSingleDelete" @cancel="showAlbumSingleDeleteConfirm = false" />

    <!-- Toast -->
    <Toast :show="toast.show" :type="toast.type" :message="toast.message" />
  </div>
</template>

<style lang="scss" scoped>
.album-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;

  @include mobile {
    padding: 16px;
    padding-bottom: 80px;
  }
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 28px;
  color: var(--text-primary);

  .title-emoji {
    display: inline-block;
    animation: heartbeat 2s ease-in-out infinite
  }
}

@keyframes heartbeat {

  0%,
  100% {
    transform: scale(1)
  }

  25% {
    transform: scale(1.12)
  }

  50% {
    transform: scale(1)
  }

  75% {
    transform: scale(1.12)
  }
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px
}

.back-btn {
  background: none;
  border: none;
  font-size: 13px;
  color: var(--primary-color);
  cursor: pointer;
  margin-top: 4px;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    text-decoration: underline
  }
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap
}

.add-travel-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #4CAF50, #8BC34A);
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all .3s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(76, 175, 80, .3)
  }
}

.upload-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all .3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, .15)
  }
}

.manage-btn,
.done-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 24px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all .3s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif
}

.manage-btn {
  background: white;
  color: var(--text-primary);
  border: 2px solid var(--border-color);

  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color)
  }
}

.done-btn {
  background: var(--primary-color);
  color: white;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, .15)
  }
}

// 批量操作栏
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  margin-bottom: 16px;
  background: var(--primary-color);
  border-radius: 12px;
  color: white;
  animation: fade-in .2s ease
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 12px
}

.batch-count {
  font-weight: 700;
  font-size: 14px
}

.batch-link {
  background: none;
  border: none;
  color: rgba(255, 255, 255, .85);
  font-size: 13px;
  cursor: pointer;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  padding: 0;

  &:hover {
    color: white;
    text-decoration: underline
  }

  &.cancel {
    color: rgba(255, 255, 255, .7)
  }
}

.batch-delete-btn {
  padding: 8px 20px;
  background: white;
  color: #ff4444;
  border: none;
  border-radius: 20px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  transition: all .2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, .15)
  }

  &:disabled {
    opacity: .5;
    cursor: not-allowed
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @include mobile {
    grid-template-columns: 1fr
  }
}

.form-group {
  margin-bottom: 14px;

  label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 4px
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 10px 14px;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    font-size: 13px;
    font-family: 'Nunito', 'Noto Sans SC', sans-serif;
    transition: border-color .3s;
    background: rgba(0, 0, 0, .02);

    &:focus {
      outline: none;
      border-color: var(--primary-color)
    }
  }
}

// 上传区
.upload-section {
  margin-bottom: 28px
}

.upload-card {
  padding: 24px;

  h3 {
    font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
    font-size: 18px;
    color: var(--text-primary);
    margin-bottom: 16px
  }
}

.drag-area {
  border: 3px dashed rgba(0, 0, 0, .1);
  border-radius: var(--card-radius, 20px);
  padding: 40px 20px;
  text-align: center;
  transition: all .3s;
  cursor: pointer;
  background: rgba(255, 255, 255, .5);
  margin-bottom: 16px;

  &:hover {
    border-color: var(--primary-color);
    background: rgba(255, 255, 255, .7)
  }
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px
}

.upload-icon {
  font-size: 48px;
  animation: bounce-soft 2s ease-in-out infinite
}

@keyframes bounce-soft {
  0%, 100% { transform: translateY(0) }
  50% { transform: translateY(-8px) }
}

.upload-text {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 16px;
  color: #555
}

.upload-sub {
  font-size: 13px;
  color: #bbb
}

.upload-btn-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  background: var(--primary-color);
  color: white;
  border-radius: 24px;
  font-weight: 700;
  cursor: pointer;
  transition: all .3s;
  font-size: 14px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, .15)
  }
}

.upload-input {
  display: none
}

.upload-hint {
  font-size: 11px;
  color: #ccc;
  margin-top: 4px
}

.error-msg {
  background: #fff0f0;
  color: #e74c3c;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  margin: 10px 0;
  text-align: center
}

.preview-grid-wrap {
  border: 2px solid rgba(0, 0, 0, .06);
  border-radius: var(--card-radius, 20px);
  padding: 16px;
  background: rgba(255, 255, 255, .6);
  margin-bottom: 16px
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #666
}

.clear-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 12px;
  &:hover { color: #ff6b6b }
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px
}

.preview-item {
  position: relative;
  aspect-ratio: 4/3;
  max-height: 130px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(0, 0, 0, .06);

  img { width: 100%; height: 100%; object-fit: cover }

  .rem-btn {
    position: absolute; top: 4px; right: 4px;
    width: 24px; height: 24px;
    border-radius: 50%;
    background: rgba(0, 0, 0, .5);
    color: white; border: none;
    font-size: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    &:hover { background: #ff4444 }
  }
  .preview-idx {
    position: absolute; bottom: 4px; left: 4px;
    width: 22px; height: 22px;
    border-radius: 50%;
    background: var(--primary-color);
    color: white; font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center
  }
}

.preview-add {
  aspect-ratio: 4/3;
  border: 2px dashed rgba(0, 0, 0, .15);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .3s;
  font-size: 32px; color: #ccc;
  &:hover { border-color: var(--primary-color); color: var(--primary-color) }
  input { display: none }
}

.upload-form { margin-top: 16px }

.batch-titles { margin: 12px 0; max-height: 260px; overflow-y: auto }

.batch-title-row {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 0; border-bottom: 1px solid rgba(0, 0, 0, .04);
  .batch-thumb { width: 44px; height: 33px; object-fit: cover; border-radius: 6px }
  input { flex: 1; padding: 8px 12px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 13px; font-family: 'Nunito', 'Noto Sans SC', sans-serif;
    &:focus { outline: none; border-color: var(--primary-color) }
  }
  .remove-one { background: none; border: none; color: #ccc; cursor: pointer; font-size: 14px;
    &:hover { color: #ff4444 }
  }
}

.tag-cats { margin-bottom: 8px }
.tag-cat { margin-bottom: 4px }
.tag-cat-lbl { font-size: 11px; color: #aaa; font-weight: 600; margin-bottom: 3px; display: block }
.tag-chips { display: flex; flex-wrap: wrap; gap: 5px }
.tag-chip {
  padding: 3px 10px; border: 2px solid rgba(0, 0, 0, .08); border-radius: 20px;
  background: white; font-size: 11px; cursor: pointer; transition: all .2s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  &:hover { border-color: var(--primary-color) }
  &.selected { background: var(--primary-color); color: white; border-color: var(--primary-color) }
}

.selected-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 }
.selected-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 12px; background: var(--primary-color); color: white;
  border-radius: 20px; font-size: 12px; font-weight: 600;
  button { background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 14px; padding: 0; &:hover { color: white } }
}

.custom-tag-input { display: flex; gap: 8px; margin-top: 6px;
  input { flex: 1 }
  button { padding: 8px 16px; background: var(--accent-color); border: none; border-radius: 20px; font-weight: 600; font-size: 12px; cursor: pointer; font-family: 'Nunito','Noto Sans SC',sans-serif }
}

.location-row { display: flex; gap: 8px; input { flex: 1 } }

.map-pick-btn {
  display: flex; align-items: center; gap: 4px; padding: 8px 16px;
  background: white; border: 2px solid var(--border-color); border-radius: 8px;
  font-size: 13px; cursor: pointer; white-space: nowrap;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif; transition: all .2s;
  &:hover { border-color: var(--primary-color) }
}

.upload-submit-btn {
  width: 100%; padding: 14px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white; border: none; border-radius: 24px;
  font-weight: 700; font-size: 15px; cursor: pointer; transition: all .3s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.15) }
  &:disabled { opacity: .7 }
}

// 相册卡片（全新设计）
.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.album-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(.4, 0, .2, 1);
  position: relative;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 36px rgba(0, 0, 0, .14);

    .album-cover-area {
      transform: scale(1.04);
    }

    .album-delete-btn {
      opacity: 1;
      pointer-events: auto;
    }
  }

  &.select-mode {
    cursor: pointer;
    &:hover { transform: none; box-shadow: none; .album-cover-area { transform: none; } }
  }

  &.is-selected {
    outline: 3px solid var(--primary-color);
    outline-offset: 2px;
    border-radius: var(--card-radius, 20px);
  }
}

// 选择勾选框
.album-select-check {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: white;
  transition: all 0.2s;
  backdrop-filter: blur(4px);

  &.checked {
    background: var(--primary-color);
    border-color: var(--primary-color);
  }
}

// 单个删除按钮
.album-delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);

  &:hover {
    background: #ff6b6b;
    border-color: #ff6b6b;
    transform: scale(1.12);

    &::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: rgba(255, 107, 107, 0.15);
      animation: pulse-ring 0.6s ease-out;
    }
  }
}

@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}

// 封面区域
.album-cover-area {
  position: relative;
  height: 180px;
  transition: transform 0.35s cubic-bezier(.4, 0, .2, 1);
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.08);
    pointer-events: none;
  }
}

.album-cover-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 2;

  .album-country-emoji {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(8px);
    font-size: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.album-photo-count {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  padding: 6px 14px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.3px;
}

.album-cover-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%);
  z-index: 1;
  pointer-events: none;
}

// 信息区域
.album-card-body {
  padding: 16px 20px 20px;
  position: relative;
  z-index: 1;
  background: white;
}

.album-card-title {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 18px;
  color: var(--text-primary);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--text-secondary);
}

.album-card-loc {
  font-weight: 600;
}

.album-card-date {
  color: #999;
}

.album-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.album-tag-chip {
  padding: 3px 10px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 20px;
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 600;
  transition: background 0.2s;

  .album-card:hover & {
    background: rgba(0, 0, 0, 0.06);
  }
}

.album-tag-more {
  padding: 3px 10px;
  background: var(--primary-color);
  color: white;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
}

// 相册批量操作栏
.album-batch-bar {
  margin-bottom: 20px;
}

.empty-albums {
  grid-column: 1/-1;
  text-align: center;
  padding: 60px 20px;

  span {
    font-size: 56px;
    display: block;
    margin-bottom: 12px
  }

  p {
    color: var(--text-secondary)
  }
}

// 筛选条
.filter-bar {
  margin-bottom: 20px;
  padding: 14px 16px;
  background: var(--card-bg);
  border-radius: var(--card-radius, 20px);
  border: 1px solid var(--border-color)
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap
}

.filter-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 140px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    white-space: nowrap;
    flex-shrink: 0
  }

  select,
  input {
    padding: 7px 10px;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    font-size: 13px;
    font-family: 'Nunito', 'Noto Sans SC', sans-serif;
    background: white;
    flex: 1;
    min-width: 0;

    &:focus {
      outline: none;
      border-color: var(--primary-color)
    }
  }
}

.filter-search {
  flex: 2;
  min-width: 180px
}

.filter-count {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
  align-self: center;
  margin-top: 18px
}

@include mobile {
  .filter-item {
    min-width: 100%;
    flex: auto
  }
}

// 照片
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px
}

.loading-area {
  text-align: center;
  padding: 60px 0;
  font-size: 18px;
  color: #aaa
}

.loading-more {
  text-align: center;
  padding: 24px 0;
  font-size: 14px;
  color: #bbb
}

.loading-end {
  text-align: center;
  padding: 24px 0;
  font-size: 13px;
  color: #ccc
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .3s, transform .3s
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px)
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fade-in .2s ease
}

@keyframes fade-in {
  from {
    opacity: 0
  }

  to {
    opacity: 1
  }
}

.modal-card {
  width: 520px;
  max-width: 90vw;
  max-height: 85vh;
  padding: 24px;
  overflow-y: auto;
  animation: pop-in .3s cubic-bezier(.34, 1.56, .64, 1)
}

@keyframes pop-in {
  from {
    transform: scale(.9);
    opacity: 0
  }

  to {
    transform: scale(1);
    opacity: 1
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h2 {
    font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
    font-size: 20px;
    color: var(--text-primary)
  }

  button {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #bbb;

    &:hover {
      color: #333
    }
  }
}
</style>
