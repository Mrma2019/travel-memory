<script setup lang="ts">
import { onMounted, ref, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePhotoStore } from '@/stores/usePhotoStore'
import { useTravelStore } from '@/stores/useTravelStore'
import { PRESET_TAGS } from '@/types'
import { formatDate, formatFileSize } from '@/utils/format'
import MapPicker from '@/components/map/MapPicker.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import Toast from '@/components/common/Toast.vue'
import type { ToastState } from '@/types/common'

const route = useRoute()
const router = useRouter()
const photoStore = usePhotoStore()
const travelStore = useTravelStore()
const showDeleteConfirm = ref(false)
const showEditModal = ref(false)
const showMapPicker = ref(false)
const toast = reactive<ToastState>({ show: false, type: 'success', message: '' })

const photo = computed(() => photoStore.getPhotoById(route.params.id as string))
const travel = computed(() => {
  if (!photo.value) return null
  return travelStore.getTravelById(photo.value.travelId)
})

const loading = ref(true)

// ---- 编辑表单 ----
const editForm = reactive({
  title: '',
  description: '',
  locationName: '',
  lat: 0,
  lng: 0,
  takenAt: '',
  tags: [] as string[],
  customTagInput: '',
})

function openEditModal() {
  if (!photo.value) return
  editForm.title = photo.value.title
  editForm.description = photo.value.description
  editForm.locationName = photo.value.location.name
  editForm.lat = photo.value.location.lat
  editForm.lng = photo.value.location.lng
  editForm.takenAt = photo.value.takenAt.slice(0, 16)
  editForm.tags = [...photo.value.tags]
  editForm.customTagInput = ''
  showMapPicker.value = false
  showEditModal.value = true
}

function toggleTag(tag: string) {
  const idx = editForm.tags.indexOf(tag)
  if (idx >= 0) editForm.tags.splice(idx, 1)
  else editForm.tags.push(tag)
}

function addCustomTag() {
  const tag = editForm.customTagInput.trim()
  if (tag && !editForm.tags.includes(tag)) editForm.tags.push(tag)
  editForm.customTagInput = ''
}

function removeTag(tag: string) {
  editForm.tags = editForm.tags.filter((t) => t !== tag)
}

function onMapPicked(pos: { lat: number; lng: number; name: string }) {
  editForm.lat = pos.lat
  editForm.lng = pos.lng
  editForm.locationName = pos.name
}

async function saveEdit() {
  if (!photo.value) return
  await photoStore.updatePhoto(photo.value.id, {
    title: editForm.title || '未命名照片',
    description: editForm.description,
    location: { name: editForm.locationName || '未知地点', lat: editForm.lat, lng: editForm.lng },
    takenAt: new Date(editForm.takenAt).toISOString(),
    tags: editForm.tags,
  })
  showEditModal.value = false
  showToast('success', '照片信息已更新 ✨')
}

onMounted(async () => {
  if (photoStore.photos.length === 0) await photoStore.fetchPhotos()
  if (travelStore.travels.length === 0) await travelStore.fetchTravels()
  loading.value = false
})

function goBack() {
  router.back()
}

function goToStory() {
  if (photo.value) {
    router.push(`/album/${photo.value.id}/story`)
  }
}

function cancelDelete() {
  showDeleteConfirm.value = false
}

async function confirmDelete() {
  if (!photo.value) return
  await photoStore.deletePhoto(photo.value.id)
  showDeleteConfirm.value = false
  showToast('success', '照片已删除')
  setTimeout(() => {
    router.back()
  }, 800)
}

function showToast(type: 'success' | 'error', message: string) {
  toast.show = true
  toast.type = type
  toast.message = message
  setTimeout(() => {
    toast.show = false
  }, 3000)
}

const hasLocation = computed(() => {
  return photo.value?.location?.lat && photo.value?.location?.lng
})
</script>

<template>
  <div class="photo-detail">
    <button class="back-btn" @click="goBack">← 返回相册</button>

    <div v-if="loading" class="loading-state">📷 加载中...</div>

    <template v-else-if="photo">
      <div class="detail-layout">
        <!-- 大图 -->
        <div class="detail-image">
          <div class="image-frame polaroid">
            <img v-if="photo.url" :src="photo.url" :alt="photo.title" />
            <div v-else class="image-placeholder">
              <span class="placeholder-icon">📷</span>
              <p>暂无照片数据</p>
            </div>
            <p class="polaroid-caption">{{ photo.title }}</p>
          </div>
        </div>

        <!-- 信息卡片 -->
        <div class="detail-info">
          <div class="info-card cartoon-card">
            <h2 class="info-title">{{ photo.title }}</h2>

            <!-- 故事 -->
            <div v-if="photo.story" class="info-section story-section">
              <h3>📖 {{ photo.storyTitle || '旅行故事' }}</h3>
              <p>{{ photo.story }}</p>
            </div>

            <div v-else-if="photo.description" class="info-section">
              <h3>💬 描述</h3>
              <p>{{ photo.description }}</p>
            </div>

            <div class="info-section">
              <h3>📍 拍摄地点</h3>
              <p>{{ photo.location.name }}</p>
            </div>

            <!-- 迷你地图 -->
            <div v-if="hasLocation" class="info-map">
              <MapPicker :model-value="{ lat: photo.location.lat, lng: photo.location.lng, name: photo.location.name }"
                height="180px" />
            </div>

            <div class="info-meta">
              <div class="meta-item">
                <span class="meta-icon">📅</span>
                <span>{{ formatDate(photo.takenAt) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon">📏</span>
                <span>{{ photo.width }} × {{ photo.height }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon">💾</span>
                <span>{{ formatFileSize(photo.size) }}</span>
              </div>
              <div v-if="photo.tags.length" class="meta-item">
                <span class="meta-icon">🏷️</span>
                <span>{{ photo.tags.join(', ') }}</span>
              </div>
            </div>

            <!-- 关联旅行 -->
            <div v-if="travel" class="info-section">
              <h3>🧳 关联旅行</h3>
              <p class="travel-link" @click="router.push(`/album?travelId=${travel.id}`)">
                {{ travel.title }} ({{ travel.country }} · {{ travel.city }})
              </p>
            </div>

            <!-- 操作 -->
            <div class="info-actions">
              <button class="action-btn story-btn" @click="goToStory">
                {{ photo.story ? '✏️ 编辑故事' : '📝 写故事' }}
              </button>
              <button class="action-btn edit-btn" @click="openEditModal">
                ✏️ 编辑信息
              </button>
              <button class="action-btn delete-btn" @click="showDeleteConfirm = true">
                🗑️ 删除照片
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="not-found">
      <span>😢 找不到这张照片</span>
    </div>
    <!-- 删除确认弹窗 -->
    <ConfirmDialog v-model:visible="showDeleteConfirm" title="删除照片" content="确定要删除这张照片吗？📷" confirmText="确认删除"
      cancelText="取消" @confirm="confirmDelete" @cancel="showDeleteConfirm = false" />
    <!-- Toast -->
    <Toast :show="toast.show" :type="toast.type" :message="toast.message" />

    <!-- 编辑信息弹窗 -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-card cartoon-card">
          <div class="modal-header">
            <h2>✏️ 编辑照片信息</h2>
            <button @click="showEditModal = false">✕</button>
          </div>
          <div class="edit-body">
            <div class="form-group">
              <label>📷 标题</label>
              <input v-model="editForm.title" placeholder="照片标题" />
            </div>
            <div class="form-group">
              <label>💬 描述</label>
              <textarea v-model="editForm.description" rows="3" placeholder="说说照片的故事吧~"></textarea>
            </div>
            <div class="form-group">
              <label>📅 拍摄时间</label>
              <input v-model="editForm.takenAt" type="datetime-local" />
            </div>
            <div class="form-group">
              <label>📍 拍摄地点</label>
              <div class="location-row">
                <input v-model="editForm.locationName" placeholder="在地图上选择位置" readonly />
                <button class="map-pick-btn" @click="showMapPicker = !showMapPicker">
                  🗺️ {{ showMapPicker ? '收起' : '选择位置' }}
                </button>
              </div>
              <transition name="fade">
                <MapPicker v-if="showMapPicker" height="200px"
                  :model-value="{ lat: editForm.lat, lng: editForm.lng, name: editForm.locationName }"
                  @update:model-value="onMapPicked" />
              </transition>
            </div>
            <div class="form-group">
              <label>🏷️ 标签</label>
              <div class="tag-cats">
                <div v-for="cat in PRESET_TAGS" :key="cat.category" class="tag-cat">
                  <span class="tag-cat-lbl">{{ cat.emoji }} {{ cat.category }}</span>
                  <div class="tag-chips">
                    <button v-for="tag in cat.tags" :key="tag" class="tag-chip"
                      :class="{ selected: editForm.tags.includes(tag) }" @click="toggleTag(tag)">{{ tag }}</button>
                  </div>
                </div>
              </div>
              <div v-if="editForm.tags.length" class="selected-tags">
                <span v-for="tag in editForm.tags" :key="tag" class="selected-tag">
                  {{ tag }}<button @click="removeTag(tag)">✕</button>
                </span>
              </div>
              <div class="custom-tag-input">
                <input v-model="editForm.customTagInput" placeholder="自定义标签..." @keyup.enter="addCustomTag" />
                <button @click="addCustomTag">添加</button>
              </div>
            </div>
          </div>
          <div class="edit-actions">
            <button class="save-btn" @click="saveEdit">💾 保存</button>
            <button class="cancel-btn" @click="showEditModal = false">取消</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.photo-detail {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;

  @include mobile {
    padding: 16px;
    padding-bottom: 80px;
  }
}

.back-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  margin-bottom: 20px;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  transition: color 0.2s;

  &:hover {
    color: var(--primary-color);
  }
}

.detail-layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;

  @include tablet-down {
    grid-template-columns: 1fr;
  }
}

// 大图
.detail-image {
  .polaroid {
    background: white;
    padding: 16px 16px 50px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    transform: rotate(-1deg);
    transition: transform 0.4s;

    &:hover {
      transform: rotate(0deg);
    }

    img {
      width: 100%;
      border-radius: 2px;
      display: block;
    }

    .image-placeholder {
      aspect-ratio: 4/3;
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .placeholder-icon {
        font-size: 64px;
      }

      p {
        color: #aaa;
        margin-top: 8px;
      }
    }

    .polaroid-caption {
      text-align: center;
      font-family: 'Caveat', 'Ma Shan Zheng', cursive;
      font-size: 18px;
      color: #666;
      margin-top: 12px;
    }
  }
}

// 信息卡片
.info-card {
  padding: 24px;
}

.info-title {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 22px;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.info-section {
  margin-bottom: 16px;

  h3 {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  p {
    font-size: 14px;
    color: var(--text-primary);
    line-height: 1.6;
  }
}

.story-section {
  background: rgba(255, 107, 138, 0.05);
  padding: 12px 16px;
  border-radius: 12px;
  border-left: 3px solid var(--primary-color, #FF6B8A);

  p {
    font-size: 14px;
    line-height: 1.8;
  }
}

.info-map {
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
}

.travel-link {
  cursor: pointer;
  color: var(--primary-color) !important;
  text-decoration: underline;
}

.info-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);

  .meta-icon {
    font-size: 16px;
  }
}

.info-actions {
  display: flex;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.edit-btn {
  flex: 1;
  padding: 10px 20px;
  border: 2px solid var(--primary-color, #FF6B8A);
  border-radius: 24px;
  background: white;
  color: var(--primary-color, #FF6B8A);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    background: var(--primary-color, #FF6B8A);
    color: white;
    transform: translateY(-2px);
  }
}

.story-btn {
  flex: 1;
  padding: 10px 20px;
  border: 2px solid var(--primary-color, #FF6B8A);
  border-radius: 24px;
  background: var(--primary-color, #FF6B8A);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
}

.delete-btn {
  padding: 10px 20px;
  border: 2px solid #ff6b6b;
  border-radius: 24px;
  background: white;
  color: #ff6b6b;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    background: #ff6b6b;
    color: white;
  }
}

.loading-state,
.not-found {
  text-align: center;
  padding: 80px 0;
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 20px;
  color: #aaa;
}

// 编辑弹窗
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fade-in 0.2s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.modal-card {
  width: 520px;
  max-width: 90vw;
  max-height: 85vh;
  padding: 24px;
  overflow-y: auto;
  animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes pop-in {
  from {
    transform: scale(0.9);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
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
    color: var(--text-primary);
  }

  button {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #bbb;

    &:hover {
      color: #333;
    }
  }
}

.edit-body {
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 14px;

  label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 4px;
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
    transition: border-color 0.3s;
    background: rgba(0, 0, 0, 0.02);

    &:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  }
}

.location-row {
  display: flex;
  gap: 8px;

  input {
    flex: 1;
  }
}

.map-pick-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: white;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary-color);
  }
}

.tag-cats {
  margin-bottom: 8px;
}

.tag-cat {
  margin-bottom: 4px;
}

.tag-cat-lbl {
  font-size: 11px;
  color: #aaa;
  font-weight: 600;
  margin-bottom: 3px;
  display: block;
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag-chip {
  padding: 3px 10px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  background: white;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    border-color: var(--primary-color);
  }

  &.selected {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: var(--primary-color);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;

  button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    font-size: 14px;
    padding: 0;

    &:hover {
      color: white;
    }
  }
}

.custom-tag-input {
  display: flex;
  gap: 8px;
  margin-top: 6px;

  input {
    flex: 1;
  }

  button {
    padding: 8px 16px;
    background: var(--accent-color);
    border: none;
    border-radius: 20px;
    font-weight: 600;
    font-size: 12px;
    cursor: pointer;
    font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  }
}

.edit-actions {
  display: flex;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.save-btn {
  flex: 1;
  padding: 12px;
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

.cancel-btn {
  padding: 12px 24px;
  background: none;
  border: 2px solid var(--border-color);
  border-radius: 24px;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
