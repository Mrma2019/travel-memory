<script lang="ts" setup>
const props = withDefaults(defineProps<{
    visible: boolean,
    title?: string,
    content?: string,
    confirmText?: string,
    cancelText?: string

}>(), {
    visible: false,
    title: '确认',
    content: '您确定要执行此操作吗？',
    confirmText: '确认',
    cancelText: '取消'
})

defineEmits([
    'confirm',
    'cancel'
])
</script>

<template>
    <!-- 确认弹窗 -->
    <Teleport to="body">
        <div v-if="visible" class="confirm-overlay" @click.self="$emit('cancel')">
            <div class="confirm-card cartoon-card">
                <div class="confirm-icon">🎉</div>
                <h3>{{ title }}</h3>
                <p>{{ content }}</p>
                <div class="confirm-actions">
                    <button class="confirm" @click="$emit('confirm')">{{ confirmText }}</button>
                    <button class="confirm-skip" @click="$emit('cancel')">{{ cancelText }}</button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style lang="scss" scoped>
// 发布确认弹窗
.confirm-overlay {
    position: fixed;
    inset: 0;
    z-index: 800;
    background: rgba(0, 0, 0, .35);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    animation: fade-in .2s ease;
}

.confirm-card {
    width: 380px;
    max-width: 90vw;
    padding: 32px 28px;
    text-align: center;
}

.confirm-icon {
    font-size: 48px;
    margin-bottom: 12px;
}

.confirm-card h3 {
    font-family: 'Fredoka One', 'ZCOOL KuaiLe', cursive;
    font-size: 20px;
    color: var(--text-primary);
    margin-bottom: 8px;
}

.confirm-card p {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 24px;
}

.confirm-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
}

.confirm {
    padding: 10px 24px;
    background: linear-gradient(135deg, #FF6B8A, #FFD93D);
    color: white;
    border: none;
    border-radius: 24px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all .3s;
    font-family: 'Nunito', 'Noto Sans SC', sans-serif;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, .15)
    }
}

.confirm-skip {
    padding: 10px 24px;
    background: none;
    border: 2px solid var(--border-color);
    border-radius: 24px;
    color: var(--text-secondary);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all .2s;
    font-family: 'Nunito', 'Noto Sans SC', sans-serif;

    &:hover {
        border-color: var(--primary-color);
        color: var(--primary-color)
    }
}

@keyframes fade-in {
    from {
        opacity: 0
    }

    to {
        opacity: 1
    }
}
</style>