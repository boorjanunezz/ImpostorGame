import { useState, useRef, useEffect } from 'react';

export default function Chat({ socket, roomId, messages }) {
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (text.trim()) {
      socket.emit('sendMessage', { roomId, text });
      setText('');
    }
  };

  return (
    <div className="chat-container glass-panel">
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.type === 'system' ? 'system-msg' : ''}`}>
            {msg.type !== 'system' && <span className="chat-sender">{msg.sender}:</span>}
            <span className="chat-text">{msg.text}</span>
            <span className="chat-time">{msg.timestamp}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="chat-input-area">
        <input 
          type="text" 
          placeholder="Escribe un mensaje..." 
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn">➤</button>
      </form>
    </div>
  );
}
