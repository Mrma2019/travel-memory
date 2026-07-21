import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/LoginView.vue'),
    meta: { noAuth: true, title: '登录' },
  },
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/DashboardView.vue'),
        meta: { icon: '✈️', title: '首页' },
      },
      {
        path: 'map',
        name: 'Map',
        component: () => import('@/views/Map/MapView.vue'),
        meta: { icon: '🗺️', title: '世界地图' },
      },
      {
        path: 'album',
        name: 'Album',
        component: () => import('@/views/Album/AlbumView.vue'),
        meta: { icon: '📷', title: '我的旅行' },
      },
      {
        path: 'album/:id',
        name: 'PhotoDetail',
        component: () => import('@/views/Album/PhotoDetail.vue'),
        meta: { hidden: true, title: '照片详情' },
      },
      {
        path: 'album/:id/story',
        name: 'StoryEditor',
        component: () => import('@/views/Story/StoryEditor.vue'),
        meta: { hidden: true, title: '编辑故事' },
      },
      {
        path: 'stories',
        name: 'StoriesList',
        component: () => import('@/views/Stories/StoriesList.vue'),
        meta: { icon: '📖', title: '旅行故事' },
      },
      {
        path: 'stories/:id',
        name: 'StoryDetail',
        component: () => import('@/views/Stories/StoryDetail.vue'),
        meta: { hidden: true, title: '故事详情' },
      },
      {
        path: 'timeline',
        name: 'Timeline',
        component: () => import('@/views/Timeline/TimelineView.vue'),
        meta: { icon: '⏳', title: '时间轴' },
      },
      {
        path: 'community',
        name: 'Community',
        component: () => import('@/views/Community/CommunityView.vue'),
        meta: { icon: '🌐', title: '社区广场' },
      },
      {
        path: 'theme',
        name: 'Theme',
        component: () => import('@/views/Theme/ThemeCenter.vue'),
        meta: { icon: '🎨', title: '主题中心' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings/SettingsView.vue'),
        meta: { icon: '⚙️', title: '设置' },
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('@/views/Admin/AdminLayout.vue'),
        meta: { icon: '🛡️', title: '后台管理', admin: true },
        children: [
          {
            path: '',
            name: 'AdminUsers',
            component: () => import('@/views/Admin/UserManagement.vue'),
            meta: { title: '用户管理' },
          }
        ],
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.noAuth) {
    if (token) {
      next('/')
    } else {
      next()
    }
  } else {
    if (!token) {
      next('/login')
    } else {
      next()
    }
  }
})

export default router
