<script setup lang="ts">
import Sidebar from '@/components/layout/Sidebar.vue'
import { useResponsive } from '@/hooks/useResponsive'
import { computed } from 'vue'

const { isMobile } = useResponsive()

const mainStyle = computed(() => ({
  marginLeft: isMobile() ? '0' : '240px',
  paddingTop: isMobile() ? '52px' : '0',
}))
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <main class="main-content" :style="mainStyle">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.fullPath" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  height: 100vh;
  overflow: hidden;
}

.main-content {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  transition: margin-left 0.3s ease;
  position: relative;
}

.page-enter-active,
.page-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
