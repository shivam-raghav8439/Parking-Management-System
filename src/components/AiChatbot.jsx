import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const AiChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I am SmartPark AI Assistant.\n\nI can help you with:\n• Parking slot availability\n• Fee information\n• Monthly pass\n• Vehicle registration\n• Any parking queries\n\nHow can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen && messages.length > 1) setUnread(1);
    if (isOpen) setUnread(0);
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages.slice(1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/ai/chat`,
        { message: input, history: history.slice(0, -1) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I am having trouble connecting. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    '🅿️ Available slots?',
    '💰 Parking rates?',
    '🎫 Monthly pass?',
    '🚗 Register vehicle?',
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 60, height: 60, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a56db, #06b6d4)',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(26,86,219,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, transition: 'all 0.3s',
          animation: 'pulse 2s infinite'
        }}
      >
        {isOpen ? '✕' : '🤖'}
        {unread > 0 && !isOpen && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: 'red', color: 'white',
            borderRadius: '50%', width: 18, height: 18,
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>1</span>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 96, right: 24, zIndex: 1000,
          width: 360, height: 520,
          background: 'white', borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', animation: 'slideUpPrompt 0.3s ease'
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1a56db, #06b6d4)',
            padding: '16px 20px', color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
              }}>🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>SmartPark AI</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>
                  <span style={{
                    display: 'inline-block', width: 6, height: 6,
                    background: '#4ade80', borderRadius: '50%', marginRight: 4
                  }}/>
                  Online — Ask me anything!
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: 12
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#e8f0fe', marginRight: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
                  }}>🤖</div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #1a56db, #06b6d4)'
                    : '#f1f5f9',
                  color: msg.role === 'user' ? 'white' : '#0f172a',
                  fontSize: 13, lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#e8f0fe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
                }}>🤖</div>
                <div style={{
                  background: '#f1f5f9', padding: '10px 16px',
                  borderRadius: '18px 18px 18px 4px'
                }}>
                  <span style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#94a3b8',
                        animation: `bounce 1s infinite ${i * 0.2}s`
                      }}/>
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 2 && (
            <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {quickQuestions.map((q, i) => (
                <button key={i} onClick={() => { setInput(q.split(' ').slice(1).join(' ')); }}
                  style={{
                    padding: '5px 10px', borderRadius: 20,
                    border: '1px solid #e2e8f0', background: 'white',
                    fontSize: 11, cursor: 'pointer', color: '#1a56db', fontWeight: 500
                  }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '12px 16px', borderTop: '1px solid #e2e8f0',
            display: 'flex', gap: 8
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type your question..."
              style={{
                flex: 1, padding: '10px 14px',
                border: '1px solid #e2e8f0', borderRadius: 12,
                fontSize: 13, outline: 'none', fontFamily: 'inherit'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: 42, height: 42, borderRadius: 12,
                background: input.trim() ? '#1a56db' : '#e2e8f0',
                border: 'none', cursor: 'pointer',
                fontSize: 18, transition: 'all 0.2s'
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(26,86,219,0.4); }
          50% { box-shadow: 0 4px 30px rgba(26,86,219,0.7); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
};

export default AiChatbot;
