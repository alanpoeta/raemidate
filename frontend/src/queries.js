import api from "./api";

const queryOptions = {
  swipe: {
    queryKey: ['swipe'],
    queryFn: () => api.get('swipe/').then(res => res.data),
    staleTime: Infinity,
    gcTime: Infinity
  },

  profile: {
    queryKey: ['profile'],
    queryFn: () => api.get('profile/').then(res => res.data),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 0
  },

  match: {
    queryKey: ["match"],
    queryFn: () => api.get('match/').then(res => res.data),
    refetchInterval: 30_000
  }
}

export default queryOptions
