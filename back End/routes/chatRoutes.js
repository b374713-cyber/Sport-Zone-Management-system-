const express = require("express");
const router = express.Router();
const chat = require("../controllers/chatController");

// Customer (mobile)
router.post("/conversation", chat.getOrCreateConversation);
router.get("/messages", chat.getMyMessages);
router.post("/message", chat.sendCustomerMessage);
router.post("/push-token", chat.saveCustomerPushToken);

// Admin/Employee (web)
router.get("/admin/conversations", chat.adminListConversations);
router.get("/admin/messages/:conversationId", chat.adminGetMessages);
router.post("/admin/message", chat.adminSendMessage);

module.exports = router;
