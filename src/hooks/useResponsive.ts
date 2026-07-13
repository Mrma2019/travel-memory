import { ref, onMounted, onUnmounted } from 'vue'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export function useResponsive() {
  const breakpoint = ref<Breakpoint>('desktop')
  const windowWidth = ref(window.innerWidth)

  function update() {
    windowWidth.value = window.innerWidth
    if (windowWidth.value < 768) {
      breakpoint.value = 'mobile'
    } else if (windowWidth.value < 1024) {
      breakpoint.value = 'tablet'
    } else {
      breakpoint.value = 'desktop'
    }
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return {
    breakpoint,
    windowWidth,
    isMobile: () => breakpoint.value === 'mobile',
    isTablet: () => breakpoint.value === 'tablet',
    isDesktop: () => breakpoint.value === 'desktop',
  }
}
