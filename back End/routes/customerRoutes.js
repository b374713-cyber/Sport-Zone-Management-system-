const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const uploadCustomerPhoto = require("../config/uploadCustomerPhoto");

// auth
router.post("/register", customerController.registerCustomer);
router.post("/login", customerController.loginCustomer);

// profile
router.get("/:id/profile", customerController.getCustomerProfile);
router.put("/:id/profile", customerController.updateCustomerProfile);
router.post(
  "/:id/profile/photo",
  uploadCustomerPhoto.single("photo"),
  customerController.uploadCustomerPhoto
);
router.put("/:id/password", customerController.changePassword);
router.post("/send-verification-code", customerController.sendVerificationCode);
router.post("/verify-code", customerController.verifyCode);
module.exports = router;
