import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL + "api/" });

export const auth = () => {
  const accessToken = localStorage.getItem('access');
  let tokenExpiration;
  try {
    tokenExpiration = jwtDecode(accessToken).exp;
  } catch {
    return false;
  }
  const now = Date.now() / 1000;
  return tokenExpiration > now + 10;
};  

api.interceptors.request.use(
  async config => {
    if (config.url.includes('token/')) {
      return config;
    }
    const accessToken = localStorage.getItem('access');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  error => {
    if ([401, 403].includes(error.status) && error.request.responseURL !== import.meta.env.VITE_API_URL + "api/token/") {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
)

export default api;
