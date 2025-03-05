const isDevlopment = import.meta.env.MODE === 'development';

export const CONFIG = {
    API_BASE_URL: isDevlopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_DEPLOY,
    WS_BASE_URL: isDevlopment ? import.meta.env.VITE_WS_BASE_URL_LOCAL : import.meta.env.VITE_WS_BASE_URL_DEPLOY,
    DEFAULT_SUPPLIER: import.meta.env.VITE_DEFAULT_SUPPLIER || "Unknown Supplier",
    IS_DEV: isDevlopment,
};
