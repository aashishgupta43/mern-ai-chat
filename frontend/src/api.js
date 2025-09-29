// api.js
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
console.log("API URL ->", API_URL);

const API = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// ---------------------------
// Normal REST API calls
// ---------------------------
export const sendMessage = (sessionId, prompt) =>
  API.post("/api/chat", { sessionId, prompt });

export const fetchHistory = (sessionId) =>
  API.get(`/api/chat/${sessionId}`);

// ---------------------------
// Streaming API for live AI responses
// ---------------------------
export async function* sendMessageStream(sessionId, message) {
  const response = await fetch(`${API_URL}/api/chat/chat-stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      yield chunk;
    }
  }
}

export default API;



