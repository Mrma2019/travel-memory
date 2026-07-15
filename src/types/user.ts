/** 用户数据模型 */
export interface User {
  id: string
  username: string
  avatar: string
  email: string
  bio: string
  hobbies: string[]
  createdAt: string
  preferences: UserPreferences
  role: 'admin' | 'user'
  status: '' | 'active' | 'disabled'
}

export interface UserPreferences {
  theme: ThemeType
  language: 'zh' | 'en'
}

export type ThemeType = 'cartoon' | 'minimal' | 'retro' | 'scifi'

export interface LoginForm {
  username: string
  password: string
}

export interface RegisterForm {
  username: string
  password: string
  confirmPassword: string
  email: string
}
