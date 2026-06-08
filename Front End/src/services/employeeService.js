// src/services/employeeService.js
import api from "./api";

export const employeeService = {
  // ================================
  // GET ALL EMPLOYEES
  // ================================
  getAllEmployees: async () => {
    const response = await api.get("/employees");
    return response.data;
  },

  // ================================
  // UPDATE EMPLOYEE
  // ================================
  updateEmployee: async (userId, employeeData) => {
    const response = await api.put(`/employees/${userId}`, employeeData);
    return response.data;
  },

  // ================================
  // DELETE EMPLOYEE
  // ================================
  deleteEmployee: async (userId) => {
    const response = await api.delete(`/employees/${userId}`);
    return response.data;
  },

  // ================================
  // ✅ GET DASHBOARD STATISTICS (KEEP OLD WORKING ENDPOINT)
  // ================================
  getStatistics: async () => {
    const response = await api.get("/employees/statistics/summary");
    return response.data; 
    // expected: { statistics: {...old working fields...} }
  },

  // ================================
  // ✅ NEW: MATCHES INCOME (your new endpoint)
  // ================================
  getMatchesIncome: async () => {
    const response = await api.get("/statistics/matches-income");
    return response.data;
    // expected: { matchesIncome: number }
  },

  // ================================
  // CREATE EMPLOYEE (NEW)
  // ================================
  createEmployee: async (data) => {
    const response = await api.post("/employees/create", data);
    return response.data;
  },
};
