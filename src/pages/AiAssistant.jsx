import { useState, useRef, useEffect } from 'react';

const SYSTEM_PROMPT = `You are SmartPark AI Assistant for Galgotias University.
You can answer ANY question the user asks — general knowledge, coding, math, science, anything.
Also you have special knowledge about this parking system:
- Car: Rs20/hour, Bike: Rs10/hour, Bicycle: Rs5/hour, Bus: Rs40/hour
- Monthly Pass: Car Rs800, Bike Rs400
- Zones: A=Cars, B=Bikes, C=Faculty, D=Visitors
- Timing: 6AM to 10PM
Always reply in same language user writes in (Hindi or English).
Be friendly, helpful, use emojis.`;

const callAI = async (messages) => {
  try {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        } : {})
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messages
      })
    });
    const data = await response.json();
    if (data.content && data.content[0]) {
      return data.content[0].text;
    }
  } catch (err) {
    console.warn("Direct Claude call failed, trying backend fallback:", err);
  }

  // Fallback to backend chat endpoint
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
  throw new Error(data.message || 'Failed to fetch reply from AI assistant endpoint');
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
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const userMsg = { role: 'user', content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    setStreamText('');

    try {
      const reply = await callAI(newMessages);
      let i = 0;
      const interval = setInterval(() => {
        i += 4;
        setStreamText(reply.slice(0, i));
        if (i >= reply.length) {
          clearInterval(interval);
          setStreamText('');
          setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
          setLoading(false);
        }
      }, 12);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, kuch problem aayi. Please dobara try karo.'
      }]);
      setLoading(false);
    }
  };

  const suggestions = [
    { icon: '🅿️', text: 'Kitne slots available hain abhi?' },
    { icon: '💰', text: 'Parking fees kya hai?' },
    { icon: '🎫', text: 'Monthly pass kaise lein?' },
    { icon: '💻', text: 'React kya hota hai?' },
    { icon: '🧮', text: '15 ka square root kya hai?' },
    { icon: '🌍', text: 'India ki capital kya hai?' },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)',
      background: '#0f172a', fontFamily: 'system-ui, sans-serif',
      borderRadius: '24px', overflow: 'hidden', border: '1px solid #1e293b'
    }}>

      {/* HEADER */}
      <div style={{
        padding: '14px 24px', borderBottom: '1px solid #1e293b',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#0f172a', position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #1a56db, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
          }}>🤖</div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>SmartPark AI</div>
            <div style={{ color: '#4ade80', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }}/>
              Online — Kuch bhi poochho!
            </div>
          </div>
        </div>
        <button onClick={() => setMessages([])} style={{
          padding: '6px 14px', borderRadius: 8,
          border: '1px solid #334155', background: 'transparent',
          color: '#94a3b8', fontSize: 12, cursor: 'pointer'
        }}>🗑️ New Chat</button>
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>

        {/* Welcome screen */}
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 24px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24, margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #1a56db, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40
            }}>🤖</div>
            <h2 style={{ color: 'white', fontSize: 28, fontWeight: 700, margin: '0 0 10px' }}>
              SmartPark AI Assistant
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 8px' }}>
              Kuch bhi poochho — parking se related ya koi bhi sawaal!
            </p>
            <p style={{ color: '#475569', fontSize: 12, margin: '0 0 36px' }}>
              Hindi aur English dono mein baat kar sakte ho 🇮🇳
            </p>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 10, maxWidth: 520, margin: '0 auto', padding: '0 16px'
            }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s.text)} style={{
                  padding: '14px 16px', borderRadius: 12,
                  border: '1px solid #1e293b', background: '#1e293b',
                  color: '#e2e8f0', fontSize: 13, cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'flex-start', gap: 10
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = '#1a56db';
                  e.currentTarget.style.background = '#1e3a8a';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = '#1e293b';
                  e.currentTarget.style.background = '#1e293b';
                }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <span style={{ lineHeight: 1.4 }}>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <div key={i} style={{
            padding: '20px 24px',
            background: msg.role === 'assistant' ? '#111827' : 'transparent',
          }}>
            <div style={{ maxWidth: 740, margin: '0 auto', display: 'flex', gap: 16 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                  : 'linear-gradient(135deg, #1a56db, #06b6d4)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16
              }}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  color: msg.role === 'user' ? '#f8fafc' : '#e2e8f0',
                  fontSize: 14, lineHeight: 1.85,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }}>
                  {msg.content}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Streaming */}
        {loading && (
          <div style={{ padding: '20px 24px', background: '#111827' }}>
            <div style={{ maxWidth: 740, margin: '0 auto', display: 'flex', gap: 16 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, #1a56db, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
              }}>🤖</div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                {streamText ? (
                  <div style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
                    {streamText}
                    <span style={{
                      display: 'inline-block', width: 2, height: 16,
                      background: '#06b6d4', marginLeft: 2,
                      animation: 'blink 0.8s infinite'
                    }}/>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 5, paddingTop: 6 }}>
                    {[0,1,2].map(j => (
                      <div key={j} style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#1a56db',
                        animation: `bounce 1.2s infinite ${j * 0.2}s`
                      }}/>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* INPUT */}
      <div style={{ padding: '16px 24px 24px', background: '#0f172a', borderTop: '1px solid #1e293b' }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-end',
            background: '#1e293b', borderRadius: 16,
            border: '1.5px solid #334155', padding: '10px 14px',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 130) + 'px';
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Kuch bhi poochho... (Enter = Send | Shift+Enter = New line)"
              rows={1}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: '#f1f5f9', fontSize: 14, resize: 'none',
                outline: 'none', fontFamily: 'inherit',
                lineHeight: 1.65, maxHeight: 130, overflowY: 'auto'
              }}
            />
            <button onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 40, height: 40, borderRadius: 10, border: 'none',
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg, #1a56db, #06b6d4)' : '#334155',
                color: 'white', fontSize: 18, cursor: input.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
              {loading ? '⏳' : '➤'}
            </button>
          </div>
          <p style={{ textAlign: 'center', color: '#1e293b', fontSize: 11, marginTop: 8 }}>
            SmartPark AI · Powered by Claude · Galgotias University
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%,100% { transform:translateY(0); opacity:0.4; }
          50% { transform:translateY(-6px); opacity:1; }
        }
        @keyframes blink {
          0%,100% { opacity:1; } 50% { opacity:0; }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>
    </div>
  );
}
