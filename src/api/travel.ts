import request from "@/utils/request";
import type { Travel } from '@/types'

//旅行列表
export function queryAllTravelApi() {
    return request.post(
        '/travel/all',
        {
            page: 1,
            size: 18
        }
    )
}

//新增旅行
export function createTravelApi(travel: Travel) {
    return request.post(
        '/travel/add',
        travel
    )
}

//删除旅行
export function delTravbelByIdApi(id: string) {
    return request.get(
        `/travel/del/${id}`
    )
}