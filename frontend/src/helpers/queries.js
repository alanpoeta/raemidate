import api from "./api";

const queriesOptions = {
  user: {
    queryKey: ['user'],
    queryFn: () => api.get('user/').then(res => res.data),
  },

  swipe: {
    queryKey: ['swipe'],
    queryFn: () => api.get('swipe/').then(res => res.data),
  },

  profile: {
    queryKey: ['profile'],
    queryFn: () => api.get('profile/').then(res => res.data),
  },

  match: {
    queryKey: ["matches"],
    queryFn: () => api.get('matches/').then(res => res.data),
  },

  message: {},
}

export default queriesOptions
