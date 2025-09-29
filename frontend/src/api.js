// api.js
import axios from 'axios';

// ---------------------------
// Axios instance
// ---------------------------

console.log(process.env.REACT_APP_API_URL,"foififhfhhf");

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // full production URL,
   timeout: 30000,
});





// ---------------------------
// Normal REST API calls
// ---------------------------
export const sendMessage = (sessionId, prompt) =>
  API.post('/api/chat', { sessionId, prompt });

export const fetchHistory = (sessionId) =>
  API.get(`/api/chat/${sessionId}`);

// ---------------------------
// Streaming API for live AI responses
// ---------------------------
export async function* sendMessageStream(sessionId, message) {

  const API_URL = "https://mern-ai-chat.onrender.com/";

  const response = await fetch(`${API_URL}/api/chat/chat-stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "Hello" }),
  });







  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      yield chunk; // frontend me line-by-line handle karne ke liye
    }
  }
}

// ---------------------------
// Default export for Axios
// ---------------------------
export default API;



