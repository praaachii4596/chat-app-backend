const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createGroupChat,
  getAllChats,
  getChatById,
  updateGroupChat,
  toggleArchive,
  toggleMute,
  deleteGroup,
} = require("../controllers/chatController");

router.post("/group", authMiddleware, createGroupChat);
router.get("/", authMiddleware, getAllChats);
router.get("/:id", authMiddleware, getChatById);
router.put("/group/:id", authMiddleware, updateGroupChat);
router.put("/archive/:id", authMiddleware, toggleArchive);
router.put("/mute/:id", authMiddleware, toggleMute);
router.delete("/:id", authMiddleware, deleteGroup);

module.exports = router;
