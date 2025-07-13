const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  isGroup: {
    type: Boolean,
    default: false
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  groupName: String,
  groupAvatar: String,
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  latestMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isArchivedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
