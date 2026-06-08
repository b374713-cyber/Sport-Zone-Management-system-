// src/services/dashboardService.js
import api from "./api";

/**
 * This service is only for extra dashboard endpoints.
 * We DO NOT replace your old statistics endpoint.
 */

const dashboardService = {
  getEmployees: async () => {
    const response = await api.get("/dashboard/employees");
    return response.data;
  },

  getUserProfile: async (userId) => {
    const response = await api.get(`/dashboard/profile/${userId}`);
    return response.data;
  },
};

export default dashboardService;

// ✅ Matches Income endpoint
export const getMatchesIncome = async () => {
  const response = await api.get("/statistics/matches-income");
  return response.data; // { matchesIncome: number }
};
