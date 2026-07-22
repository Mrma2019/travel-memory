<script setup lang="ts">
defineOptions({ name: 'CommunityView' })
import { ref, onMounted, computed } from 'vue'
import { useCommunityStore } from '@/stores/useCommunityStore'
import { useUserStore } from '@/stores/useUserStore'
import type { CommunityPost } from '@/types/community'

const communityStore = useCommunityStore()
const userStore = useUserStore()
const loading = ref(true)

const toast = ref<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' })
function showToast(type: 'success' | 'error', message: string) {
  toast.value = { show: true, type, message }
  setTimeout(() => { toast.value.show = false }, 3000)
}

const selectedPost = ref<CommunityPost | null>(null)
const commentInput = ref('')
const currentUserId = computed(() => userStore.currentUser?.id || 'user-001')
const currentUserName = computed(() => userStore.currentUser?.username || '旅行者')

// 图片加载失败 tracking
const imgErrors = ref<Set<string>>(new Set())
function onImgError(postId: string) { imgErrors.value.add(postId) }
function onDetailImgError() { /* handled via detailImgFailed ref */ }
const detailImgFailed = ref(false)

onMounted(() => {
  communityStore.init()
  loading.value = false
})

const activeTab = ref<'hot' | 'all'>('hot')
const displayedPosts = computed(() => {
  if (activeTab.value === 'hot') {
    return [...communityStore.posts].sort((a, b) => (b.likes + b.comments.length * 2) - (a.likes + a.comments.length * 2))
  }
  return communityStore.posts
})

function handleLike(post: CommunityPost) { communityStore.toggleLike(post.id, currentUserId.value) }

function handleComment(post: CommunityPost) {
  if (!commentInput.value.trim()) return
  communityStore.addComment(post.id, {
    userId: currentUserId.value, userName: currentUserName.value, userAvatar: '', content: commentInput.value.trim(),
  })
  commentInput.value = ''
  const updated = communityStore.posts.find((p) => p.id === post.id)
  if (updated) selectedPost.value = updated
}

function openDetail(post: CommunityPost) {
  selectedPost.value = post
  detailImgFailed.value = false
  currentPhotoIndex.value = 0
}

// 轮播图：合并 photos 数组或退化为单张 photoUrl
const carouselPhotos = computed(() => {
  const p = selectedPost.value
  if (!p) return []
  if (p.photos && p.photos.length > 0) return p.photos
  if (p.photoUrl) return [p.photoUrl]
  return []
})
const currentPhotoIndex = ref(0)
function prevPhoto() {
  if (currentPhotoIndex.value > 0) currentPhotoIndex.value--
  else currentPhotoIndex.value = carouselPhotos.value.length - 1
}
function nextPhoto() {
  if (currentPhotoIndex.value < carouselPhotos.value.length - 1) currentPhotoIndex.value++
  else currentPhotoIndex.value = 0
}
function goToPhoto(idx: number) { currentPhotoIndex.value = idx }

// 触摸滑动
let touchStartX = 0
function onTouchStart(e: TouchEvent) { touchStartX = e.touches[0].clientX }
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(dx) > 50) {
    if (dx > 0) prevPhoto()
    else nextPhoto()
  }
}

const showUserProfile = ref(false)
const profileUser = ref<{ name: string; avatar: string; bio: string; hobbies: string[] } | null>(null)
function viewUser(post: CommunityPost) {
  profileUser.value = {
    name: post.authorName, avatar: post.authorAvatar,
    bio: post.authorName === currentUserName.value ? (userStore.currentUser?.bio || '未设置') : '热爱旅行的旅行者 🌍',
    hobbies: post.authorName === currentUserName.value ? (userStore.currentUser?.hobbies || []) : ['✈️ 旅行', '📷 摄影'],
  }
  showUserProfile.value = true
}
</script>

<template>
  <div class="community-full-page">
    <transition name="toast-fade">
      <div v-if="toast.show" class="toast-bar" :class="toast.type">
        <span>{{ toast.type === 'success' ? '✅' : '❌' }}</span> {{ toast.message }}
      </div>
    </transition>

    <div class="page-header">
      <h1 class="page-title"><span class="title-emoji">🌐</span> 社区广场</h1>
      <div class="tab-bar">
        <button :class="{ active: activeTab === 'hot' }" @click="activeTab = 'hot'">🔥 热门</button>
        <button :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">📋 全部</button>
      </div>
    </div>

    <div v-if="!loading" class="waterfall">
      <div v-for="post in displayedPosts" :key="post.id" class="w-post cartoon-card" @click="openDetail(post)">
        <div v-if="post.thumbnailUrl && !imgErrors.has(post.id)" class="w-img">
          <img :src="post.thumbnailUrl" :alt="post.title" loading="lazy" @error="onImgError(post.id)" />
        </div>
        <div v-else class="w-img-fallback">📷 暂无图片</div>

        <div class="w-body">
          <h3 class="w-title">{{ post.title }}</h3>
          <p class="w-excerpt">{{ post.content.slice(0, 100) }}{{ post.content.length > 100 ? '...' : '' }}</p>
          <div class="w-meta">
            <span class="w-author" @click.stop="viewUser(post)">
              <span class="w-avatar">🧑‍🚀</span> {{ post.authorName }}
            </span>
            <span v-if="post.location" class="w-loc">📍</span>
          </div>
          <div class="w-actions">
            <button class="w-btn" :class="{ liked: post.likedBy.includes(currentUserId) }"
              @click.stop="handleLike(post)">
              {{ post.likedBy.includes(currentUserId) ? '❤️' : '🤍' }} {{ post.likes }}
            </button>
            <button class="w-btn">💬 {{ post.comments.length }}</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">🌐 加载社区中...</div>

    <!-- 详情弹窗 -->
    <Teleport to="body">
      <div v-if="selectedPost" class="detail-overlay" @click.self="selectedPost = null">
        <div class="detail-panel">
          <button class="detail-close" @click="selectedPost = null">✕</button>

          <div class="detail-author-row" @click="viewUser(selectedPost)">
            <div class="author-avatar large"><span>🧑‍🚀</span></div>
            <div>
              <h3>{{ selectedPost.authorName }}</h3>
              <span class="detail-date">{{ new Date(selectedPost.publishedAt).toLocaleDateString('zh-CN') }}</span>
            </div>
          </div>

          <!-- 图片区：轮播图 -->
          <div v-if="carouselPhotos.length > 1" class="carousel-area" @touchstart="onTouchStart" @touchend="onTouchEnd">
            <div class="carousel-track" :style="{ transform: `translateX(-${currentPhotoIndex * 100}%)` }">
              <div v-for="(photo, idx) in carouselPhotos" :key="idx" class="carousel-slide">
                <img :src="photo" :alt="selectedPost.title" @error="detailImgFailed = true" />
              </div>
            </div>
            <!-- 左右箭头 -->
            <button class="carousel-arrow carousel-prev" @click="prevPhoto">❮</button>
            <button class="carousel-arrow carousel-next" @click="nextPhoto">❯</button>
            <!-- 指示点 -->
            <div class="carousel-dots">
              <span v-for="(_, idx) in carouselPhotos" :key="idx"
                class="carousel-dot" :class="{ active: idx === currentPhotoIndex }"
                @click="goToPhoto(idx)"></span>
            </div>
          </div>
          <div v-else-if="carouselPhotos.length === 1 && !detailImgFailed" class="detail-photo-area">
            <img :src="carouselPhotos[0]" :alt="selectedPost.title" @error="detailImgFailed = true"
              class="detail-main-img" />
          </div>
          <div v-else class="detail-photo-fallback">📷 暂无图片</div>

          <div class="detail-body">
            <h1 class="detail-title">{{ selectedPost.title }}</h1>
            <div class="detail-meta"><span>📍 {{ selectedPost.location || '未知地点' }}</span></div>
            <div class="detail-content">
              <p>{{ selectedPost.story || selectedPost.content }}</p>
            </div>
            <div v-if="selectedPost.tags?.length" class="detail-tags">
              <span v-for="tag in selectedPost.tags" :key="tag" class="dtag">{{ tag }}</span>
            </div>
          </div>

          <div class="detail-like-row">
            <button class="like-btn" :class="{ liked: selectedPost.likedBy.includes(currentUserId) }"
              @click="handleLike(selectedPost)">
              {{ selectedPost.likedBy.includes(currentUserId) ? '❤️' : '🤍' }}
            </button>
            <span>{{ selectedPost.likes }} 次点赞</span>
          </div>

          <div class="detail-comments">
            <h4>💬 评论 ({{ selectedPost.comments.length }})</h4>
            <div class="comments-list">
              <div v-for="cmt in selectedPost.comments" :key="cmt.id" class="comment-item">
                <div class="cmt-avatar"><span>🧑‍🚀</span></div>
                <div class="cmt-body">
                  <span class="cmt-name">{{ cmt.userName }}</span>
                  <p class="cmt-text">{{ cmt.content }}</p>
                  <span class="cmt-date">{{ new Date(cmt.createdAt).toLocaleDateString('zh-CN') }}</span>
                </div>
              </div>
            </div>
            <div class="cmt-input-row">
              <input v-model="commentInput" placeholder="写下你的评论..." @keyup.enter="handleComment(selectedPost)" />
              <button @click="handleComment(selectedPost)">发送</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 用户弹窗 -->
    <Teleport to="body">
      <div v-if="showUserProfile" class="profile-overlay" @click.self="showUserProfile = false">
        <div class="profile-card cartoon-card">
          <button class="profile-close" @click="showUserProfile = false">✕</button>
          <div class="profile-avatar"><span>🧑‍🚀</span></div>
          <h2 class="profile-name">{{ profileUser?.name }}</h2>
          <p class="profile-bio">{{ profileUser?.bio }}</p>
          <div v-if="profileUser?.hobbies?.length" class="profile-hobbies">
            <span v-for="h in profileUser.hobbies" :key="h" class="ph-tag">{{ h }}</span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.community-full-page {
  padding: 20px 24px 32px;
  margin: 0;

  @include mobile {
    padding: 60px 12px 80px;
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

.page-header {
  margin-bottom: 20px;
  text-align: center;
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

.tab-bar {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 14px;

  button {
    padding: 8px 24px;
    border: 2px solid var(--border-color);
    border-radius: 20px;
    background: var(--card-bg);
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    color: var(--text-secondary);
    font-family: 'Nunito', 'Noto Sans SC', sans-serif;
    transition: all .2s;

    &.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    &:hover:not(.active) {
      border-color: var(--primary-color);
    }
  }
}

.waterfall {
  columns: 5 280px;
  gap: 16px;

  @media (max-width: 900px) {
    columns: 2 200px;
  }

  @include mobile {
    columns: 2 160px;
  }
}

.w-post {
  break-inside: avoid;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all .3s;
  overflow: hidden;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, .1);
  }
}

.w-img {
  width: 100%;
  max-height: 360px;
  overflow: hidden;

  img {
    width: 100%;
    display: block;
  }
}

.w-img-fallback {
  width: 100%;
  height: 120px;
  background: linear-gradient(135deg, #e0e0e0, #f0f0f0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #999;
}

.w-body {
  padding: 14px;
}

.w-title {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 15px;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.w-excerpt {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 10px;
}

.w-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.w-author {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: var(--primary-color)
  }
}

.w-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: white;
}

.w-loc {
  font-size: 12px;
  color: #bbb;
}

.w-actions {
  display: flex;
  gap: 14px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

.w-btn {
  background: none;
  border: none;
  font-size: 13px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 8px;
  transition: all .2s;
  color: var(--text-secondary);
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    background: rgba(0, 0, 0, .04)
  }
}

.w-btn.liked {
  color: #e74c3c;
}

.loading-state {
  text-align: center;
  padding: 80px 0;
  font-size: 18px;
  color: #aaa;
}

// 详情弹窗
.detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(0, 0, 0, .45);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fade-in .2s ease;
}

@keyframes fade-in {
  from {
    opacity: 0
  }

  to {
    opacity: 1
  }
}

.detail-panel {
  width: 560px;
  max-width: 92vw;
  max-height: 80vh;
  border-radius: 20px;
  overflow-y: auto;
  padding: 28px;
  position: relative;
  background: var(--card-bg, #fff);
  box-shadow: 0 16px 48px rgba(0, 0, 0, .15);
  border: 1px solid var(--border-color);

  @include mobile {
    padding: 60px 16px 80px;
    max-height: 90vh;
    border-radius: 20px 20px 0 0;
  }
}

.detail-close {
  position: absolute;
  top: 14px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, .06);
  border: none;
  font-size: 18px;
  cursor: pointer;
  z-index: 501;
  color: #666;

  &:hover {
    background: rgba(0, 0, 0, .12)
  }
}

.detail-author-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  cursor: pointer;
}

.author-avatar.large {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.detail-date {
  font-size: 11px;
  color: #bbb;
}

.detail-photo-area {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 18px;
}

.detail-main-img {
  width: 100%;
  display: block;
  border-radius: 12px;
}

// 轮播图
.carousel-area {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 18px;
  background: #1a1a1a;
  user-select: none;
}

.carousel-track {
  display: flex;
  transition: transform .35s cubic-bezier(.25, .8, .25, 1);
}

.carousel-slide {
  min-width: 100%;
  aspect-ratio: 4 / 3;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, .75);
  color: #333;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity .25s, background .2s;
  z-index: 2;

  &.carousel-prev { left: 10px; }
  &.carousel-next { right: 10px; }

  &:hover { background: rgba(255, 255, 255, .95); }
}

.carousel-area:hover .carousel-arrow { opacity: 1; }

.carousel-dots {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 2;
}

.carousel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, .5);
  cursor: pointer;
  transition: all .25s;

  &.active {
    background: #fff;
    width: 22px;
    border-radius: 4px;
  }
}

.detail-photo-fallback {
  width: 100%;
  height: 150px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #999;
  margin-bottom: 18px;
}

.detail-body {
  margin-bottom: 20px;
}

.detail-title {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 22px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.detail-meta {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.detail-content p {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.8;
  white-space: pre-wrap;
}

.detail-tags {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.dtag {
  padding: 4px 14px;
  background: var(--primary-color);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.detail-like-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 20px;
  font-size: 15px;
  color: var(--text-secondary);
}

.like-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  transition: transform .2s;

  &:hover {
    transform: scale(1.2)
  }
}

.detail-comments {
  h4 {
    font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
    font-size: 16px;
    color: var(--text-primary);
    margin-bottom: 12px;
  }
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 16px;
}

.comment-item {
  display: flex;
  gap: 10px;
}

.cmt-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: white;
  flex-shrink: 0;
}

.cmt-body {
  flex: 1;
}

.cmt-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary);
}

.cmt-text {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 4px 0;
}

.cmt-date {
  font-size: 10px;
  color: #ccc;
}

.cmt-input-row {
  display: flex;
  gap: 8px;

  input {
    flex: 1;
    padding: 10px 14px;
    border: 2px solid var(--border-color);
    border-radius: 20px;
    font-size: 13px;
    font-family: 'Nunito', 'Noto Sans SC', sans-serif;

    &:focus {
      outline: none;
      border-color: var(--primary-color)
    }
  }

  button {
    padding: 10px 20px;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 20px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  }
}

// 用户弹窗
.profile-overlay {
  position: fixed;
  inset: 0;
  z-index: 600;
  background: rgba(0, 0, 0, .35);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  animation: fade-in .2s ease;
}

.profile-card {
  width: 360px;
  max-width: 90vw;
  padding: 28px;
  text-align: center;
  position: relative;
}

.profile-close {
  position: absolute;
  top: 12px;
  right: 14px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #bbb;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: white;
  margin: 0 auto 12px;
}

.profile-name {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.profile-bio {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 12px;
}

.profile-hobbies {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
}

.ph-tag {
  padding: 4px 14px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
</style>
