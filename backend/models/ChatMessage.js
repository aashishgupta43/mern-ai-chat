// Mongoose schema for chat messages
const mongoose = require('mongoose');


const ChatMessageSchema = new mongoose.Schema({
sessionId: { type: String, required: true, index: true },
role: { type: String, enum: ['user', 'ai'], required: true },
text: { type: String, required: true },
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('ChatMessage', ChatMessageSchema);