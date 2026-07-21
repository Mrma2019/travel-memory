import request from "@/utils/request";
import type { Travel } from '@/types'

//旅行列表
export function queryAllTravelApi() {
    return request.post(
        '/travel/all',
        {
            page: 1,
            size: 9
        }
    )
}

//新增旅行
export function createTravelApi(travel: Travel, file: File | null) {
    const formData = new FormData()

    formData.append('travel', JSON.stringify(travel))

    if (file) {
        formData.append('file', file)
    }

    return request.post(
        '/travel/add',
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }
    )
}

//删除旅行
export function delTravbelByIdApi(id: string) {
    return request.get(
        `/travel/del/${id}`
    )
}