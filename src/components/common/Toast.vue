<script lang="ts" setup>
import type { ToastState } from '@/types/common'

const props = withDefaults(defineProps<ToastState>(), {
    show: true,
    type: 'success',
    message: ''
})

const emit = defineEmits([
    'update:show'
])

</script>
<template>
    <!-- Toast -->
    <transition name="toast-fade">
        <div v-if="props.show" class="toast-bar" :class="props.type">
            <span>{{ props.type === 'success' ? '✅' : '❌' }}</span> {{ props.message }}
        </div>
    </transition>
</template>


<style lang="scss" scoped>
.toast-bar {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    z-index: 999;
    padding: 12px 24px;
    border-radius: 0 0 16px 16px;
    font-weight: 600;
    font-size: 14px;
    font-family: 'Nunito', 'Noto Sans SC', sans-serif;
    box-shadow: 0 4px 16px rgba(0, 0, 0, .12);

    &.success {
        background: #e8f5e9;
        color: #2e7d32;
    }

    &.error {
        background: #ffebee;
        color: #c62828;
    }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
    transition: all .3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-100%);
}
</style>