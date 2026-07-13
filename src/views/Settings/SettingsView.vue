<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/useUserStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const themeStore = useThemeStore()
const router = useRouter()

const username = ref(userStore.currentUser?.username || '旅行者')
const email = ref(userStore.currentUser?.email || '')
const bio = ref(userStore.currentUser?.bio || '')
const hobbies = ref<string[]>([...(userStore.currentUser?.hobbies || [])])
const editing = ref(false)

// 预设爱好选项（以 checkbox 选择）
const PRESET_HOBBIES = [
  '📷 摄影', '🎨 绘画', '📖 阅读', '🎵 音乐', '🏃 跑步',
  '🚴 骑行', '🏊 游泳', '🧘 瑜伽', '🎮 游戏', '🍳 烹饪',
  '☕ 咖啡', '🍵 茶道', '✈️ 旅行', '🏔️ 登山', '🌿 园艺',
  '🐱 撸猫', '🐶 养狗', '🎬 电影', '✍️ 写作', '🧩 拼图',
]

function toggleHobby(hobby: string) {
  const idx = hobbies.value.indexOf(hobby)
  if (idx >= 0) hobbies.value.splice(idx, 1)
  else hobbies.value.push(hobby)
}

function saveProfile() {
  userStore.updateProfile({
    username: username.value,
    email: email.value,
    bio: bio.value,
    hobbies: hobbies.value,
  })
  editing.value = false
}

function handleLogout() {
  if (confirm('确定要退出登录吗？👋')) {
    userStore.logout()
    router.push('/login')
  }
}

function handleClearData() {
  if (confirm('确定要清除所有本地数据吗？此操作不可恢复！🚨')) {
    localStorage.clear()
    indexedDB.deleteDatabase('TravelMemoryDB')
    alert('数据已清除，即将刷新页面~')
    location.reload()
  }
}

function exportData() {
  const data = {
    user: userStore.currentUser,
    theme: themeStore.currentTheme,
    exportedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'travel-memory-backup.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="settings-page">
    <h1 class="page-title"><span class="title-emoji">⚙️</span> 设置</h1>

    <!-- 用户信息 -->
    <div class="section">
      <h2 class="section-title">👤 个人信息</h2>
      <div class="settings-card cartoon-card">
        <div class="setting-row">
          <span class="setting-label">用户名</span>
          <span v-if="!editing" class="setting-value">{{ username }}</span>
          <input v-else v-model="username" class="setting-input" />
        </div>
        <div class="setting-row">
          <span class="setting-label">邮箱</span>
          <span v-if="!editing" class="setting-value">{{ email || '未设置' }}</span>
          <input v-else v-model="email" class="setting-input" placeholder="输入邮箱" />
        </div>
        <div class="setting-row">
          <span class="setting-label">当前主题</span>
          <span class="setting-value">{{ themeStore.currentThemeConfig.emoji }} {{ themeStore.currentThemeConfig.name
            }}</span>
        </div>

        <!-- 个人简介 -->
        <div class="setting-block">
          <span class="setting-label">📝 个人简介</span>
          <span v-if="!editing" class="setting-value">{{ bio || '未设置' }}</span>
          <textarea v-else v-model="bio" class="setting-textarea-full" placeholder="介绍一下自己吧~" rows="3" />
        </div>

        <!-- 爱好 - 预设勾选 -->
        <div class="setting-block">
          <span class="setting-label">❤️ 爱好</span>
          <div v-if="!editing" class="setting-value">
            <span v-if="hobbies.length === 0" style="color:#ccc">未设置</span>
            <span v-else class="hobby-tags-display">
              <span v-for="(h, i) in hobbies" :key="i" class="h-tag">{{ h }}</span>
            </span>
          </div>
          <div v-else class="hobby-check-grid">
            <label v-for="h in PRESET_HOBBIES" :key="h" class="hobby-check-item"
              :class="{ checked: hobbies.includes(h) }">
              <input type="checkbox" :checked="hobbies.includes(h)" @change="toggleHobby(h)" />
              <span>{{ h }}</span>
            </label>
          </div>
        </div>

        <div class="setting-actions">
          <button v-if="!editing" class="edit-profile-btn" @click="editing = true">✏️ 编辑资料</button>
          <template v-else>
            <button class="save-profile-btn" @click="saveProfile">💾 保存</button>
            <button class="cancel-btn" @click="editing = false">取消</button>
          </template>
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="section">
      <h2 class="section-title">💾 数据管理</h2>
      <div class="settings-card cartoon-card">
        <div class="setting-action" @click="exportData">
          <span class="action-icon">📤</span>
          <div class="action-info"><span class="action-title">导出数据</span><span class="action-desc">备份旅行数据到 JSON
              文件</span>
          </div>
          <span class="action-arrow">→</span>
        </div>
        <div class="setting-action danger" @click="handleClearData">
          <span class="action-icon">🗑️</span>
          <div class="action-info"><span class="action-title">清除所有数据</span><span
              class="action-desc">删除所有本地旅行数据和照片</span>
          </div>
          <span class="action-arrow">→</span>
        </div>
      </div>
    </div>

    <!-- 关于 -->
    <div class="section">
      <h2 class="section-title">ℹ️ 关于</h2>
      <div class="settings-card cartoon-card">
        <div class="about-content">
          <span class="about-logo">🌍</span>
          <div>
            <h3>Travel Memory v1.0</h3>
            <p>卡通旅行手账 — 记录你的每一次冒险 ✈️</p>
            <p class="about-tech">Vue 3 + TypeScript + 高德地图 + ECharts</p>
          </div>
        </div>
      </div>
    </div>

    <button class="logout-btn" @click="handleLogout">🚪 退出登录</button>
  </div>
</template>

<style lang="scss" scoped>
.settings-page {
  padding: 24px;
  max-width: 700px;
  margin: 0 auto;

  @include mobile {
    padding: 16px;
    padding-bottom: 80px
  }
}

.page-title {
  font-family: $font-title;
  font-size: 28px;
  color: #2c3e50;
  margin-bottom: 28px;

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

.section {
  margin-bottom: 24px
}

.section-title {
  font-family: $font-title;
  font-size: 18px;
  color: #444;
  margin-bottom: 12px
}

.settings-card {
  padding: 4px;
  overflow: hidden
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, .04);

  &:last-child {
    border-bottom: none
  }
}

.setting-label {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  flex-shrink: 0
}

.setting-value {
  font-size: 14px;
  color: #999;
  text-align: right
}

.setting-input {
  padding: 6px 12px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  width: 200px;

  &:focus {
    outline: none;
    border-color: var(--primary-color)
  }
}

// 简介和爱好 - 垂直布局，宽度撑满
.setting-block {
  padding: 14px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, .04);
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:last-child {
    border-bottom: none
  }

  .setting-label {
    margin-bottom: 0
  }

  .setting-value {
    text-align: left
  }
}

.setting-textarea-full {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--primary-color)
  }
}

// 爱好勾选网格
.hobby-check-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px
}

.hobby-check-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 2px solid rgba(0, 0, 0, .08);
  border-radius: 10px;
  cursor: pointer;
  transition: all .2s;
  font-size: 13px;
  color: #666;

  &:hover {
    border-color: var(--primary-color)
  }

  &.checked {
    background: rgba(255, 107, 138, .08);
    border-color: var(--primary-color);
    color: var(--primary-color);
    font-weight: 600
  }

  input {
    accent-color: var(--primary-color)
  }
}

.hobby-tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 6px
}

.h-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 14px;
  background: var(--primary-color);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600
}

.setting-actions {
  display: flex;
  gap: 8px;
  padding: 14px 20px
}

.edit-profile-btn {
  padding: 8px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    opacity: .9
  }
}

.save-profile-btn {
  padding: 8px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    opacity: .9
  }
}

.cancel-btn {
  padding: 8px 20px;
  background: none;
  border: 2px solid var(--border-color);
  border-radius: 20px;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    border-color: #ff4444;
    color: #ff4444
  }
}

.setting-action {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background .2s;
  border-bottom: 1px solid rgba(0, 0, 0, .04);

  &:last-child {
    border-bottom: none
  }

  &:hover {
    background: rgba(0, 0, 0, .02)
  }

  &.danger:hover {
    background: rgba(255, 107, 107, .05)
  }
}

.action-icon {
  font-size: 24px;
  flex-shrink: 0
}

.action-info {
  flex: 1;

  .action-title {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #555
  }

  .action-desc {
    display: block;
    font-size: 12px;
    color: #aaa;
    margin-top: 2px
  }
}

.action-arrow {
  color: #ccc;
  font-size: 16px
}

.about-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;

  .about-logo {
    font-size: 48px
  }

  h3 {
    font-family: $font-title;
    font-size: 16px;
    color: #333;
    margin-bottom: 2px
  }

  p {
    font-size: 13px;
    color: #888
  }

  .about-tech {
    font-size: 11px;
    color: #bbb;
    margin-top: 2px
  }
}

.logout-btn {
  width: 100%;
  padding: 14px;
  border: 2px solid #ff6b6b;
  border-radius: $radius-xl;
  background: white;
  color: #ff6b6b;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  font-family: $font-body;
  transition: all .3s;

  &:hover {
    background: #ff6b6b;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255, 107, 107, .25)
  }
}
</style>
