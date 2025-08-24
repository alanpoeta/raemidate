import axios from 'axios'
import {jwtDecode} from 'jwt-decode'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const auth = async () => {
  try {
    const accessToken = localStorage.getItem('access');
    const tokenExpiration = jwtDecode(accessToken).exp;
    const now = Date.now() / 1000;
    if (tokenExpiration >= now + 10) return true;
    const { data: { newAccessToken }} = await api.post('token/refresh/', {
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
    if (config.url.includes('token/')) {
      return config;
    }
    if (!await auth()) window.location.href = '/login';
    const accessToken = localStorage.getItem('access');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  error => Promise.reject(error)
)

export default api
