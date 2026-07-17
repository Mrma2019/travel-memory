import axios from "axios";

const request = axios.create({
    baseURL:import.meta.env.BASE_URL,
    timeout: 50000
})

request.interceptors.request.use(
    
)

export default request;