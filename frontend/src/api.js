import axios from 'axios'
import {jwtDecode} from 'jwt-decode'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL + "api/" });

export const auth = async () => {
  try {
    const accessToken = localStorage.getItem('access');
    const tokenExpiration = jwtDecode(accessToken).exp;
    const now = Date.now() / 1000;
    if (tokenExpiration > now + 10) return true;
    const { data: { access: newAccessToken }} = await api.post('token/refresh/', {
      refresh: localStorage.getItem('refresh')
    });
    localStorage.setItem('access', newAccessToken);
    return true;
  } catch {
    return false;
  }
};  

api.interceptors.request.use(
  async config => {
    if (config.url.includes('token/') || !await auth()) {
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
    if (error.status === 401 && error.request.responseURL !== import.meta.env.VITE_API_URL + "api/token/") {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
)

export default api
