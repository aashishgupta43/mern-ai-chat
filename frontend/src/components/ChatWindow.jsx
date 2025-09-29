/* 


// ChatWindow normal component
import React, { useEffect, useState, useRef } from 'react';
import { fetchHistory, sendMessage } from '../api';
import Message from './Message';


export default function ChatWindow({ sessionId }) {
const [messages, setMessages] = useState([]);
const [prompt, setPrompt] = useState('');
const [loading, setLoading] = useState(false);
const endRef = useRef(null);


useEffect(() => {
// Load existing history
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
const res = await sendMessage(sessionId, userText);
const aiText = res.data.ai;
const aiMsg = { role: 'ai', text: aiText, createdAt: new Date().toISOString() };
setMessages((m) => [...m, aiMsg]);
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
{loading ? 'Ai is typing...' : 'Send'}
</button>
</div>
</div>
);
}
 */



//for stream
import React, { useEffect, useState, useRef } from 'react';
import { fetchHistory, sendMessageStream } from '../api';
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

  // Helper: stream words one by one
  const streamWords = async (aiMsg, text) => {
    const words = text.split(' ');

    for (const word of words) {
      aiMsg.text += word + ' ';
      setMessages((prev) => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = aiMsg;
        return newMsgs;
      });
      await new Promise((r) => setTimeout(r, 100)); // 100ms delay per word
    }
  };

  const submit = async () => {
    if (!prompt.trim()) return;
    const userText = prompt.trim();

    // Add user message
    const userMsg = { role: 'user', text: userText, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const stream = sendMessageStream(sessionId, userText);
      let aiMsg = { role: 'ai', text: '', createdAt: new Date().toISOString() };
      setMessages((m) => [...m, aiMsg]);

      for await (const chunk of stream) {
        // Stream word by word
        await streamWords(aiMsg, chunk);
      }
    } catch (err) {
      console.error(err);
      const errMsg = { role: 'ai', text: 'Sorry — something went wrong.', createdAt: new Date().toISOString() };
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



