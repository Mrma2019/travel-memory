import request from "@/utils/request";
import type { LoginForm, RegisterForm } from '@/types'

// 注册
export function registerApi(form: RegisterForm) {
    return request.post(
        '/register',
        form
    );
}

// 登录
export function loginApi(form: LoginForm) {
    return request.post(
        '/login',
        form
    );
}
