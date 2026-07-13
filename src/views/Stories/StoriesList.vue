<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { usePhotoStore } from '@/stores/usePhotoStore'
import { formatDate } from '@/utils/format'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import Toast from '@/components/common/Toast.vue'
import type { ToastState } from '@/types/common'

const router = useRouter()
const photoStore = usePhotoStore()
const loading = ref(true)

// ---- 选择模式 ----
const selectMode = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const showBatchDeleteConfirm = ref(false)
const showSingleDeleteConfirm = ref(false)
const deletingStoryId = ref<string | null>(null)
const toast = reactive<ToastState>({ show: false, type: 'success', message: '' })

function toggleSelect(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function toggleSelectAll() {
  if (selectedIds.value.size === stories.value.length) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(stories.value.map((s) => s.id))
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
  deletingStoryId.value = photoId
  showSingleDeleteConfirm.value = true
}

async function confirmSingleDelete() {
  if (!deletingStoryId.value) return
  await photoStore.updatePhoto(deletingStoryId.value, {
    story: '', storyTitle: '', storyUpdatedAt: new Date().toISOString(),
  })
  showSingleDeleteConfirm.value = false
  deletingStoryId.value = null
  showToast('success', '故事已删除，照片依然保留哦~ 📷')
}

async function confirmBatchDelete() {
  const ids = [...selectedIds.value]
  for (const id of ids) {
    await photoStore.updatePhoto(id, {
      story: '', storyTitle: '', storyUpdatedAt: new Date().toISOString(),
    })
  }
  showBatchDeleteConfirm.value = false
  exitSelectMode()
  showToast('success', `已删除 ${ids.length} 篇故事 📖`)
}

function showToast(type: 'success' | 'error', message: string) {
  toast.show = true
  toast.type = type
  toast.message = message
  setTimeout(() => { toast.show = false }, 3000)
}

// 筛选 + 排序
const filterYear = ref('all')
const filterPlace = ref('all')
const sortOrder = ref<'newest' | 'oldest'>('newest')

const availableYears = computed(() => {
  const years = new Set(
    photoStore.photos
      .filter((p) => p.story)
      .map((p) => new Date(p.storyUpdatedAt || p.takenAt).getFullYear())
  )
  return Array.from(years).sort((a, b) => b - a)
})

const availablePlaces = computed(() => {
  const places = new Set(
    photoStore.photos.filter((p) => p.story).map((p) => p.location.name).filter(Boolean)
  )
  return Array.from(places).sort()
})

const stories = computed(() => {
  let list = photoStore.photos.filter((p) => p.story)

  // 年份筛选
  if (filterYear.value !== 'all') {
    const y = Number(filterYear.value)
    list = list.filter((p) => new Date(p.storyUpdatedAt || p.takenAt).getFullYear() === y)
  }
  // 地点筛选
  if (filterPlace.value !== 'all') {
    list = list.filter((p) => p.location.name === filterPlace.value)
  }

  // 排序
  list.sort((a, b) => {
    const da = new Date(a.storyUpdatedAt || a.takenAt).getTime()
    const db = new Date(b.storyUpdatedAt || b.takenAt).getTime()
    return sortOrder.value === 'newest' ? db - da : da - db
  })

  return list
})

onMounted(async () => {
  if (photoStore.photos.length === 0) await photoStore.fetchPhotos()
  loading.value = false
})

function goToStory(photoId: string) { router.push(`/stories/${photoId}`) }
function goToWrite() { router.push('/album') }
</script>

<template>
  <div class="stories-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          <span class="title-emoji">📖</span> 旅行故事
        </h1>
        <p class="page-subtitle">每一张照片背后，都有一个值得被记住的故事 ✨</p>
      </div>
      <div class="header-actions">
        <button v-if="!selectMode" class="manage-btn" @click="enterSelectMode">
          📋 管理
        </button>
        <button v-if="selectMode" class="done-btn" @click="exitSelectMode">
          ✅ 完成
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">📖 加载故事中...</div>

    <template v-else-if="stories.length > 0 || filterYear !== 'all' || filterPlace !== 'all'">
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
            <label>📍 地点</label>
            <select v-model="filterPlace">
              <option value="all">全部地点</option>
              <option v-for="p in availablePlaces" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div class="filter-item">
            <label>↕️ 排序</label>
            <select v-model="sortOrder">
              <option value="newest">最新</option>
              <option value="oldest">最早</option>
            </select>
          </div>
          <span class="filter-count">{{ stories.length }} 篇故事</span>
        </div>
      </div>

      <!-- 故事列表 -->
      <!-- 批量操作栏 -->
      <transition name="fade">
        <div v-if="selectMode" class="batch-bar">
          <div class="batch-info">
            <span class="batch-count">已选 {{ selectedIds.size }} 篇</span>
            <button class="batch-link" @click="toggleSelectAll">
              {{ selectedIds.size === stories.length ? '取消全选' : '全选' }}
            </button>
            <button class="batch-link cancel" @click="exitSelectMode">取消</button>
          </div>
          <button class="batch-delete-btn" :disabled="selectedIds.size === 0" @click="showBatchDeleteConfirm = true">
            🗑️ 删除选中
          </button>
        </div>
      </transition>
      <div v-if="stories.length > 0" class="stories-list">
        <div v-for="story in stories" :key="story.id" class="story-card cartoon-card"
          :class="{ 'select-mode': selectMode, 'is-selected': selectedIds.has(story.id) }"
          @click="selectMode ? toggleSelect(story.id) : goToStory(story.id)">
          <!-- 选择框 -->
          <div v-if="selectMode" class="select-check" :class="{ checked: selectedIds.has(story.id) }">
            <span v-if="selectedIds.has(story.id)">✓</span>
          </div>
          <div class="story-thumb">
            <img v-if="story.thumbnailUrl" :src="story.thumbnailUrl" :alt="story.title" />
            <div v-else class="thumb-placeholder">📷</div>
          </div>
          <div class="story-info">
            <h3 class="story-title">{{ story.storyTitle || story.title }}</h3>
            <p class="story-excerpt">{{ (story.story || '').slice(0, 120) }}{{ (story.story || '').length > 120 ? '...'
              : '' }}</p>
            <div class="story-meta">
              <span>📍 {{ story.location.name }}</span>
              <span>📅 {{ formatDate(story.storyUpdatedAt || story.takenAt) }}</span>
            </div>
            <div v-if="story.tags.length" class="story-tags">
              <span v-for="tag in story.tags.slice(0, 4)" :key="tag" class="story-tag">{{ tag }}</span>
            </div>
          </div>
          <!-- 单个删除按钮 -->
          <button v-if="!selectMode" class="delete-single" title="删除故事"
            @click.stop="triggerSingleDelete(story.id)">🗑️</button>
          <div class="story-arrow">→</div>
        </div>
      </div>
      <div v-else class="empty-filter">🔍 没有找到匹配的故事~</div>
    </template>

    <!-- 空状态 -->
    <div v-else class="empty-stories">
      <div class="empty-illustration">
        <span class="empty-icon">📝</span>
        <span class="empty-cloud">☁️</span>
      </div>
      <h3>还没有旅行故事</h3>
      <p>去相册里为喜欢的照片写下故事吧~</p>
      <button class="go-btn" @click="goToWrite">📷 去写故事</button>
    </div>

    <!-- 批量删除确认 -->
    <ConfirmDialog v-model:visible="showBatchDeleteConfirm" title="批量删除故事"
      :content="`确定要删除选中的 ${selectedIds.size} 篇故事吗？照片不会被删除哦~ 📖`" confirmText="确认删除" cancelText="取消"
      @confirm="confirmBatchDelete" @cancel="showBatchDeleteConfirm = false" />

    <!-- 单个删除确认 -->
    <ConfirmDialog v-model:visible="showSingleDeleteConfirm" title="删除故事" content="确定要删除这个故事吗？照片不会被删除哦~ 📖"
      confirmText="确认删除" cancelText="取消" @confirm="confirmSingleDelete" @cancel="showSingleDeleteConfirm = false" />

    <!-- Toast -->
    <Toast :show="toast.show" :type="toast.type" :message="toast.message" />
  </div>
</template>

<style lang="scss" scoped>
.stories-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;

  @include mobile {
    padding: 16px;
    padding-bottom: 80px;
  }
}

.page-header {
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 8px;
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
  transition: all 0.3s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

.manage-btn {
  background: white;
  color: var(--text-primary);
  border: 2px solid var(--border-color);

  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
}

.done-btn {
  background: var(--primary-color);
  color: white;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
}

.page-title {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 28px;
  color: var(--text-primary);

  .title-emoji {
    display: inline-block;
    animation: heartbeat 2s ease-in-out infinite;
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
  margin-top: 4px;
}

// 筛选条
.filter-bar {
  margin-bottom: 20px;
  padding: 14px 16px;
  background: var(--card-bg);
  border-radius: var(--card-radius, 20px);
  border: 1px solid var(--border-color);
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
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
    flex-shrink: 0;
  }

  select {
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
      border-color: var(--primary-color);
    }
  }
}

.filter-count {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
  align-self: center;
  margin-top: 18px;
}

@include mobile {
  .filter-item {
    min-width: 100%;
    flex: auto;
  }
}

.empty-filter {
  text-align: center;
  padding: 40px 0;
  font-size: 15px;
  color: #bbb;
}

.loading-state {
  text-align: center;
  padding: 80px 0;
  font-size: 18px;
  color: #aaa;
}

.stories-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.story-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  align-items: center;
  position: relative;

  &:hover {
    transform: translateX(4px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);

    .delete-single {
      opacity: 1;
      pointer-events: auto;
    }
  }

  &.select-mode {
    transform: none !important;
  }

  &.is-selected {
    outline: 3px solid var(--primary-color);
    outline-offset: 2px;
  }
}

// 选择框
.select-check {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.2);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.2s;

  &.checked {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
  }
}

// 单个删除按钮
.delete-single {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #ff6b6b;
    color: white;
    border-color: #ff6b6b;
    transform: scale(1.1);
  }
}

.story-thumb {
  width: 120px;
  height: 90px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f5f5;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumb-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
  }
}

.story-info {
  flex: 1;
  min-width: 0;
}

.story-title {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.story-excerpt {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  /* Standard property for compatibility */
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.story-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #bbb;
  margin-bottom: 6px;
}

.story-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.story-tag {
  padding: 2px 10px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 20px;
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 600;
}

.story-arrow {
  font-size: 20px;
  color: #ccc;
  flex-shrink: 0;
}

.empty-stories {
  text-align: center;
  padding: 80px 20px;

  h3 {
    font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
    font-size: 18px;
    color: var(--text-primary);
    margin: 16px 0 8px;
  }

  p {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 20px;
  }
}

.empty-illustration {
  position: relative;
  display: inline-block;

  .empty-icon {
    font-size: 64px;
  }

  .empty-cloud {
    position: absolute;
    top: -10px;
    right: -30px;
    font-size: 36px;
    opacity: 0.3;
    animation: cloud-float 6s ease-in-out infinite;
  }
}

@keyframes cloud-float {

  0%,
  100% {
    transform: translateX(0)
  }

  50% {
    transform: translateX(15px)
  }
}

.go-btn {
  padding: 12px 28px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
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
  animation: bar-in .2s ease;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.batch-count {
  font-weight: 700;
  font-size: 14px;
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
    text-decoration: underline;
  }

  &.cancel {
    color: rgba(255, 255, 255, .7);
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
    box-shadow: 0 4px 12px rgba(0, 0, 0, .15);
  }

  &:disabled {
    opacity: .5;
    cursor: not-allowed;
  }
}

@keyframes bar-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
