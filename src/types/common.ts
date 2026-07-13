export interface ToastState {
    show: boolean
    type: 'success' | 'error'
    message: string
}