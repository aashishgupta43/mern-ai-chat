// Express routes for chat
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');


router.post('/', chatController.sendMessage); // POST /api/chat (body: sessionId, prompt)
router.get('/:sessionId', chatController.getHistory); // GET /api/chat/:sessionId

router.post('/chat-stream', chatController.chatStream);
module.exports = router;
