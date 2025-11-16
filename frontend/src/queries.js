import api from "./api";

const queriesOptions = {
  swipe: {
    queryKey: ['swipe'],
    queryFn: () => api.get('swipe/').then(res => res.data),
    staleTime: Infinity,
  },

  profile: {
    queryKey: ['profile'],
    queryFn: () => api.get('profile/').then(res => res.data),
    staleTime: Infinity,
  },

  match: {
    queryKey: ["match"],
    queryFn: () => api.get('match/').then(res => res.data),
  },

  message: {
    staleTime: Infinity
  },

  unreadCount: {
    queryKey: ["unread_count"],
    queryFn: () => api.get('unread_count/').then(res => res.data),
    staleTime: Infinity
  }
}

export default queriesOptions
