<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePhotoStore } from '@/stores/usePhotoStore'
import { useTravelStore } from '@/stores/useTravelStore'
import { useCommunityStore } from '@/stores/useCommunityStore'
import { useUserStore } from '@/stores/useUserStore'
import { formatDate } from '@/utils/format'
import type { ToastState } from '@/types/common'

const route = useRoute()
const router = useRouter()
const photoStore = usePhotoStore()
const travelStore = useTravelStore()
const communityStore = useCommunityStore()
const userStore = useUserStore()

const photoId = computed(() => route.params.id as string)
const photo = computed(() => photoStore.getPhotoById(photoId.value))
const travel = computed(() => {
  if (!photo.value) return null
  return travelStore.getTravelById(photo.value.travelId)
})
const loading = ref(true)

// Toast
const toast = reactive<ToastState>({ show: false, type: 'success', message: '' })
function showToast(type: 'success' | 'error', message: string) {
  toast.show = true
  toast.type = type
  toast.message = message
  setTimeout(() => { toast.show = false }, 3000)
}

// 获取该旅行下的所有照片作为堆叠
const relatedPhotos = computed(() => {
  if (!photo.value) return []
  return photoStore.photos
    .filter((p) => p.travelId === photo.value!.travelId && p.id !== photo.value!.id)
    .slice(0, 5)
})

onMounted(async () => {
  if (photoStore.photos.length === 0) await photoStore.fetchPhotos()
  if (travelStore.travels.length === 0) await travelStore.fetchTravels()
  loading.value = false
})

function goBack() { router.push('/stories') }
function goEdit() { router.push(`/album/${photoId.value}/story`) }
function goToPhoto() { router.push(`/album/${photoId.value}`) }

function publishToCommunity() {
  if (!photo.value) return
  if (!photo.value.story) { showToast('error', '请先为照片编写故事再发布~'); return }
  communityStore.init?.()
  communityStore.publish({
    authorId: userStore.currentUser?.id || 'user-001',
    authorName: userStore.currentUser?.username || '旅行者',
    authorAvatar: '',
    title: photo.value.storyTitle || photo.value.title,
    content: (photo.value.story || '').slice(0, 200),
    story: photo.value.story || '',
    photoUrl: photo.value.url || '',
    thumbnailUrl: photo.value.thumbnailUrl || photo.value.url || '',
    location: photo.value.location.name || '',
    tags: photo.value.tags || [],
    createdAt: ''
  })
  showToast('success', '🎉 故事已发布到社区广场！')
}
</script>

<template>
  <div class="story-detail-page">
    <!-- Toast -->
    <Toast v-model:show="toast.show" :type="toast.type" :message="toast.message" />

    <button class="back-btn" @click="goBack">← 返回故事列表</button>

    <div v-if="loading" class="loading-state">📖 加载中...</div>

    <template v-else-if="photo">
      <div class="story-detail-layout">
        <!-- 左侧：照片堆叠 -->
        <div class="story-photo">
          <div class="photo-stack">
            <div v-if="relatedPhotos.length > 0" class="stacked">
              <div v-for="(rp, idx) in relatedPhotos" :key="rp.id" class="stack-layer"
                :style="{ zIndex: relatedPhotos.length - idx, transform: `translateX(${idx * 3}px) translateY(${idx * 4}px) rotate(${(idx - 1) * 1.5}deg)` }">
                <img v-if="rp.thumbnailUrl" :src="rp.thumbnailUrl" :alt="rp.title" />
                <div v-else class="stack-placeholder">📷</div>
              </div>
            </div>
            <div class="photo-frame">
              <img v-if="photo.url" :src="photo.url" :alt="photo.title" class="story-img" />
              <div v-else class="photo-placeholder"><span>📷</span></div>
            </div>
          </div>
          <div class="photo-meta">
            <span>📍 {{ photo.location.name }}</span>
            <span>📅 {{ formatDate(photo.takenAt) }}</span>
            <span v-if="relatedPhotos.length" class="photo-count-badge">+{{ relatedPhotos.length }}张</span>
          </div>
        </div>

        <!-- 右侧：故事 -->
        <div class="story-body">
          <div class="story-card cartoon-card">
            <div class="story-header">
              <span class="story-emoji">📖</span>
              <div>
                <h1 class="story-main-title">{{ photo.storyTitle || photo.title }}</h1>
                <div class="story-date-line">
                  <span>✍️ {{ formatDate(photo.storyUpdatedAt || photo.createdAt) }}</span>
                  <span v-if="travel">🧳 {{ travel.title }}</span>
                </div>
              </div>
            </div>

            <div class="story-content">
              <p>{{ photo.story || '暂无故事内容' }}</p>
            </div>

            <div v-if="photo.tags.length" class="story-tags-section">
              <h4>🏷️ 标签</h4>
              <div class="st-tags">
                <span v-for="tag in photo.tags" :key="tag" class="st-tag">{{ tag }}</span>
              </div>
            </div>

            <div class="story-actions">
              <button class="action-btn edit-btn" @click="goEdit">✏️ 编辑故事</button>
              <button class="action-btn back-btn-secondary" @click="goToPhoto">📷 查看照片</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="not-found">
      <span>😢 找不到这个故事</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.story-detail-page {
  padding: 24px;
  max-width: 1100px;
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

  &:hover {
    color: var(--primary-color);
  }
}

.story-detail-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;

  @include tablet-down {
    grid-template-columns: 1fr;
  }
}

.story-photo {
  .photo-stack {
    position: relative;
    min-height: 300px;
  }

  .stacked {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .stack-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 85%;
    z-index: 1;
    background: white;
    padding: 6px 6px 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .1);
    border-radius: 3px;
    transition: transform .3s;

    img {
      width: 100%;
      border-radius: 2px;
      display: block;
    }

    .stack-placeholder {
      aspect-ratio: 4/3;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    &:hover {
      transform: translateX(10px) translateY(-4px) !important;
      z-index: 10 !important;
    }
  }

  .photo-frame {
    background: white;
    padding: 14px 14px 40px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, .1);
    border-radius: 4px;
    transform: rotate(-1deg);
    position: relative;
    z-index: 5;
  }

  .story-img {
    width: 100%;
    border-radius: 2px;
    display: block;
  }

  .photo-placeholder {
    aspect-ratio: 4/3;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 56px;
  }

  .photo-meta {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    font-size: 12px;
    color: var(--text-secondary);
    align-items: center;
  }

  .photo-count-badge {
    font-size: 11px;
    padding: 2px 10px;
    background: var(--primary-color);
    color: white;
    border-radius: 20px;
    font-weight: 600;
  }
}

.story-card {
  padding: 28px;
}

.story-header {
  display: flex;
  gap: 14px;
  margin-bottom: 20px;
  align-items: flex-start;

  .story-emoji {
    font-size: 36px;
  }
}

.story-main-title {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 24px;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.story-date-line {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.story-content {
  p {
    font-size: 15px;
    color: var(--text-primary);
    line-height: 1.9;
    white-space: pre-wrap;
  }
}

.story-tags-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);

  h4 {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }
}

.st-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.st-tag {
  padding: 4px 14px;
  background: var(--primary-color);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.story-actions {
  display: flex;
  gap: 10px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.action-btn {
  padding: 10px 20px;
  border-radius: 24px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
}

.publish-btn {
  background: linear-gradient(135deg, #FF6B8A, #FFD93D);
  color: white;
  border: none;

  &:hover {
    opacity: .9;
    transform: translateY(-2px);
  }
}

.publish-btn {
  background: linear-gradient(135deg, #FF6B8A, #FFD93D);
  color: white;
  border: none;

  &:hover {
    opacity: .9;
    transform: translateY(-2px);
  }
}

.back-btn-secondary {
  background: none;
  border: 2px solid var(--border-color);
  color: var(--text-secondary);

  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
}

.loading-state,
.not-found {
  text-align: center;
  padding: 80px 0;
  font-size: 18px;
  color: #aaa;
}
</style>
