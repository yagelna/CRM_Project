import axios from 'axios'
import { CONFIG } from './config';

const isDevlopment = import.meta.env.MODE === 'development'

const axiosInstance = axios.create({
    baseURL: CONFIG.API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        else {
            config.headers.Authorization = ``;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
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