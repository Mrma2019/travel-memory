import request from "@/utils/request";
import type { Travel } from '@/types'

//旅行列表
export function queryAllTravelApi() {
    return request.get(
        '/travel/all'
    )
}

//新增旅行
export function createTravelApi(travel: Travel) {
    return request.post(
        '/travel/add',
        travel
    )
}