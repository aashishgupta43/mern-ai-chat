import React, { useEffect, useState, useRef } from 'react';
import { fetchHistory, sendMessageStream } from '../api'; // sendMessageStream -> streaming
import Message from './Message';

export default function ChatWindow({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  // Load chat history
  useEffect(() => {
    async function load() {
      try {
        const res = await fetchHistory(sessionId);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error('history load error', err);
      }
    }
    load();
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = async () => {
    if (!prompt.trim()) return;
    const userText = prompt.trim();

    // Optimistic UI: add user message
    const userMsg = { role: 'user', text: userText, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      // Streaming AI response
      const stream = sendMessageStream(sessionId, userText); // Returns async generator
      let aiMsg = { role: 'ai', text: '', createdAt: new Date().toISOString() };
      setMessages((m) => [...m, aiMsg]);

      for await (const chunk of stream) {
        // Append new chunk to AI message
        aiMsg.text += chunk;
        setMessages((prev) => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = aiMsg; // Update last message (AI)
          return newMsgs;
        });
      }

    } catch (err) {
      console.error(err);
      const errMsg = { role: 'ai', text: 'Sorry — something went wrong calling the AI.', createdAt: new Date().toISOString() };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map((m, i) => (
          <Message key={i} role={m.role} text={m.text} />
        ))}
        <div ref={endRef} />
      </div>

      <div className="composer">
        <textarea
          placeholder="Write your message..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
        />
        <button onClick={submit} disabled={loading} className="send-btn">
          {loading ? 'AI is typing...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
