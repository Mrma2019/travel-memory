<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'
import { useThemeStore } from '@/stores/useThemeStore'
import type { LoginForm, RegisterForm } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const isLogin = ref(true)
const loading = ref(false)
const errorMsg = ref('')
const showLoginPwd = ref(false)
const showRegPwd = ref(false)
const showRegConfirmPwd = ref(false)

const loginForm = ref<LoginForm>({ email: '', password: '' })
const registerForm = ref<RegisterForm>({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
})

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  const result = await userStore.login(loginForm.value)
  loading.value = false
  if (result.success) {
    errorMsg.value = ''
    router.push('/')
  } else {
    errorMsg.value = result.message
  }
}

async function handleRegister() {
  loading.value = true
  errorMsg.value = ''
  const result = await userStore.register(registerForm.value)
  loading.value = false
  if (result.success) {
    isLogin.value = true
    errorMsg.value = ''
  } else {
    errorMsg.value = result.message
  }
}

function toggleMode() {
  isLogin.value = !isLogin.value
  errorMsg.value = ''
}

const themeEmoji = computed(() => themeStore.currentThemeConfig.emoji)
</script>

<template>
  <div class="login-page">
    <!-- 装饰元素 -->
    <div class="decorations">
      <span class="deco deco-1">☁️</span>
      <span class="deco deco-2">✈️</span>
      <span class="deco deco-3">☁️</span>
      <span class="deco deco-4">🌟</span>
      <span class="deco deco-5">☁️</span>
      <span class="deco deco-6">📮</span>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- Logo -->
      <div class="card-logo">
        <span class="logo-emoji">🌍</span>
        <h1 class="logo-title">Travel Memory</h1>
        <p class="logo-sub">记录你的每一次旅行 ✨</p>
      </div>

      <!-- Tab切换 -->
      <div class="login-tabs">
        <button :class="{ active: isLogin }" @click="isLogin = true">🔑 登录</button>
        <button :class="{ active: !isLogin }" @click="isLogin = false">✍️ 注册</button>
      </div>

      <!-- 提示 -->
      <div v-if="errorMsg" class="error-msg">
        <span>{{ errorMsg }}</span>
      </div>

      <!-- 登录表单 -->
      <form v-if="isLogin" class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>👤 邮箱*</label>
          <input v-model="loginForm.email" type="email" placeholder="请输入邮箱" />
        </div>
        <div class="form-group">
          <label>🔒 密码*</label>
          <div class="password-wrapper">
            <input
              v-model="loginForm.password"
              :type="showLoginPwd ? 'text' : 'password'"
              placeholder="请输入密码"
            />
            <button type="button" class="pwd-toggle" @click="showLoginPwd = !showLoginPwd">
              {{ showLoginPwd ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>
        <p class="forgot-pwd" @click="">忘记密码？</p>
        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading">✈️ 飞行中...</span>
          <span v-else>🚀 出发！</span>
        </button>
      </form>

      <!-- 注册表单 -->
      <form v-else class="login-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label>👤 用户名*</label>
          <input v-model="registerForm.username" type="text" placeholder="请输入用户名" />
        </div>
        <div class="form-group">
          <label>📧 邮箱*</label>
          <input v-model="registerForm.email" type="email" placeholder="请输入邮箱" />
        </div>
        <div class="form-group">
          <label>🔒 密码*</label>
          <div class="password-wrapper">
            <input
              v-model="registerForm.password"
              :type="showRegPwd ? 'text' : 'password'"
              placeholder="请输入密码（至少6位）"
            />
            <button type="button" class="pwd-toggle" @click="showRegPwd = !showRegPwd">
              {{ showRegPwd ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>
        <div class="form-group">
          <label>🔒 确认密码*</label>
          <div class="password-wrapper">
            <input
              v-model="registerForm.confirmPassword"
              :type="showRegConfirmPwd ? 'text' : 'password'"
              placeholder="请再次输入密码"
            />
            <button type="button" class="pwd-toggle" @click="showRegConfirmPwd = !showRegConfirmPwd">
              {{ showRegConfirmPwd ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>
        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading">✈️ 注册中...</span>
          <span v-else>🌍 开始旅行！</span>
        </button>
      </form>

      <!-- 底部提示 -->
      <p class="toggle-hint" @click="toggleMode">
        {{ isLogin ? '还没有账号？✍️ 去注册' : '已有账号？🔑 去登录' }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-start), var(--bg-end));
  position: relative;
  overflow: hidden;
}

// 装饰元素
.decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.deco {
  position: absolute;
  font-size: 48px;
  opacity: 0.3;

  &.deco-1 {
    top: 10%;
    left: 10%;
    animation: cloud-float 8s ease-in-out infinite;
  }

  &.deco-2 {
    top: 15%;
    right: 15%;
    font-size: 36px;
    animation: plane-fly 10s ease-in-out infinite;
  }

  &.deco-3 {
    top: 60%;
    right: 10%;
    animation: cloud-float 7s ease-in-out infinite reverse;
  }

  &.deco-4 {
    bottom: 20%;
    left: 15%;
    animation: twinkle 2s ease-in-out infinite;
  }

  &.deco-5 {
    bottom: 10%;
    left: 40%;
    animation: cloud-float 9s ease-in-out infinite;
  }

  &.deco-6 {
    top: 30%;
    left: 5%;
    font-size: 32px;
    animation: wobble 3s ease-in-out infinite;
  }
}

@keyframes cloud-float {

  0%,
  100% {
    transform: translateX(0);
  }

  50% {
    transform: translateX(30px);
  }
}

@keyframes plane-fly {
  0% {
    transform: translate(-200px, 50px) rotate(15deg);
    opacity: 0;
  }

  10% {
    opacity: 0.3;
  }

  90% {
    opacity: 0.3;
  }

  100% {
    transform: translate(calc(100vw + 200px), -50px) rotate(15deg);
    opacity: 0;
  }
}

@keyframes twinkle {

  0%,
  100% {
    opacity: 0.2;
    transform: scale(1);
  }

  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

@keyframes wobble {

  0%,
  100% {
    transform: rotate(-5deg);
  }

  50% {
    transform: rotate(5deg);
  }
}

// 登录卡片
.login-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: $radius-xl;
  padding: 40px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.5);
  z-index: 1;
  position: relative;
}

// Logo
.card-logo {
  text-align: center;
  margin-bottom: 28px;

  .logo-emoji {
    font-size: 56px;
    display: block;
    margin-bottom: 8px;
    animation: heartbeat 2s ease-in-out infinite;
  }

  .logo-title {
    font-family: $font-title;
    font-size: 28px;
    color: #2c3e50;
    margin: 0 0 4px;
  }

  .logo-sub {
    font-size: 13px;
    color: #aaa;
    font-family: $font-handwrite;
  }
}

@keyframes heartbeat {

  0%,
  100% {
    transform: scale(1);
  }

  25% {
    transform: scale(1.08);
  }

  50% {
    transform: scale(1);
  }

  75% {
    transform: scale(1.08);
  }
}

// 切换Tabs
.login-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 24px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: $radius-md;
  padding: 4px;

  button {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: $radius-sm;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    background: transparent;
    color: #999;
    transition: all 0.3s;
    font-family: $font-body;

    &.active {
      background: white;
      color: #2c3e50;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
  }
}

// 错误提示
.error-msg {
  background: #fff0f0;
  color: #e74c3c;
  padding: 10px 16px;
  border-radius: $radius-sm;
  font-size: 13px;
  margin-bottom: 16px;
  text-align: center;
}

// 表单
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    font-weight: 600;
    color: #666;
  }

  input {
    padding: 12px 16px;
    border: 2px solid rgba(0, 0, 0, 0.08);
    border-radius: $radius-md;
    font-size: 14px;
    transition: all 0.3s;
    font-family: $font-body;
    background: rgba(0, 0, 0, 0.02);

    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(135, 206, 235, 0.15);
    }
  }
}

// 密码输入框容器
.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  input {
    width: 100%;
    padding-right: 44px;
  }

  .pwd-toggle {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    line-height: 1;
    opacity: 0.6;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }
}

// 忘记密码
.forgot-pwd {
  text-align: right;
  font-size: 12px;
  color: #aaa;
  cursor: pointer;
  margin: -8px 0 0;
  transition: color 0.2s;
  user-select: none;

  &:hover {
    color: var(--primary-color);
  }
}

.submit-btn {
  margin-top: 8px;
  padding: 14px;
  border: none;
  border-radius: $radius-xl;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  font-family: $font-title;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }
}

.toggle-hint {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: #aaa;
  cursor: pointer;

  &:hover {
    color: var(--primary-color);
  }
}
</style>
