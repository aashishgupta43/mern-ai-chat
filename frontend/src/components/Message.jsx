// Message component
import React from 'react';


export default function Message({ role, text }) {
const isUser = role === 'user';
return (
<div className={`message ${isUser ? 'user' : 'ai'}`} >
<div className="bubble">
{text}
</div>
</div>
);
}



/* 
import React, { useEffect, useRef } from "react";

export default function Message({ role, text, theme }) {
  const isUser = role === "user";
  const contentRef = useRef(null);

  // When text changes, scroll this message's content to bottom
  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [text]);

  const bubbleStyle = {
    maxWidth: "80%",
    alignSelf: isUser ? "flex-end" : "flex-start",
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    background: isUser ? "#DCF8C6" : theme === "dark" ? "#1e1e1e" : "#ffffff",
    color: theme === "dark" && !isUser ? "#e6e6e6" : "#000",
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  };

  // Inner content box: will scroll if too big
  const contentBoxStyle = {
    maxHeight: "40vh",        // <-- adjust this value as you like (e.g. '300px' or '50vh')
    overflowY: "auto",
    overflowX: "hidden",
    whiteSpace: "pre-wrap",   // preserve newlines
    wordBreak: "break-word",  // wrap long words
  };

  return (
    <div style={bubbleStyle}>
      <div ref={contentRef} style={contentBoxStyle}>
        {text}
      </div>
    </div>
  );
}



 */