import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function FloatingAI() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/ai-assistant')}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 999,
        width: 56,
        height: 56,
        borderRadius: '50%',
        border: 'none',
        background: 'linear-gradient(135deg, #1a56db, #06b6d4)',
        fontSize: 24,
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(26,86,219,0.5)',
        animation: 'pulse-floating-ai 2s infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      🤖
      <style>{`
        @keyframes pulse-floating-ai {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(26,86,219,0.5); }
          50% { transform: scale(1.05); box-shadow: 0 4px 30px rgba(26,86,219,0.8); }
        }
      `}</style>
    </button>
  );
}
