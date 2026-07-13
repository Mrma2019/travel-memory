<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const tabs = [
  { path: '/admin', label: '👤 用户管理' },
  { path: '/admin/photos', label: '📷 图片管理' },
  { path: '/admin/stories', label: '📖 故事管理' },
]

const currentTab = computed(() => route.path)

function switchTab(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="admin-page page-container">
    <div class="page-header">
      <h1 class="page-title">
        <span class="title-emoji">🛡️</span> 后台管理
      </h1>
      <p class="page-subtitle">管理系统用户、照片和故事内容</p>
    </div>

    <!-- Tab 导航 -->
    <div class="admin-tabs">
      <button v-for="tab in tabs" :key="tab.path" class="admin-tab"
        :class="{ active: currentTab === tab.path || (tab.path === '/admin' && currentTab === '/admin') }"
        @click="switchTab(tab.path)">
        {{ tab.label }}
      </button>
    </div>

    <!-- 子路由视图 -->
    <router-view />
  </div>
</template>

<style lang="scss" scoped>
.admin-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;

  @include mobile {
    padding: 16px;
    padding-bottom: 80px;
  }
}

.page-header {
  margin-bottom: 24px;
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
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.12); }
  50% { transform: scale(1); }
  75% { transform: scale(1.12); }
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.admin-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.admin-tab {
  padding: 10px 24px;
  border: 2px solid var(--border-color);
  border-radius: 24px;
  background: white;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  &.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
}
</style>
