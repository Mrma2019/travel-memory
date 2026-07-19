<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useUserStore } from '@/stores/useUserStore'
import ConfirmDialog from '@/components/common/Modal.vue'
import Toast from '@/components/common/Toast.vue'
import type { ToastState } from '@/types/common'
import type { User } from '@/types'

const userStore = useUserStore()
const loading = ref(true)
const searchQuery = ref('')
const filterStatus = ref<'all' | 'active' | 'disabled'>('all')
const currentPage = ref(1)
const pageSize = 6

const toast = reactive<ToastState>({ show: false, type: 'success', message: '' })
const showDeleteConfirm = ref(false)
const showToggleConfirm = ref(false)
const targetUser = ref<User | null>(null)
const confirmAction = ref<'delete' | 'toggle' | null>(null)

function showToast(type: 'success' | 'error', message: string) {
  toast.show = true; toast.type = type; toast.message = message
  setTimeout(() => { toast.show = false }, 3000)
}

const filteredUsers = computed(() => {
  let list = [...userStore.allUsers]

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter((u) =>
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  }

  if (filterStatus.value !== 'all') {
    list = list.filter((u) => u.status === filterStatus.value)
  }

  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize)))

const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredUsers.value.slice(start, start + pageSize)
})

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function openDeleteConfirm(user: User) {
  targetUser.value = user
  confirmAction.value = 'delete'
  showDeleteConfirm.value = true
}

function openToggleConfirm(user: User) {
  targetUser.value = user
  confirmAction.value = 'toggle'
  showToggleConfirm.value = true
}

async function handleConfirm() {
  if (!targetUser.value || !confirmAction.value) return

  if (confirmAction.value === 'delete') {
    userStore.adminDeleteUser(targetUser.value.id)
    showToast('success', `用户「${targetUser.value.username}」已删除 🗑️`)
  } else if (confirmAction.value === 'toggle') {
    userStore.toggleUserStatus(targetUser.value.id)
    const label = targetUser.value.status === 'active' ? '已启用' : '已禁用'
    showToast('success', `用户「${targetUser.value.username}」${label}`)
  }

  showDeleteConfirm.value = false
  showToggleConfirm.value = false
  targetUser.value = null
  confirmAction.value = null
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

onMounted(async () => {
  await userStore.fetchAllUsers()
  loading.value = false
})
</script>

<template>
  <div class="user-management">
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-item filter-search">
          <label>🔍 搜索</label>
          <input v-model="searchQuery" placeholder="搜索用户名或邮箱..." @input="currentPage = 1" />
        </div>
        <div class="filter-item">
          <label>📌 状态</label>
          <select v-model="filterStatus" @change="currentPage = 1">
            <option value="all">全部</option>
            <option value="active">正常</option>
            <option value="disabled">已禁用</option>
          </select>
        </div>
        <span class="filter-count">共 {{ filteredUsers.length }} 个用户</span>
      </div>
    </div>

    <div v-if="loading" class="loading-state">🛡️ 加载中...</div>

    <!-- 用户表格 -->
    <div v-else class="user-table-wrap">
      <div class="user-table cartoon-card">
        <div class="table-header">
          <span class="th th-user">用户</span>
          <span class="th th-role">角色</span>
          <span class="th th-status">状态</span>
          <span class="th th-date">注册时间</span>
          <span class="th th-actions">操作</span>
        </div>
        <div v-for="user in pagedUsers" :key="user.id" class="table-row" :class="{ disabled: user.status === 'disabled' }">
          <div class="td td-user">
            <div class="user-cell">
              <span class="user-avatar-cell">🧑‍🚀</span>
              <div>
                <span class="user-name-cell">{{ user.username }}</span>
                <span class="user-email-cell">{{ user.email }}</span>
              </div>
            </div>
          </div>
          <div class="td td-role">
            <span class="role-badge" :class="user.role">{{ user.role === 'admin' ? '👑 管理员' : '👤 用户' }}</span>
          </div>
          <div class="td td-status">
            <span class="status-badge" :class="user.status">{{ user.status === 'active' ? '✅ 正常' : '🚫 已禁用' }}</span>
          </div>
          <div class="td td-date">{{ formatDate(user.createdAt) }}</div>
          <div class="td td-actions">
            <button v-if="user.role !== 'admin'" class="action-btn toggle-btn" @click="openToggleConfirm(user)">
              {{ user.status === 'active' ? '🚫 禁用' : '✅ 启用' }}
            </button>
            <button v-if="user.role !== 'admin'" class="action-btn del-btn" @click="openDeleteConfirm(user)">
              🗑️
            </button>
            <span v-else class="admin-tip">—</span>
          </div>
        </div>
        <div v-if="pagedUsers.length === 0" class="table-empty">🔍 没有找到匹配的用户~</div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">← 上一页</button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">下一页 →</button>
    </div>

    <!-- 删除确认 -->
    <ConfirmDialog v-model:visible="showDeleteConfirm" title="删除用户"
      :content="`确定要删除用户「${targetUser?.username || ''}」吗？此操作不可恢复哦~`" confirmText="确认删除" cancelText="取消"
      @confirm="handleConfirm" @cancel="showDeleteConfirm = false" />

    <!-- 禁用/启用确认 -->
    <ConfirmDialog v-model:visible="showToggleConfirm"
      :title="targetUser?.status === 'active' ? '禁用用户' : '启用用户'"
      :content="targetUser?.status === 'active'
        ? `确定要禁用用户「${targetUser?.username || ''}」吗？该用户将无法登录 🚫`
        : `确定要启用用户「${targetUser?.username || ''}」吗？该用户将恢复正常使用 ✅`"
      :confirmText="targetUser?.status === 'active' ? '确认禁用' : '确认启用'" cancelText="取消"
      @confirm="handleConfirm" @cancel="showToggleConfirm = false" />

    <Toast :show="toast.show" :type="toast.type" :message="toast.message" />
  </div>
</template>

<style lang="scss" scoped>
.user-management {
  // empty wrapper
}

.filter-bar {
  margin-bottom: 16px;
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

  select, input {
    padding: 7px 10px;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    font-size: 13px;
    font-family: 'Nunito', 'Noto Sans SC', sans-serif;
    background: white;
    flex: 1;
    min-width: 0;
    &:focus { outline: none; border-color: var(--primary-color); }
  }
}

.filter-search { flex: 2; min-width: 180px; }

.filter-count {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
  align-self: center;
  margin-top: 18px;
}

.loading-state {
  text-align: center;
  padding: 60px 0;
  font-size: 18px;
  color: #aaa;
}

.user-table-wrap {
  margin-bottom: 16px;
}

.user-table {
  padding: 0;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1.2fr;
  gap: 8px;
  padding: 14px 20px;
  background: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1.2fr;
  gap: 8px;
  padding: 12px 20px;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: background 0.2s;

  &:hover { background: rgba(0, 0, 0, 0.01); }
  &.disabled { opacity: 0.55; }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar-cell {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.user-name-cell {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  display: block;
}

.user-email-cell {
  font-size: 11px;
  color: #bbb;
  display: block;
}

.role-badge {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 600;

  &.admin {
    background: rgba(255, 107, 138, 0.1);
    color: var(--primary-color);
  }

  &.user {
    background: rgba(0, 0, 0, 0.04);
    color: var(--text-secondary);
  }
}

.status-badge {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 600;

  &.active {
    background: rgba(76, 175, 80, 0.1);
    color: #4CAF50;
  }

  &.disabled {
    background: rgba(255, 107, 107, 0.1);
    color: #ff6b6b;
  }
}

.td-date {
  font-size: 12px;
  color: #bbb;
}

.td-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.action-btn {
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  border: none;
}

.toggle-btn {
  background: rgba(255, 147, 30, 0.1);
  color: #ff931e;

  &:hover {
    background: #ff931e;
    color: white;
  }
}

.del-btn {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
  padding: 5px 10px;

  &:hover {
    background: #ff6b6b;
    color: white;
  }
}

.admin-tip {
  color: #ccc;
  font-size: 14px;
}

.table-empty {
  text-align: center;
  padding: 40px;
  font-size: 14px;
  color: #bbb;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px 0;
}

.page-btn {
  padding: 8px 20px;
  border: 2px solid var(--border-color);
  border-radius: 20px;
  background: white;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover:not(:disabled) {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.page-info {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

@include mobile {
  .table-header, .table-row {
    grid-template-columns: 1.5fr 1fr 0.8fr;
  }
  .th-date, .td-date,
  .th-role, .td-role { display: none; }
}
</style>
