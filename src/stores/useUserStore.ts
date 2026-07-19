import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginForm, RegisterForm, ThemeType } from '@/types'
import mockUser from '@/mock/user.json'
import { loginApi, registerApi } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)
  const isLoggedIn = computed(() => !!currentUser.value)
  const allUsers = ref<User[]>([])

  function init() {
    const saved = localStorage.getItem('travel-memory-user')
    if (saved) {
      try {
        currentUser.value = JSON.parse(saved)
      } catch {
        currentUser.value = null
      }
    }
  }

  function save() {
    if (currentUser.value) {
      localStorage.setItem('travel-memory-user', JSON.stringify(currentUser.value))
    }
  }

  /** 加载所有用户（管理员功能） */
  async function fetchAllUsers() {
    // 从 localStorage 读取已保存的用户数据，首次使用 mock
    const saved = localStorage.getItem('travel-memory-all-users')
    if (saved) {
      try {
        allUsers.value = JSON.parse(saved)
        return
      } catch { /* ignore */ }
    }
    allUsers.value = mockUser as User[]
    persistUsers()
  }

  function persistUsers() {
    localStorage.setItem('travel-memory-all-users', JSON.stringify(allUsers.value))
  }

  /** 管理员禁用/启用用户 */
  function toggleUserStatus(userId: string) {
    const user = allUsers.value.find((u) => u.id === userId)
    if (user) {
      user.status = user.status === 'active' ? 'disabled' : 'active'
      persistUsers()
    }
  }

  /** 管理员删除用户 */
  function adminDeleteUser(userId: string) {
    allUsers.value = allUsers.value.filter((u) => u.id !== userId)
    persistUsers()
  }

  // 登录
  function login(form: LoginForm): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      console.log('request /login')
      loginApi(form).then(resp => {
        const { code, msg, data } = resp?.data || {}
        if (code === 0) {

          localStorage.setItem("token", data.token)

          const user: User = data.userVO
          currentUser.value = user
          save()
          resolve({ success: true, message: '登录成功！✈️' })
        } else {
          resolve({ success: false, message: `${msg}/登录失败 😢` })
        }
      })
    })
  }


  // 注册
  function register(form: RegisterForm): Promise<{ success: boolean; message: string }> {
    return new Promise(async (resolve) => {
      if (!form.username || !form.password || !form.confirmPassword || !form.email) {
        resolve({ success: false, message: '请填写所有必填字段哦~' })
        return
      }
      if (form.password !== form.confirmPassword) {
        resolve({ success: false, message: '两次密码不一致哦~' })
        return
      }
      if (form.password.length < 6) {
        resolve({ success: false, message: '密码至少需要6个字符~' })
        return
      }
      await registerApi(form).then(resp => {
        if (resp?.data.code === 2002) {
          console.log(resp?.data)
          resolve({ success: false, message: '邮箱已注册！' })
          return
        }
      })
      resolve({ success: true, message: '注册成功！开始你的旅行吧 🌍' })
    })
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem('travel-memory-user')
  }

  function updateTheme(theme: ThemeType) {
    if (currentUser.value) {
      currentUser.value.preferences.theme = theme
      save()
    }
  }

  function updateAvatar(avatar: string) {
    if (currentUser.value) {
      currentUser.value.avatar = avatar
      save()
    }
  }

  function updateProfile(data: { bio?: string; hobbies?: string[]; username?: string; email?: string }) {
    if (!currentUser.value) return
    if (data.bio !== undefined) currentUser.value.bio = data.bio
    if (data.hobbies !== undefined) currentUser.value.hobbies = data.hobbies
    if (data.username !== undefined) currentUser.value.username = data.username
    if (data.email !== undefined) currentUser.value.email = data.email
    save()
  }

  return {
    currentUser,
    isLoggedIn,
    allUsers,
    init,
    login,
    register,
    logout,
    updateTheme,
    updateAvatar,
    updateProfile,
    fetchAllUsers,
    toggleUserStatus,
    adminDeleteUser,
  }
})
