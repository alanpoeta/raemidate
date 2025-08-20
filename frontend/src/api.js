import axios from 'axios'
import {jwtDecode} from 'jwt-decode'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const auth = async () => {
  const token = localStorage.getItem('access');
  let tokenExpiration;
  try {
    tokenExpiration = jwtDecode(token).exp;
  } catch {
    return null;
  }
  const now = Date.now() / 1000;
  if (tokenExpiration >= now + 10) return true;
  let res;
  try {
    res = await api.post('token/refresh/', {
      refresh: localStorage.getItem('refresh')
    });  
  } catch {
    return false;
  }
  localStorage.setItem('access', res.data.access);
  return true;
};  

api.interceptors.request.use(
  async config => {
    if (!config.url.includes('token/')) {
      await auth();
    }
    const accessToken = localStorage.getItem('access');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  error => Promise.reject(error)
)

export default api
