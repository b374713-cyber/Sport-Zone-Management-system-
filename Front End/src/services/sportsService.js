import api from "./api";// bte3ml import la haide wel api byest3ml axiues la  ye3ml http request 


function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = String(timeStr).split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export const sportsService = {
  /* ------------------------------- SPORTS ------------------------------- */

  getAllSports: async () => {
    try {
      const response = await api.get("/sports/sports");
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching sports:", error);
      throw error;
    }
  },

  /* ------------------------------ STADIUMS ------------------------------ */

  getAllStadiums: async () => {
    try {
      const response = await api.get("/sports/stadiums");
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching stadiums:", error);
      throw error;
    }
  },

  /* ------------------------------ CUSTOMERS ------------------------------ */

  getCustomers: async () => {
    try {
      const response = await api.get("/sports/customers");
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching customers:", error);
      throw error;
    }
  },

  /* ---------------------------- RESERVATIONS ---------------------------- */

  getAllReservations: async () => {
    try {
      const response = await api.get("/sports/reservations");
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching reservations:", error);
      throw error;
    }
  },

  getReservationsByDate: async (date) => {
    try {
      const response = await api.get(`/sports/reservations/date/${date}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching reservations by date:", error);
      throw error;
    }
  },

  getReservationById: async (id) => {
    try {
      const response = await api.get(`/sports/reservations/${id}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching reservation by id:", error);
      throw error;
    }
  },

  createReservation: async (reservationData) => {
    try {
      console.log("📝 Creating reservation:", reservationData);
      const response = await api.post("/sports/reservations", reservationData);
      return response.data;
    } catch (error) {
      console.error("❌ Error creating reservation:", error);
      if (error.response?.status === 409) {
        throw new Error(
          "Time slot conflict! This stadium is already booked during the selected time."
        );
      }
      throw error;
    }
  },

  updateReservation: async (reservationId, updates) => {
    try {
      const response = await api.put(`/sports/reservations/${reservationId}`, updates);
      return response.data;
    } catch (error) {
      console.error("❌ Error updating reservation:", error);
      if (error.response?.status === 409) {
        throw new Error("Time slot conflict for the updated values.");
      }
      throw error;
    }
  },

  updateReservationStatus: async (reservationId, status) => {
    try {
      const response = await api.put(`/sports/reservations/${reservationId}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.error("❌ Error updating reservation status:", error);
      throw error;
    }
  },

  deleteReservation: async (reservationId) => {
    try {
      const response = await api.delete(`/sports/reservations/${reservationId}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error deleting reservation:", error);
      throw error;
    }
  },

  /* ----------------------------- AVAILABILITY ---------------------------- */

  getAvailability: async (stadiumId, date) => {
    try {
      const response = await api.get(`/sports/availability/${stadiumId}/${date}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching availability:", error);
      throw error;
    }
  },

  /* ----------------------------- PAYMENT ----------------------------- */

  getReservationPaymentStatus: async (reservationId) => {
    const res = await api.get(`/sports/reservations/${reservationId}/payment-status`);
    return res.data;
  },

  // OPTIONAL (only if you implement it in backend):
  // Marks cash payment, sets Confirmed, and returns invoice pdf url
  payCash: async (reservationId) => {
    const res = await api.post(`/sports/reservations/${reservationId}/pay-cash`);
    return res.data;
  },

  /* ----------------------------- UTILITIES ------------------------------ */

  checkTimeConflict: async (stadiumId, date, startTime, endTime) => {
    try {
      const reservationsResponse = await sportsService.getReservationsByDate(date);
      const reservations = reservationsResponse.reservations || [];

      // ignore cancelled
      const stadiumReservations = reservations.filter(
        (res) => res.stadium_id === stadiumId && res.status !== "Cancelled"
      );

      const newStart = timeToMinutes(startTime);
      const newEnd = timeToMinutes(endTime);

      return stadiumReservations.some((res) => {
        const existingStart = timeToMinutes(res.start_time);
        const existingEnd = timeToMinutes(res.end_time);
        return newStart < existingEnd && newEnd > existingStart;
      });
    } catch (error) {
      console.error("❌ Error checking time conflict:", error);
      return false;
    }
  },
};

export default sportsService;
