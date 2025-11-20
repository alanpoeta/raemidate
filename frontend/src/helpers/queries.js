import api from "./api";

const queriesOptions = {
  swipe: {
    queryKey: ['swipe'],
    queryFn: () => api.get('swipe/').then(res => res.data),
  },

  profile: {
    queryKey: ['profile'],
    queryFn: () => api.get('profile/').then(res => res.data),
  },

  match: {
    queryKey: ["match"],
    queryFn: () => api.get('match/').then(res => res.data),
  },

  message: {},
}

export default queriesOptions
