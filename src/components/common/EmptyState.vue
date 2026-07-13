<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps<{
  message?: string
  showAction?: boolean
  actionText?: string
  actionPath?: string
}>()

const emit = defineEmits<{
  action: []
}>()

const router = useRouter()

function handleAction() {
  if (props.actionPath) {
    router.push(props.actionPath)
  }
  emit('action')
}
</script>

<template>
  <div class="empty-state">
    <div class="empty-illustration">
      <span class="empty-emoji">📭</span>
      <span class="empty-cloud">☁️</span>
    </div>
    <p class="empty-message">{{ message || '这里还空空的~' }}</p>
    <button v-if="showAction" class="empty-action" @click="handleAction">
      {{ actionText || '去探索' }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-illustration {
  position: relative;
  margin-bottom: 20px;

  .empty-emoji {
    font-size: 72px;
    display: block;
  }
  .empty-cloud {
    position: absolute;
    top: -10px;
    right: -30px;
    font-size: 40px;
    opacity: 0.3;
    animation: cloud-float 6s ease-in-out infinite;
  }
}

@keyframes cloud-float {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(15px); }
}

.empty-message {
  font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
  font-size: 16px;
  color: #aaa;
  margin-bottom: 20px;
}

.empty-action {
  padding: 10px 28px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
  }
}
</style>
