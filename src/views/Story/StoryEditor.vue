<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePhotoStore } from '@/stores/usePhotoStore'
import { useTravelStore } from '@/stores/useTravelStore'
import { useCommunityStore } from '@/stores/useCommunityStore'
import { useUserStore } from '@/stores/useUserStore'
import { PRESET_TAGS } from '@/types'
import ConfirmDialog from '@/components/common/Modal.vue'

const route = useRoute()
const router = useRouter()
const photoStore = usePhotoStore()
const travelStore = useTravelStore()
const communityStore = useCommunityStore()
const userStore = useUserStore()

const photoId = computed(() => route.params.id as string)
const photo = computed(() => photoStore.getPhotoById(photoId.value))

// 故事编辑表单
const storyTitle = ref('')
const storyContent = ref('')
const photoTitle = ref('')
const takenAt = ref('')
const selectedTags = ref<string[]>([])
const customTagInput = ref('')
const saving = ref(false)
const saved = ref(false)
const loading = ref(true)

// Toast
const toast = ref<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' })
function showToast(type: 'success' | 'error', message: string) {
  toast.value = { show: true, type, message }; setTimeout(() => { toast.value.show = false }, 3000)
}

// 图片选择
const showImagePicker = ref(false)
const storyImages = ref<{ id: string; url: string; source: 'existing' | 'uploaded' }[]>([])
const uploadingImage = ref(false)

onMounted(async () => {
  if (photoStore.photos.length === 0) await photoStore.fetchPhotos()
  if (travelStore.travels.length === 0) await travelStore.fetchTravels()
  communityStore.init()

  const p = photo.value
  if (p) {
    storyTitle.value = p.storyTitle || p.title || ''
    storyContent.value = p.story || p.description || ''
    photoTitle.value = p.title || ''
    takenAt.value = p.takenAt ? p.takenAt.slice(0, 16) : ''
    selectedTags.value = [...(p.tags || [])]
  }
  loading.value = false
})

// 从相册选择已有图片
function selectExistingPhoto(p: { id: string; url: string }) {
  if (!storyImages.value.find((i) => i.id === p.id)) {
    storyImages.value.push({ id: p.id, url: p.url || '', source: 'existing' })
  }
}

// 上传新图片
function handleUploadNew(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files?.length) return
  uploadingImage.value = true
  Array.from(files).forEach((file) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      storyImages.value.push({ id: 'img-' + Date.now() + '-' + Math.random().toString(36).slice(2, 4), url: dataUrl, source: 'uploaded' })
    }
    reader.readAsDataURL(file)
  })
  uploadingImage.value = false
  target.value = ''
}

function removeImage(idx: number) { storyImages.value.splice(idx, 1) }

// 标签
function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag); if (idx >= 0) selectedTags.value.splice(idx, 1); else selectedTags.value.push(tag)
}
function addCustomTag() { const tag = customTagInput.value.trim(); if (tag && !selectedTags.value.includes(tag)) selectedTags.value.push(tag); customTagInput.value = '' }
function removeTag(tag: string) { selectedTags.value = selectedTags.value.filter((t) => t !== tag) }

async function handleSave() {
  if (!photo.value) return
  saving.value = true

  await photoStore.updatePhoto(photoId.value, { title: photoTitle.value, takenAt: new Date(takenAt.value).toISOString(), tags: selectedTags.value })
  await photoStore.updatePhotoStory(photoId.value, { storyTitle: storyTitle.value, story: storyContent.value, tags: selectedTags.value })

  saving.value = false; saved.value = true
  // 保存后询问是否发布到社区
  showPublishConfirm.value = true
}

const showPublishConfirm = ref(false)
function confirmPublish() {
  showPublishConfirm.value = false
  communityStore.publish({
    authorId: userStore.currentUser?.id || 'user-001',
    authorName: userStore.currentUser?.username || '旅行者', authorAvatar: '',
    title: storyTitle.value, content: storyContent.value.slice(0, 200),
    story: storyContent.value,
    photoUrl: photo.value?.url || '',
    thumbnailUrl: photo.value?.thumbnailUrl || photo.value?.url || '',
    location: photo.value?.location.name || '', tags: selectedTags.value,
    createdAt: ''
  })
  showToast('success', '🎉 故事已发布到社区广场！')
}
function cancelPublish() { showPublishConfirm.value = false }

function goBack() { router.push(`/album/${photoId.value}`) }
function goToAlbum() { router.push('/album') }
</script>

<template>
  <div class="story-page">
    <!-- Toast -->
    <transition name="toast-fade">
      <div v-if="toast.show" class="toast-bar" :class="toast.type">
        <span>{{ toast.type === 'success' ? '✅' : '❌' }}</span> {{ toast.message }}
      </div>
    </transition>

    <div class="story-header">
      <button class="back-btn" @click="goBack">← 返回详情</button>
      <div class="header-right">
        <span v-if="saved" class="saved-badge">✅ 已保存</span>
        <button class="save-btn" :disabled="saving" @click="handleSave">
          {{ saving ? '💾 保存中...' : '💾 保存故事' }}
        </button>
      </div>
    </div>

    <!-- 发布确认弹窗 -->
    <ConfirmDialog v-model:visible="showPublishConfirm" title="发布到社区" content="是否将此故事发布到社区广场？📢" confirmText="发布到社区"
      cancelText="暂不" @confirm="confirmPublish" @cancel="cancelPublish" />

    <div v-if="loading" class="loading-state">📝 加载中...</div>

    <template v-else-if="photo">
      <div class="story-layout">
        <!-- 左侧：照片预览 + 图片选择 -->
        <div class="story-preview">
          <div v-if="storyImages.length > 0" class="image-stack">
            <div v-for="(img, idx) in storyImages" :key="img.id" class="stack-item"
              :style="{ zIndex: storyImages.length - idx, transform: `translateY(${idx * 4}px) rotate(${(idx - 1) * 2}deg)` }">
              <img :src="img.url" alt="照片" />
              <button class="stack-remove" @click="removeImage(idx)">✕</button>
            </div>
          </div>
          <div v-else class="preview-frame">
            <img v-if="photo.url" :src="photo.url" :alt="photo.title" />
            <div v-else class="preview-placeholder"><span>📷</span>
              <p>暂无照片</p>
            </div>
          </div>
          <div class="preview-meta">
            <span>📍 {{ photo.location.name }}</span>
            <span v-if="photo.width">📏 {{ photo.width }}×{{ photo.height }}</span>
          </div>
          <!-- 图片选择按钮 -->
          <div class="image-actions">
            <button class="img-action-btn" @click="showImagePicker = !showImagePicker">📁 {{ showImagePicker ? '关闭' :
              '从相册选择' }}</button>
            <label class="img-action-btn upload-label">📤 上传新图片 <input type="file" accept="image/*" multiple
                @change="handleUploadNew" hidden /></label>
          </div>

          <!-- 相册选择面板 -->
          <transition name="fade">
            <div v-if="showImagePicker" class="image-picker">
              <div class="picker-grid">
                <div v-for="p in photoStore.photos" :key="p.id" class="picker-item"
                  :class="{ selected: storyImages.some(i => i.id === p.id) }" @click="selectExistingPhoto(p)">
                  <img v-if="p.thumbnailUrl" :src="p.thumbnailUrl" :alt="p.title" />
                  <div v-else class="picker-placeholder">📷</div>
                  <span v-if="storyImages.some(i => i.id === p.id)" class="check-mark">✓</span>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- 右侧：编辑区 -->
        <div class="story-editor">
          <div class="editor-card cartoon-card">
            <div class="form-group"><label>📝 照片标题</label><input v-model="photoTitle" placeholder="给照片起个名字吧~" /></div>
            <div class="form-group"><label>📅 拍摄时间</label><input v-model="takenAt" type="datetime-local" /></div>
            <div class="form-group"><label>📖 故事标题</label><input v-model="storyTitle" placeholder="为这个故事起个标题~" /></div>
            <div class="form-group"><label>✍️ 旅行故事</label><textarea v-model="storyContent" rows="8"
                placeholder="在这里写下你的旅行故事...&#10;&#10;今天发生了什么有趣的事情？遇到了什么人？吃到了什么美食？&#10;用文字记录下这一刻的感动吧~"></textarea></div>

            <div class="form-group">
              <label>🏷️ 标签</label>
              <div class="tag-categories">
                <div v-for="cat in PRESET_TAGS" :key="cat.category" class="tag-category">
                  <span class="tag-cat-label">{{ cat.emoji }} {{ cat.category }}</span>
                  <div class="tag-chips"><button v-for="tag in cat.tags" :key="tag" class="tag-chip"
                      :class="{ selected: selectedTags.includes(tag) }" @click="toggleTag(tag)">{{ tag }}</button></div>
                </div>
              </div>
              <div v-if="selectedTags.length" class="selected-tags"><span v-for="tag in selectedTags" :key="tag"
                  class="selected-tag">{{ tag }}<button @click="removeTag(tag)">✕</button></span></div>
              <div class="custom-tag-input"><input v-model="customTagInput" placeholder="输入自定义标签..."
                  @keyup.enter="addCustomTag" /><button @click="addCustomTag">添加</button></div>
            </div>

            <button class="submit-btn" :disabled="saving" @click="handleSave">{{ saving ? '💾 保存中...' : saved ? '✅ 已保存！'
              : '💾 保存故事' }}</button>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="not-found"><span>😢 找不到这张照片</span><button @click="goToAlbum">返回相册</button></div>
  </div>
</template>

<style lang="scss" scoped>
.story-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;

  @include mobile {
    padding: 16px;
    padding-bottom: 80px;
  }
}

.toast-bar {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  padding: 12px 24px;
  border-radius: 0 0 16px 16px;
  font-weight: 600;
  font-size: 14px;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  box-shadow: 0 4px 16px rgba(0, 0, 0, .12);

  &.success {
    background: #e8f5e9;
    color: #2e7d32;
  }

  &.error {
    background: #ffebee;
    color: #c62828;
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all .3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-100%);
}

.story-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.back-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    color: var(--primary-color)
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.saved-badge {
  font-size: 13px;
  color: #4caf50;
  font-weight: 600;
  animation: pop-in .3s ease;
}

@keyframes pop-in {
  0% {
    transform: scale(.8);
    opacity: 0
  }

  100% {
    transform: scale(1);
    opacity: 1
  }
}

.publish-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #FF6B8A, #FFD93D);
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: all .3s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, .15)
  }
}

.save-btn {
  padding: 10px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all .3s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, .15)
  }

  &:disabled {
    opacity: .7
  }
}

.story-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;

  @include tablet-down {
    grid-template-columns: 1fr;
  }
}

.image-stack {
  height: 480px;
  position: relative;
  min-height: 250px;
  margin-bottom: 12px;
}

.stack-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 90%;
  height: 90%;
  background: white;
  padding: 10px 10px 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, .12);
  border-radius: 4px;
  transform-origin: center;

  img {
    width: 100%;
    height: 100%;
    border-radius: 2px;
    display: block;
    object-fit: contain;
  }

  .stack-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(0, 0, 0, .5);
    color: white;
    border: none;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #ff4444
    }
  }
}

.preview-frame {
  background: white;
  padding: 12px 12px 36px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, .1);
  transform: rotate(-1deg);
  border-radius: 2px;

  img {
    width: 100%;
    border-radius: 2px;
    display: block;
  }

  .preview-placeholder {
    aspect-ratio: 4/3;
    background: #f5f5f5;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    span {
      font-size: 56px
    }

    p {
      color: #aaa;
      margin-top: 8px
    }
  }
}

.preview-meta {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.image-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.img-action-btn {
  padding: 8px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-bg);
  font-size: 12px;
  cursor: pointer;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  color: var(--text-secondary);
  transition: all .2s;

  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color)
  }
}

.upload-label {
  cursor: pointer;
}

.image-picker {
  margin-top: 8px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 10px;
  max-height: 240px;
  overflow-y: auto;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.picker-item {
  aspect-ratio: 4/3;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  position: relative;
  transition: all .2s;

  &:hover {
    border-color: var(--primary-color);
  }

  &.selected {
    border-color: var(--primary-color);
    opacity: .7;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .picker-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    background: #f5f5f5;
  }

  .check-mark {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--primary-color);
    color: white;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.editor-card {
  padding: 24px;
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
  textarea {
    width: 100%;
    padding: 10px 14px;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    font-size: 14px;
    font-family: 'Nunito', 'Noto Sans SC', sans-serif;
    transition: border-color .3s;
    background: rgba(0, 0, 0, .02);
    resize: vertical;

    &:focus {
      outline: none;
      border-color: var(--primary-color)
    }
  }

  textarea {
    font-size: 14px;
    line-height: 1.8;

    &::placeholder {
      color: #ccc
    }
  }
}

.tag-categories {
  margin-bottom: 8px;
}

.tag-category {
  margin-bottom: 4px;
}

.tag-cat-label {
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
  border: 2px solid rgba(0, 0, 0, .08);
  border-radius: 14px;
  background: white;
  font-size: 11px;
  cursor: pointer;
  transition: all .2s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    border-color: var(--primary-color)
  }

  &.selected {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color)
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
    color: rgba(255, 255, 255, .7);
    cursor: pointer;
    font-size: 14px;
    padding: 0;

    &:hover {
      color: white
    }
  }
}

.custom-tag-input {
  display: flex;
  gap: 8px;
  margin-top: 6px;

  input {
    flex: 1
  }

  button {
    padding: 8px 16px;
    background: var(--accent-color);
    border: none;
    border-radius: 20px;
    font-weight: 600;
    font-size: 12px;
    cursor: pointer;
    font-family: 'Nunito', 'Noto Sans SC', sans-serif
  }
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: all .3s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  margin-top: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, .15)
  }

  &:disabled {
    opacity: .7
  }
}

.loading-state,
.not-found {
  text-align: center;
  padding: 80px 0;
  font-size: 18px;
  color: #aaa;

  button {
    margin-top: 16px;
    padding: 10px 24px;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    font-family: 'Nunito', 'Noto Sans SC', sans-serif
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .3s, transform .3s
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px)
}
</style>
