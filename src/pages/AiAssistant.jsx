import { useState, useRef, useEffect } from 'react';

const SYSTEM_PROMPT = `You are SmartPark AI Assistant for Galgotias University Parking Management System.

You help students, faculty and staff with:
- Parking slot availability and zones
- Fee structure and payments
- Monthly/Semester pass information
- Vehicle registration process
- ANPR gate system explanation
- Parking rules and timings
- How to use the parking app
- Any parking related doubts

PARKING INFO:
- Car: ₹20/hour | Bike: ₹10/hour | Bicycle: ₹5/hour | Bus: ₹40/hour
- Monthly Pass: Car ₹800 | Bike ₹400 | Bicycle ₹150
- Zones: A=Cars, B=Bikes, C=Faculty, D=Visitors
- Timing: 6 AM to 10 PM daily
- Total slots: 30 (Zone A:10, B:10, C:5, D:5)

RULES:
- Always reply in same language user writes (Hindi or English)
- Be friendly and helpful
- Keep answers clear and short
- Use emojis to make it friendly
- Never share other users private data`;

// Call Anthropic API directly, with backend API fallback to handle CORS or missing client key
const callAI = async (messages) => {
  try {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (apiKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: messages
        })
      });
      const data = await response.json();
      if (data.content && data.content[0]) {
        return data.content[0].text;
      }
      throw new Error(data.error?.message || 'Failed to fetch from Anthropic');
    }
  } catch (error) {
    console.warn("Direct Anthropic call failed, trying backend fallback:", error);
  }

  // Fallback to backend chat endpoint (fully integrated with database slot status counts)
  const userText = messages[messages.length - 1].content;
  const history = messages.slice(0, -1).map(m => ({
    role: m.role,
    content: m.content
  }));

  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      message: userText,
      history: history
    })
  });
  const data = await response.json();
  if (data.reply) {
    return data.reply;
  }
  throw new Error(data.message || 'Failed to call AI assistant');
};

export default function AiAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    setStreamText('');

    try {
      // Simulate streaming effect
      const reply = await callAI(newMessages);
      let i = 0;
      const interval = setInterval(() => {
        setStreamText(reply.slice(0, i));
        i += 3;
        if (i > reply.length) {
          clearInterval(interval);
          setStreamText('');
          setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
          setLoading(false);
        }
      }, 10);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, connection issue occur ho gaya hai. Please dobara try karein.'
      }]);
      setLoading(false);
    }
  };

  const suggestions = [
    { icon: '🅿️', text: 'Kitne slots available hain abhi?' },
    { icon: '💰', text: 'Parking fees kitni hai?' },
    { icon: '🎫', text: 'Monthly pass kaise lein?' },
    { icon: '🚗', text: 'Apni gaadi register kaise karein?' },
    { icon: '📱', text: 'App kaise use karein?' },
    { icon: '🔐', text: 'Password bhool gaya, kya karein?' },
  ];

  return (
    <div className="flex flex-col rounded-3xl overflow-hidden glass-panel animate-fade-in" style={{
      height: 'calc(100vh - 140px)',
      background: '#0f172a',
      fontFamily: 'system-ui, sans-serif'
    }}>

      {/* TOP BAR */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid #1e293b',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#0f172a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #1a56db, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18
          }}>🤖</div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>SmartPark AI</div>
            <div style={{ color: '#4ade80', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }}/>
              Online
            </div>
          </div>
        </div>
        <button
          onClick={() => setMessages([])}
          style={{
            padding: '6px 14px', borderRadius: 8,
            border: '1px solid #334155', background: 'transparent',
            color: '#94a3b8', fontSize: 12, cursor: 'pointer'
          }}>
          🗑️ Clear chat
        </button>
      </div>

      {/* MESSAGES AREA */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>

        {/* Welcome screen */}
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #1a56db, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36
            }}>🤖</div>
            <h2 style={{ color: 'white', fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>
              SmartPark AI Assistant
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 40px' }}>
              Parking se related koi bhi sawaal poochho — Hindi ya English mein!
            </p>

            {/* Suggestion grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 10, maxWidth: 600, margin: '0 auto'
            }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s.text)}
                  style={{
                    padding: '14px 16px', borderRadius: 12,
                    border: '1px solid #1e293b',
                    background: '#1e293b', color: '#e2e8f0',
                    fontSize: 13, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s', lineHeight: 1.4,
                    display: 'flex', alignItems: 'flex-start', gap: 8
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#1a56db'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#1e293b'}
                >
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <div key={i} style={{
            padding: '16px 24px',
            background: msg.role === 'assistant' ? '#111827' : 'transparent',
            borderBottom: msg.role === 'assistant' ? '1px solid #1e293b' : 'none'
          }}>
            <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 14 }}>
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                  : 'linear-gradient(135deg, #1a56db, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, color: 'white', fontWeight: 700
              }}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{
                  color: msg.role === 'user' ? '#f1f5f9' : '#e2e8f0',
                  fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {loading && (
          <div style={{
            padding: '16px 24px', background: '#111827',
            borderBottom: '1px solid #1e293b'
          }}>
            <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, #1a56db, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15
              }}>🤖</div>
              <div style={{ flex: 1 }}>
                {streamText ? (
                  <div style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {streamText}
                    <span style={{
                      display: 'inline-block', width: 2, height: 16,
                      background: '#06b6d4', marginLeft: 2,
                      animation: 'blink 1s infinite'
                    }}/>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', paddingTop: 8 }}>
                    {[0,1,2].map(j => (
                      <div key={j} style={{
                        width: 8, height: 8, borderRadius: '50%', background: '#1a56db',
                        animation: `bounce 1.2s infinite ${j*0.2}s`
                      }}/>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      <div style={{ padding: '16px 24px', background: '#0f172a', borderTop: '1px solid #1e293b' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-end',
            background: '#1e293b', borderRadius: 16,
            border: '1px solid #334155', padding: '12px 16px',
            transition: 'border 0.2s'
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Koi bhi parking sawaal poochho... (Enter to send, Shift+Enter for new line)"
              rows={1}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: '#f1f5f9', fontSize: 14, resize: 'none',
                outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
                maxHeight: 120, overflowY: 'auto'
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: 10, border: 'none',
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg, #1a56db, #06b6d4)'
                  : '#334155',
                color: 'white', fontSize: 16, cursor: input.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
              {loading ? '⏳' : '➤'}
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, color: '#334155', fontSize: 11 }}>
            SmartPark AI · Galgotias University Parking System
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>
    </div>
  );
}
