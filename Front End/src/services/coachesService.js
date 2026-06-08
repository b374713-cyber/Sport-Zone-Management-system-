// Front_end/snp/src/services/coachesService.js
import api from "./api";

// Uses your real backend routes: /api/gym/coaches
const coachesService = {
  list: async () =>
    (await api.get("/gym/coaches")).data?.coaches ?? [],

  create: async (payload) =>
    (await api.post("/gym/coaches", payload)).data?.coach ?? {},

  update: async (id, payload) =>
    (await api.put(`/gym/coaches/${id}`, payload)).data?.coach ?? {},

  remove: async (id) =>
    (await api.delete(`/gym/coaches/${id}`)).data,
};

export default coachesService;
