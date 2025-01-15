import axios from 'axios'

const isDevlopment = import.meta.env.MODE === 'development'

const baseURL = isDevlopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_DEPLOY

const axiosInstance = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default axiosInstance;