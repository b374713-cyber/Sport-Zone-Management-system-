// // src/services/gamingService.js
// import api from './api';

// const gamingService = {
//   // Rooms Overview
//   getRooms: async () => {
//     try {
//       const response = await api.get('/gaming/rooms');
//       return response.data?.rooms || [];
//     } catch (error) {
//       console.error('Error fetching rooms:', error);
//       return [];
//     }
//   },

//   // Devices
//   getDevices: async () => {
//     try {
//       const response = await api.get('/gaming/devices');
//       return response.data?.devices || [];
//     } catch (error) {
//       console.error('Error fetching devices:', error);
//       return [];
//     }
//   },

//   // Active sessions for timers
//   getActiveSessions: async () => {
//     try {
//       const response = await api.get('/gaming/sessions/active');
//       return response.data?.sessions || [];
//     } catch (error) {
//       console.error('Error fetching active sessions:', error);
//       return [];
//     }
//   },

//   // Start a gaming session
//   startSession: async (payload) => {
//     try {
//       const response = await api.post('/gaming/sessions/start', payload);
//       return response.data?.session || {};
//     } catch (error) {
//       console.error('Error starting session:', error);
//       throw error;
//     }
//   },

//   // End session
//   endSession: async (payload) => {
//     try {
//       const response = await api.post('/gaming/sessions/end', payload);
//       return response.data || {};
//     } catch (error) {
//       console.error('Error ending session:', error);
//       throw error;
//     }
//   },

//   // Delete session
//   deleteSession: async (sessionId) => {
//     try {
//       const response = await api.delete(`/gaming/sessions/${sessionId}`);
//       return response.data || {};
//     } catch (error) {
//       console.error('Error deleting session:', error);
//       throw error;
//     }
//   },

//   // Customers for dropdown
//   getCustomers: async () => {
//     try {
//       const response = await api.get('/gaming/customers');
//       return response.data?.customers || [];
//     } catch (error) {
//       console.error('Error fetching customers:', error);
//       return [];
//     }
//   },

//   // Players & Points
//   getPlayers: async () => {
//     try {
//       const response = await api.get('/gaming/players');
//       return response.data?.players || [];
//     } catch (error) {
//       console.error('Error fetching players:', error);
//       return [];
//     }
//   },

//   // Spin candidates
//   getSpinCandidates: async () => {
//     try {
//       const response = await api.get('/gaming/spin/candidates');
//       return response.data?.players || [];
//     } catch (error) {
//       console.error('Error fetching spin candidates:', error);
//       return [];
//     }
//   },

//   // Run spin
//   runSpin: async (playerId = null) => {
//     try {
//       const payload = playerId ? { player_id: playerId } : {};
//       const response = await api.post('/gaming/spin/draw', payload);
//       return response.data || {};
//     } catch (error) {
//       console.error('Error running spin:', error);
//       throw error;
//     }
//   },
//   // Add to gamingService.js
// payCash: async (payload) => {
//   try {
//     const response = await api.post('/gaming/payments/pay-cash', payload);
//     return response.data || {};
//   } catch (error) {
//     console.error('Error setting cash payment:', error);
//     throw error;
//   }
// },
// };

// export default gamingService;
// src/services/gamingService.js

import api from "./api";

const gamingService = {
  /* ===========================
   * ROOMS / DEVICES
   * =========================== */

  // Rooms Overview
  getRooms: async () => {
    try {
      const response = await api.get("/gaming/rooms");
      return response.data?.rooms || [];
    } catch (error) {
      console.error("Error fetching rooms:", error);
      return [];
    }
  },

  // Devices
  getDevices: async () => {
    try {
      const response = await api.get("/gaming/devices");
      return response.data?.devices || [];
    } catch (error) {
      console.error("Error fetching devices:", error);
      return [];
    }
  },

  /* ===========================
   * CUSTOMERS
   * =========================== */

  // Customers for dropdown
  getCustomers: async () => {
    try {
      const response = await api.get("/gaming/customers");
      return response.data?.customers || [];
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  },
  checkReward: async (customerId) => {
    try {
      const response = await api.get(`/gaming/rewards/active/${customerId}`);
      return response.data || { has_reward: false, reward: null, offer_code: null };
    } catch (error) {
      console.error("Error checking reward:", error);
      return { has_reward: false, reward: null, offer_code: null };
    }
  },

  /* ===========================
   * SESSIONS
   * =========================== */

  // Active + Reserved sessions for timers
  getActiveSessions: async () => {
    try {
      const response = await api.get("/gaming/sessions/active");
      return response.data?.sessions || [];
    } catch (error) {
      console.error("Error fetching active sessions:", error);
      return [];
    }
  },

  // Start a gaming session (Active or Reserved)
  startSession: async (payload) => {
    try {
      const response = await api.post("/gaming/sessions/start", payload);
      return response.data?.session || {};
    } catch (error) {
      console.error("Error starting session:", error);
      throw error;
    }
  },

  // End session
  endSession: async (payload) => {
    try {
      const response = await api.post("/gaming/sessions/end", payload);
      return response.data || {};
    } catch (error) {
      console.error("Error ending session:", error);
      throw error;
    }
  },

  // Delete session
  deleteSession: async (sessionId) => {
    try {
      const response = await api.delete(`/gaming/sessions/${sessionId}`);
      return response.data || {};
    } catch (error) {
      console.error("Error deleting session:", error);
      throw error;
    }
  },

  /* ===========================
   * PLAYERS / POINTS / SPIN
   * =========================== */

  // Players & Points (includes has_unused_reward from backend)
  getPlayers: async () => {
    try {
      const response = await api.get("/gaming/players");
      return response.data?.players || [];
    } catch (error) {
      console.error("Error fetching players:", error);
      return [];
    }
  },

  // Spin candidates
  getSpinCandidates: async () => {
    try {
      const response = await api.get("/gaming/spin/candidates");
      return response.data?.players || [];
    } catch (error) {
      console.error("Error fetching spin candidates:", error);
      return [];
    }
  },

  // Run spin (winner + reward row gets created in DB by backend)
  runSpin: async (playerId = null) => {
    try {
      const payload = playerId ? { player_id: playerId } : {};
      const response = await api.post("/gaming/spin/draw", payload);
      return response.data || {};
    } catch (error) {
      console.error("Error running spin:", error);
      throw error;
    }
  },

  /* ===========================
   * REWARDS
   * =========================== */

  // Check active (unused) reward for a customer
  // GET /api/gaming/rewards/active/:customerId
  getActiveReward: async (customerId) => {
    try {
      const response = await api.get(`/gaming/rewards/active/${customerId}`);
      return response.data || { has_reward: false, reward: null, offer_code: null };
    } catch (error) {
      console.error("Error fetching active reward:", error);
      return { has_reward: false, reward: null, offer_code: null };
    }
  },

  // Rewards summary by player name (mobile)
  // GET /api/gaming/rewards/summary/:playerName
  getRewardsSummary: async (playerName) => {
    try {
      const encoded = encodeURIComponent(playerName);
      const response = await api.get(`/gaming/rewards/summary/${encoded}`);
      return response.data || { total_sessions: 0, total_hours: 0, total_spent: 0 };
    } catch (error) {
      console.error("Error fetching rewards summary:", error);
      return { total_sessions: 0, total_hours: 0, total_spent: 0 };
    }
  },

  /* ===========================
   * PAYMENTS
   * =========================== */

  // Create/reuse Stripe invoice for Reserved/Active session
  // POST /api/gaming/payments/create-invoice
  createInvoice: async (payload) => {
    try {
      const response = await api.post("/gaming/payments/create-invoice", payload);
      return response.data || {};
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  },

  // Check Stripe payment status + update DB
  // GET /api/gaming/payments/status/:session_id
  checkPaymentStatus: async (sessionId) => {
    try {
      const response = await api.get(`/gaming/payments/status/${sessionId}`);
      return response.data || {};
    } catch (error) {
      console.error("Error checking payment status:", error);
      throw error;
    }
  },

  // Mark cash payment (UPSERT). Mobile confirm=false, employee confirm=true
  // POST /api/gaming/payments/pay-cash
  payCash: async (payload) => {
    try {
      const response = await api.post("/gaming/payments/pay-cash", payload);
      return response.data || {};
    } catch (error) {
      console.error("Error setting cash payment:", error);
      throw error;
    }
  },

  // Generate cash invoice PDF (receipt) + saves invoice_pdf_url in DB
  // GET /api/gaming/payments/generate-cash-invoice/:session_id
  generateCashInvoicePdf: async (sessionId) => {
    try {
      const response = await api.get(`/gaming/payments/generate-cash-invoice/${sessionId}`);
      return response.data || {};
    } catch (error) {
      console.error("Error generating cash invoice PDF:", error);
      throw error;
    }
  },

  /* ===========================
   * DEBUG
   * =========================== */

  // Test route
  testPdfRoute: async () => {
    try {
      const response = await api.get("/gaming/test-pdf");
      return response.data || {};
    } catch (error) {
      console.error("Error calling test-pdf:", error);
      throw error;
    }
  },
};

export default gamingService;
