<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useResponsive } from '@/hooks/useResponsive'
import type { User } from '@/types'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const themeStore = useThemeStore()
const { isMobile } = useResponsive()

const isAdmin = computed(() => userStore.currentUser?.role === 'admin')

const menuItems = [
  { path: '/community', label: '社区广场', icon: '🌐', highlight: true },
  { path: '/', label: '首页', icon: '✈️' },
  { path: '/map', label: '世界地图', icon: '🗺️' },
  { path: '/album', label: '我的旅行', icon: '📷' },
  { path: '/stories', label: '旅行故事', icon: '📖' },
  { path: '/timeline', label: '时间轴', icon: '⏳' },
  { path: '/settings', label: '设置', icon: '⚙️' },
]

const currentPath = computed(() => route.path)
const isNeonTheme = computed(() => themeStore.currentTheme === 'scifi')
const currentConfig = computed(() => themeStore.currentThemeConfig)

const showUserModal = ref(false)
const showMobileDrawer = ref(false)

const user = computed<User | null>(() => userStore.currentUser)
const createdAt = computed(() => {
  if (!user.value?.createdAt) return ''
  return new Date(user.value.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
})

function navigate(path: string) { router.push(path); showMobileDrawer.value = false }
function handleLogout() { userStore.logout(); router.push('/login'); showMobileDrawer.value = false }
</script>

<template>
  <!-- PC端侧边栏 -->
  <aside v-if="!isMobile()" class="sidebar" :class="{ 'neon-sidebar': isNeonTheme }">
    <div class="sidebar-logo" @click="navigate('/')">
      <span class="logo-icon">🌍</span>
      <div class="logo-text">
        <span class="logo-title">Travel Memory</span>
        <span class="logo-sub">我的旅行手账</span>
      </div>
    </div>
    <div class="sidebar-user" @click="showUserModal = true">
      <div class="user-avatar"><span>🧑‍🚀</span></div>
      <div class="user-info">
        <span class="user-name">{{ user?.username || '旅行者' }}</span>
        <span class="user-theme">{{ currentConfig.emoji }} {{ currentConfig.name }}</span>
      </div>
      <span class="user-arrow">›</span>
    </div>
    <nav class="sidebar-nav">
      <div v-for="item in menuItems" :key="item.path"
        class="nav-item" :class="{ active: currentPath === item.path, highlight: item.highlight }"
        @click="navigate(item.path)">
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
        <span v-if="currentPath === item.path" class="nav-dot">●</span>
      </div>
      <div v-if="isAdmin" class="nav-item" :class="{ active: currentPath.startsWith('/admin') }"
        @click="navigate('/admin')">
        <span class="nav-icon">🛡️</span>
        <span class="nav-label">后台管理</span>
        <span v-if="currentPath.startsWith('/admin')" class="nav-dot">●</span>
      </div>
    </nav>
    <div class="sidebar-footer">
      <div class="footer-decoration"><span class="cloud">☁️</span><span class="plane">✈️</span><span class="cloud">☁️</span></div>
      <button class="logout-btn" @click="handleLogout">🚪 退出登录</button>
    </div>
  </aside>

  <!-- ============ 移动端顶部导航栏 ============ -->
  <header v-if="isMobile()" class="mobile-topbar" :class="{ 'neon-topbar': isNeonTheme }">
    <button class="topbar-menu-btn" @click="showMobileDrawer = true">
      <span class="ham-line"></span><span class="ham-line"></span><span class="ham-line"></span>
    </button>
    <span class="topbar-title">Travel Memory</span>
    <button class="topbar-avatar-btn" @click="showUserModal = true">
      <span>🧑‍🚀</span>
    </button>
  </header>

  <!-- ============ 移动端侧滑抽屉 ============ -->
  <Teleport to="body">
    <div v-if="isMobile() && showMobileDrawer" class="drawer-overlay" @click.self="showMobileDrawer = false">
      <aside class="mobile-drawer" :class="{ 'neon-sidebar': isNeonTheme, open: showMobileDrawer }">
        <div class="drawer-header">
          <span>🌍 Travel Memory</span>
          <button @click="showMobileDrawer = false">✕</button>
        </div>
        <div class="drawer-user" @click="showUserModal = true; showMobileDrawer = false">
          <div class="user-avatar"><span>🧑‍🚀</span></div>
          <div class="user-info">
            <span class="user-name">{{ user?.username || '旅行者' }}</span>
            <span class="user-theme">{{ currentConfig.emoji }} {{ currentConfig.name }}</span>
          </div>
        </div>
        <nav class="drawer-nav">
          <div v-for="item in menuItems" :key="item.path"
                    class="drawer-item" :class="{ active: currentPath === item.path, highlight: item.highlight }"
            @click="navigate(item.path)">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </div>
          <div v-if="isAdmin" class="drawer-item" :class="{ active: currentPath.startsWith('/admin') }"
            @click="navigate('/admin')">
            <span class="nav-icon">🛡️</span>
            <span class="nav-label">后台管理</span>
          </div>
        </nav>
        <button class="drawer-logout" @click="handleLogout">🚪 退出登录</button>
      </aside>
    </div>
  </Teleport>

  <!-- ============ 用户信息弹窗 ============ -->
  <Teleport to="body">
    <div v-if="showUserModal" class="modal-overlay" @click.self="showUserModal = false">
      <div class="user-modal cartoon-card">
        <button class="modal-close" @click="showUserModal = false">✕</button>
        <div class="modal-header">
          <div class="modal-avatar"><span>🧑‍🚀</span></div>
          <h2 class="modal-name">{{ user?.username || '旅行者' }}</h2>
          <span class="modal-badge">🌟 旅行者</span>
        </div>
        <div class="modal-body">
          <div class="modal-row"><span class="modal-icon">📧</span><span class="modal-label">邮箱</span><span class="modal-value">{{ user?.email || '未设置' }}</span></div>
          <div class="modal-row"><span class="modal-icon">🎨</span><span class="modal-label">主题偏好</span><span class="modal-value">{{ currentConfig.emoji }} {{ currentConfig.name }}</span></div>
          <div class="modal-row bio-row"><span class="modal-icon">📝</span><span class="modal-label">简介</span><span class="modal-value">{{ user?.bio || '这个人很懒，还没写简介~' }}</span></div>
          <div class="modal-row hobbies-row"><span class="modal-icon">❤️</span><span class="modal-label">爱好</span>
            <span class="modal-value">
              <span v-if="user?.hobbies?.length" class="hobby-tags"><span v-for="h in user.hobbies" :key="h" class="hobby-tag">{{ h }}</span></span>
              <span v-else style="color:#ccc">未设置</span>
            </span>
          </div>
          <div class="modal-row"><span class="modal-icon">📅</span><span class="modal-label">注册时间</span><span class="modal-value">{{ createdAt }}</span></div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
// ---- PC 侧边栏 ----
.sidebar {
  position: fixed; left: 0; top: 0; bottom: 0; width: $sidebar-width;
  background: var(--sidebar-bg, linear-gradient(180deg, #FF6B8A, #FF8EAB));
  display: flex; flex-direction: column; padding: 20px 0;
  z-index: 100; overflow: hidden; transition: background 0.4s ease;
  &::before { content: ''; position: absolute; top: -50px; right: -30px; width: 150px; height: 150px; background: rgba(255,255,255,0.08); border-radius: 50%; pointer-events: none; }
  &.neon-sidebar { border-right: 1px solid rgba(0,229,255,0.2); box-shadow: 2px 0 20px rgba(0,229,255,0.05);
    &::before { background: rgba(0,229,255,0.05); box-shadow: 0 0 60px rgba(0,229,255,0.1); }
  }
}

.sidebar-logo { display: flex; align-items: center; gap: 10px; padding: 0 20px 20px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.15); margin-bottom: 12px;
  .logo-icon { font-size: 36px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
  .logo-text { display: flex; flex-direction: column; }
  .logo-title { font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive; font-size: 16px; color: white; letter-spacing: 1px; }
  .logo-sub { font-size: 11px; color: rgba(255,255,255,0.7); }
}

.sidebar-user { display: flex; align-items: center; gap: 10px; padding: 12px 20px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s;
  &:hover { background: rgba(255,255,255,0.1); }
  .user-avatar { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; font-size: 22px; border: 2px solid rgba(255,255,255,0.4); flex-shrink: 0; }
  .user-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
  .user-name { font-weight: 700; color: white; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-theme { font-size: 11px; color: rgba(255,255,255,0.7); }
  .user-arrow { color: rgba(255,255,255,0.5); font-size: 22px; flex-shrink: 0; }
}

.sidebar-nav { flex: 1; padding: 0 12px; display: flex; flex-direction: column; gap: 4px; }

.nav-item { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 14px; cursor: pointer; transition: all 0.25s ease; color: rgba(255,255,255,0.8);
  &.highlight { background: linear-gradient(135deg, var(--accent-color, #FFD93D), rgba(255,255,255,0.1)); border: 1px solid rgba(255,255,255,0.3); color: white; font-weight: 700;
    &:hover { background: linear-gradient(135deg, var(--accent-color, #FFD93D), rgba(255,255,255,0.2)); }
  }
  &:hover { background: rgba(255,255,255,0.15); color: white; }
  &.active { background: rgba(255,255,255,0.2); color: white; font-weight: 700; }
  .nav-icon { font-size: 20px; }
  .nav-label { font-size: 14px; }
  .nav-dot { margin-left: auto; font-size: 8px; color: #FFD93D; }
}

.sidebar-footer { padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.1);
  .footer-decoration { display: flex; justify-content: center; gap: 8px; font-size: 16px; opacity: 0.5; margin-bottom: 12px;
    .plane { animation: plane-bob 2s ease-in-out infinite; }
  }
  .logout-btn { width: 100%; padding: 10px; border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); font-size: 13px; cursor: pointer; transition: all 0.25s; font-family: 'Nunito', 'Noto Sans SC', sans-serif;
    &:hover { background: rgba(255,255,255,0.2); color: white; }
  }
}

@keyframes plane-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

// ---- 移动端顶部导航栏 ----
.mobile-topbar {
  position: fixed; top: 0; left: 0; right: 0; height: 52px; z-index: 200;
  background: var(--card-bg, rgba(255,255,255,0.97));
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 12px; transition: background 0.3s;
  &.neon-topbar { background: rgba(10,14,39,0.95); border-bottom-color: rgba(0,229,255,0.2); }
}

.topbar-menu-btn {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(0,0,0,0.04); border: none;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px; cursor: pointer;
  .neon-topbar & { background: rgba(0,229,255,0.1); }
  .ham-line { width: 16px; height: 2px; border-radius: 2px; background: var(--text-secondary);
    .neon-topbar & { background: rgba(0,229,255,0.7); }
  }
}

.topbar-title {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 15px; color: var(--text-primary);
}

.topbar-avatar-btn {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border: 2px solid rgba(255,255,255,0.5);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

// ---- 抽屉 ----
.drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 300; backdrop-filter: blur(2px); animation: fade-in 0.25s ease; }
@keyframes fade-in { from{opacity:0} to{opacity:1} }

.mobile-drawer {
  position: fixed; left: 0; top: 0; bottom: 0; width: 260px;
  background: var(--sidebar-bg, linear-gradient(180deg, #FF6B8A, #FF8EAB));
  display: flex; flex-direction: column; z-index: 301;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto; padding-top: env(safe-area-inset-top);
  &.open { transform: translateX(0); }
  &.neon-sidebar { border-right: 1px solid rgba(0,229,255,0.2); }
}

.drawer-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.15);
  span { font-family: 'Fredoka One','ZCOOL KuaiLe',cursive; font-size: 16px; color: white; }
  button { background: none; border: none; color: rgba(255,255,255,0.7); font-size: 20px; cursor: pointer; &:hover{color:white} }
}

.drawer-user { display: flex; align-items: center; gap: 10px; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.1);
  .user-avatar { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; font-size: 22px; border: 2px solid rgba(255,255,255,0.4); flex-shrink: 0; }
  .user-info { display: flex; flex-direction: column; }
  .user-name { font-weight: 700; color: white; font-size: 14px; }
  .user-theme { font-size: 11px; color: rgba(255,255,255,0.7); }
}

.drawer-nav { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 2px; }

.drawer-item { display: flex; align-items: center; gap: 10px; padding: 13px 16px; border-radius: 14px; cursor: pointer; color: rgba(255,255,255,0.8); transition: all 0.2s;
  &.highlight { background: linear-gradient(135deg, var(--accent-color, #FFD93D), rgba(255,255,255,0.1)); border: 1px solid rgba(255,255,255,0.3); color: white; font-weight: 700; }
  &:hover { background: rgba(255,255,255,0.15); color: white; }
  &.active { background: rgba(255,255,255,0.2); color: white; font-weight: 700; }
  .nav-icon { font-size: 20px; }
  .nav-label { font-size: 14px; }
}

.drawer-logout { margin: 12px 16px 24px; padding: 12px; border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); font-size: 13px; cursor: pointer; font-family: 'Nunito','Noto Sans SC',sans-serif;
  &:hover { background: rgba(255,255,255,0.2); color: white; }
}

// ---- 用户弹窗 ----
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); animation: fade-in 0.2s ease; }
.user-modal { width: 380px; max-width: 90vw; padding: 28px; position: relative; animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes pop-in { from{transform:scale(0.9);opacity:0} to{transform:scale(1);opacity:1} }
.modal-close { position: absolute; top: 12px; right: 14px; background: none; border: none; font-size: 18px; cursor: pointer; color: #bbb; &:hover{color:#333} }
.modal-header { text-align: center; margin-bottom: 24px; }
.modal-avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg,var(--primary-color),var(--accent-color)); display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 10px; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.modal-name { font-family: 'Fredoka One','ZCOOL KuaiLe',cursive; font-size: 20px; color: var(--text-primary); margin-bottom: 4px; }
.modal-badge { font-size: 11px; padding: 3px 12px; background: var(--primary-color); color: white; border-radius: 20px; font-weight: 600; }
.modal-body { display: flex; flex-direction: column; gap: 12px; }
.modal-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(0,0,0,0.02); border-radius: 12px; }
.modal-icon { font-size: 18px; flex-shrink: 0; }
.modal-label { font-size: 12px; color: var(--text-secondary); width: 60px; flex-shrink: 0; }
.modal-value { font-size: 13px; color: var(--text-primary); font-weight: 600; }
.bio-row .modal-value { font-weight: 400; font-style: italic; color: var(--text-secondary); line-height: 1.5; max-height: 60px; overflow-y: auto; }
.hobbies-row .modal-value { display: flex; flex-wrap: wrap; }
.hobby-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.hobby-tag { display: inline-block; padding: 3px 12px; background: linear-gradient(135deg,var(--primary-color),var(--accent-color)); color: white; border-radius: 20px; font-size: 12px; font-weight: 600; }
</style>
