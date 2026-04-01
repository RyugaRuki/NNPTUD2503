const express = require("express");
const router = express.Router();
const {
  getMessagesWithUser,
  sendMessage,
  getLatestMessages,
} = require("../controllers/message.controller");

// Latest message with each user that current user has chatted with
router.get("/", getLatestMessages);

// Conversation with a specific user
router.get("/:userID", getMessagesWithUser);

// Send message to a specific user
router.post("/:userID", sendMessage);

module.exports = router;
