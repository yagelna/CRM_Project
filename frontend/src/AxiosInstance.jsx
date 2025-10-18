import axios from 'axios'
import { CONFIG } from './config';

const isDevlopment = import.meta.env.MODE === 'development'

const axiosInstance = axios.create({
    baseURL: CONFIG.API_BASE_URL,
    headers: {
        // 'Content-Type': 'application/json',
        accept: 'application/json',
    },
});

// Interceptor to add auth token and handle FormData properly
axiosInstance.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        } else {
            config.headers.Authorization = ``;
        }

        const isFormData =
            typeof FormData !== 'undefined' && config.data instanceof FormData;
        if (!isFormData) {
            config.headers['Content-Type'] =
                config.headers['Content-Type'] || 'application/json';
        } else {
            delete config.headers['Content-Type']; // Let browser set it including boundary
        }

        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;