import api from './api';
const membersService = {
  list:   async ()            => (await api.get('/gym/members')).data?.members ?? [],
  get:    async (id)          => (await api.get(`/gym/members/${id}`)).data ?? {},
  create: async (payload)     => (await api.post('/gym/members', payload)).data?.member ?? {},
  update: async (id, payload) => (await api.put(`/gym/members/${id}`, payload)).data?.member ?? {},
  remove: async (id)          => (await api.delete(`/gym/members/${id}`)).data
};
export default membersService;
