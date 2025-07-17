const mongoose = require("mongoose");
const Chat = require("../models/Chat");
const User = require("../models/User");

// @desc    Create new group chat
// @route   POST /api/chats/group
const createGroupChat = async (req, res) => {
  const { members, groupName, groupAvatar, creatorId } = req.body;

  if (!creatorId || !mongoose.Types.ObjectId.isValid(creatorId)) {
    return res.status(400).json({ message: "Invalid or missing creatorId" });
  }

  if (!members || !Array.isArray(members) || members.length < 2) {
    return res.status(400).json({
      message: "Group must have at least 2 members excluding creator",
    });
  }

  if (!groupName) {
    return res.status(400).json({ message: "Group name is required" });
  }

  try {
    const creator = await User.findById(creatorId);
    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    const uniqueMembers = new Set([
      ...members.map((id) => id.toString()),
      creatorId.toString(),
    ]);

    const groupChat = await Chat.create({
      isGroup: true,
      members: Array.from(uniqueMembers),
      groupName,
      groupAvatar: groupAvatar || null,
      admins: [creatorId],
    });

    const populatedChat = await Chat.findById(groupChat._id)
      .populate("members", "-password")
      .populate("admins", "-password");

    res.status(201).json(populatedChat);
  } catch (error) {
    console.error("Error creating group chat:", error);
    res.status(500).json({ error: "Failed to create group chat" });
  }
};

// @desc    Get all chats for a user
// @route   GET /api/chats?userId=xxx
const getAllChats = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ error: "Invalid or missing userId in query" });
    }

    const chats = await Chat.find({ members: userId })
      .populate("members", "-password")
      .populate("admins", "-password")
      .populate({
        path: "latestMessage",
        populate: {
          path: "senderId",
          select: "name avatarUrl",
        },
      })
      .sort({ updatedAt: -1 });
    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Failed to get chats" });
  }
};

// @desc    Get chat by ID
// @route   GET /api/chats/:id
const getChatById = async (req, res) => {
  const chatId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ error: "Invalid chat ID" });
  }

  try {
    const chat = await Chat.findById(chatId)
      .populate("members", "-password")
      .populate("admins", "-password")
      .populate({
        path: "latestMessage",
        populate: {
          path: "senderId",
          select: "name avatarUrl",
        },
      })
      .lean();

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({ error: "Failed to get chat" });
  }
};

// @desc    Update a group chat
// @route   PUT /api/chats/group/:id
const updateGroupChat = async (req, res) => {
  const userId = req.user._id;
  const { groupName, groupAvatar, members, admins } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid chat ID" });
  }

  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ error: "Group chat not found" });
    }

    const isAdmin = chat.admins.some(
      (adminId) => adminId.toString() === userId.toString()
    );
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: "Only group admins can update the group chat" });
    }

    if (groupName) chat.groupName = groupName;
    if (groupAvatar) chat.groupAvatar = groupAvatar;

    if (Array.isArray(members)) {
      const uniqueNewMembers = members.filter(
        (m) => !chat.members.some((existing) => existing.toString() === m)
      );
      chat.members.push(...uniqueNewMembers);
    }

    // Add only new admins
    if (Array.isArray(admins)) {
      const uniqueNewAdmins = admins.filter(
        (a) => !chat.admins.some((existing) => existing.toString() === a)
      );
      chat.admins.push(...uniqueNewAdmins);
    }

    await chat.save();

    const updatedChat = await Chat.findById(chat._id)
      .populate("members", "-password")
      .populate("admins", "-password");

    res.status(200).json(updatedChat);
  } catch (error) {
    console.error("Error updating group chat:", error);
    res.status(500).json({ error: "Failed to update group chat" });
  }
};

// @desc    Archive or unarchive a chat for a user
// @route   PUT /api/chats/archive/:id
const toggleArchive = async (req, res) => {
  const chatId = req.params.id;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ error: "Invalid chat ID" });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (!chat.members.includes(userId)) {
      return res
        .status(403)
        .json({ error: "You are not a member of this chat" });
    }

    const isArchived = chat.archivedBy?.includes(userId);

    if (isArchived) {
      chat.archivedBy.pull(userId);
    } else {
      chat.archivedBy = [...(chat.archivedBy || []), userId];
    }

    await chat.save();

    res
      .status(200)
      .json({ message: "Chat archived status updated", archived: !isArchived });
  } catch (error) {
    console.error("Error archiving chat:", error);
    res.status(500).json({ error: "Failed to archive chat" });
  }
};

// @desc    Mute or unmute a chat for a user
// @route   PUT /api/chats/mute/:id
const toggleMute = async (req, res) => {
  const chatId = req.params.id;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ error: "Invalid chat ID" });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (!chat.members.includes(userId)) {
      return res
        .status(403)
        .json({ error: "You are not a member of this chat" });
    }

    const isMuted = chat.mutedBy?.includes(userId);

    if (isMuted) {
      chat.mutedBy.pull(userId);
    } else {
      chat.mutedBy = [...(chat.mutedBy || []), userId];
    }

    await chat.save();

    res
      .status(200)
      .json({ message: "Chat mute status updated", muted: !isMuted });
  } catch (error) {
    console.error("Error muting chat:", error);
    res.status(500).json({ error: "Failed to mute chat" });
  }
};

// @desc    Delete a group chat by ID
// @route   DELETE /api/chats/:id
const deleteGroup = async (req, res) => {
  const chatId = req.params.id;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ error: "Invalid chat ID" });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ error: "Group chat not found" });
    }

    const isAdmin = chat.admins.some(
      (adminId) => adminId.toString() === userId.toString()
    );
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: "Only group admins can delete the group chat" });
    }

    await Chat.findByIdAndDelete(chatId);

    res.status(200).json({ message: "Group chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting group chat:", error);
    res.status(500).json({ error: "Failed to delete group chat" });
  }
};

module.exports = {
  createGroupChat,
  getAllChats,
  getChatById,
  updateGroupChat,
  toggleArchive,
  toggleMute,
  deleteGroup,
};
