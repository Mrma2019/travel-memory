import type { User } from "@/types";
import request from "@/utils/request";
import type { RegisterForm } from '@/types'
//用户注册
export function registerApi(form: RegisterForm) {
    return request.post(
        '/register',
        form
    );
}
