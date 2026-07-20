import request from "@/utils/request";

export function uploadFileApi(file: File | null) {
    if (file == null) return
    
    const formData = new FormData();
    formData.append('file', file);

    return request.post('/file/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}