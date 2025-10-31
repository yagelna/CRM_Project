import axios from 'axios'
import { CONFIG } from './config';

const isDevlopment = import.meta.env.MODE === 'development'

const axiosInstance = axios.create({
    baseURL: CONFIG.API_BASE_URL,
    headers: {
        Accept: 'application/json',
    },
});

// Interceptor to add auth token and handle FormData properly
axiosInstance.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        } else {
            delete config.headers.Authorization;
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

let isRedirecting401 = false;

axiosInstance.interceptors.response.use(
    (response) => response,
     (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      const path = window.location.pathname;
      if (!isRedirecting401 && path !== '/login' && path !== '/register') {
        isRedirecting401 = true;
        localStorage.removeItem('access_token');
        localStorage.removeItem('userProfile');
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;