



// React App component
import React, { useState } from "react";
import ChatWindow from "./components/ChatWindow";
import { v4 as uuidv4 } from "uuid";

export default function App() {
  // Persist sessionId across reloads
  const [sessionId, setSessionId] = useState(() => {
    const s = localStorage.getItem("chat_session_id");
    if (s) return s;
    const n = uuidv4();
    localStorage.setItem("chat_session_id", n);
    return n;
  });

  // Theme state
  const [dark, setDark] = useState(false);

  const toggleTheme = () => {
    setDark(!dark);
  };

  return (
    <div
      style={{
        backgroundColor: dark ? "#121212" : "#ffffff",
        color: dark ? "#ffffff" : "#000000",
        minHeight: "100vh",
        transition: "all 0.4s ease",
      }}
    >
      <header
        style={{
          padding: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: dark ? "#1e1e1e" : "#f5f5f5",
        }}
      >
        <h1>Generative AI Chat — MERN</h1>
        <button
          onClick={toggleTheme}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            background: dark ? "#ff9800" : "#007bff",
            color: "white",
            fontSize: "14px",
            cursor: "pointer",
            transition: "background 0.3s",
          }}
        >
          {dark ? "☀️ Day Mode" : "🌙 Night Mode"}
        </button>
      </header>

      <main style={{ padding: "16px" }}>
        <ChatWindow sessionId={sessionId} />
      </main>
    </div>
  );
}






















/* 
// React App component night theme
import React, { useEffect, useState, useRef } from 'react';
import ChatWindow from './components/ChatWindow';
import { v4 as uuidv4 } from 'uuid';


export default function App() {
// Persist sessionId across reloads
const [sessionId, setSessionId] = useState(() => {
const s = localStorage.getItem('chat_session_id');
if (s) return s;
const n = uuidv4();
localStorage.setItem('chat_session_id', n);
return n;
});


return (
<div className="app-root">
<header className="app-header">
<h1>Generative AI Chat — MERN</h1>
</header>
<main>
<ChatWindow sessionId={sessionId} />
</main>
</div>
);
}


 */