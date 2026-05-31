import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/parkingApi';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Enter email and password'); return; }
    try {
      setLoading(true);
      const { data } = await authApi.login({ email: email.trim().toLowerCase(), password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success(`Welcome, ${data.user.name}! 🎉`);
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.data?.needsVerification) {
        setNeedsVerify(true);
        setUnverifiedEmail(error.response.data.email);
      }
      toast.error(error.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    try {
      await authApi.resendVerification({ email: unverifiedEmail });
      toast.success('Verification email sent!');
    } catch {
      toast.error('Failed to resend. Try again.');
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ width:'100%', maxWidth:420 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:64, height:64, borderRadius:16, background:'linear-gradient(135deg,#1a56db,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 12px' }}>🅿️</div>
          <h1 style={{ color:'white', fontSize:24, fontWeight:700, margin:0 }}>SmartPark</h1>
          <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>Galgotias University Parking System</p>
        </div>

        {/* Card */}
        <div style={{ background:'#1e293b', borderRadius:20, padding:28, border:'1px solid #334155' }}>
          <h2 style={{ color:'white', fontSize:20, fontWeight:700, margin:'0 0 24px' }}>Sign In</h2>

          {needsVerify && (
            <div style={{ background:'#422006', border:'1px solid #f59e0b', borderRadius:10, padding:14, marginBottom:16 }}>
              <p style={{ color:'#fbbf24', fontSize:13, margin:'0 0 8px' }}>⚠️ Email not verified yet.</p>
              <button onClick={resendVerification}
                style={{ background:'#f59e0b', color:'black', border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                📧 Resend Verification Email
              </button>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom:16 }}>
              <label style={{ color:'#94a3b8', fontSize:12, fontWeight:600, display:'block', marginBottom:6 }}>EMAIL ADDRESS</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                type="email" placeholder="you@gmail.com"
                style={{ width:'100%', padding:'12px 14px', background:'#0f172a', border:'1px solid #334155', borderRadius:10, color:'white', fontSize:14, outline:'none', boxSizing:'border-box' }}/>
            </div>

            <div style={{ marginBottom:8 }}>
              <label style={{ color:'#94a3b8', fontSize:12, fontWeight:600, display:'block', marginBottom:6 }}>PASSWORD</label>
              <div style={{ position:'relative' }}>
                <input value={password} onChange={e => setPassword(e.target.value)}
                  type={showPass ? 'text' : 'password'} placeholder="Enter password"
                  style={{ width:'100%', padding:'12px 44px 12px 14px', background:'#0f172a', border:'1px solid #334155', borderRadius:10, color:'white', fontSize:14, outline:'none', boxSizing:'border-box' }}/>
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:16 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={{ textAlign:'right', marginBottom:20 }}>
              <Link to="/forgot-password" style={{ color:'#1a56db', fontSize:12, textDecoration:'none' }}>Forgot Password?</Link>
            </div>

            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:14, background: loading ? '#334155' : 'linear-gradient(135deg,#1a56db,#06b6d4)', color:'white', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor: loading ? 'default' : 'pointer', transition:'all 0.2s' }}>
              {loading ? '⏳ Signing in...' : '🔐 Sign In'}
            </button>
          </form>

          <p style={{ textAlign:'center', color:'#64748b', fontSize:13, marginTop:20 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'#1a56db', fontWeight:600, textDecoration:'none' }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
