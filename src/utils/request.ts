import router from "@/router";
import axios from "axios";

const request = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
    timeout: 30000
})


request.interceptors.request.use(
    config => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },

    error => {
        return Promise.reject(error);
    }
)

request.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        if (error.response) {
            const { status } = error.response;
            if (status === 401) {
                // Handle unauthorized access, e.g., redirect to login page
                router.push("/login")
                console.error("Unauthorized access - perhaps redirect to login?");
            }
        }
        return Promise.reject(error);
    }
)

export default request;