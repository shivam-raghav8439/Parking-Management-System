import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import InstallPrompt from './components/InstallPrompt';
import FloatingAI from './components/FloatingAI';

// Lazy load all pages
const Login           = lazy(() => import('./pages/Login'));
const Register        = lazy(() => import('./pages/Register'));
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword   = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail     = lazy(() => import('./pages/VerifyEmail'));
const GoogleSuccess   = lazy(() => import('./pages/GoogleSuccess'));
const Dashboard       = lazy(() => import('./pages/Dashboard'));
const Entry           = lazy(() => import('./pages/Entry'));
const Exit            = lazy(() => import('./pages/Exit'));
const ParkingMap      = lazy(() => import('./pages/ParkingMap'));
const History         = lazy(() => import('./pages/History'));
const Reports         = lazy(() => import('./pages/Reports'));
const Settings        = lazy(() => import('./pages/Settings'));
const Anpr            = lazy(() => import('./pages/Anpr'));
const Cctv            = lazy(() => import('./pages/Cctv'));
const AiAssistant     = lazy(() => import('./pages/AiAssistant'));
const RegisterVehicle = lazy(() => import('./pages/RegisterVehicle'));
const BookSlot        = lazy(() => import('./pages/user/BookSlot'));
const MyBookings      = lazy(() => import('./pages/user/MyBookings'));
const UserManagement  = lazy(() => import('./pages/admin/UserManagement'));
const SlotManagement  = lazy(() => import('./pages/admin/SlotManagement'));
const BookingManagement = lazy(() => import('./pages/admin/BookingManagement'));

const Loader = () => (
  <div style={{ minHeight:'100vh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center' }}>
    <div style={{ textAlign:'center', color:'white' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🅿️</div>
      <p style={{ color:'#64748b' }}>Loading SmartPark...</p>
    </div>
  </div>
);

function App() {
  const token = localStorage.getItem('token');
  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/verify-email"    element={<VerifyEmail />} />
          <Route path="/auth/google/success" element={<GoogleSuccess />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/entry"     element={<ProtectedRoute><Entry /></ProtectedRoute>} />
          <Route path="/exit"      element={<ProtectedRoute><Exit /></ProtectedRoute>} />
          <Route path="/map"       element={<ProtectedRoute><ParkingMap /></ProtectedRoute>} />
          <Route path="/history"   element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/reports"   element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/anpr"      element={<ProtectedRoute><Anpr /></ProtectedRoute>} />
          <Route path="/cctv"      element={<ProtectedRoute><Cctv /></ProtectedRoute>} />
          <Route path="/ai-assistant" element={<ProtectedRoute><AiAssistant /></ProtectedRoute>} />
          <Route path="/register-vehicle" element={<ProtectedRoute><RegisterVehicle /></ProtectedRoute>} />
          <Route path="/book-slot"    element={<ProtectedRoute><BookSlot /></ProtectedRoute>} />
          <Route path="/my-bookings"  element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />

          {/* Admin only */}
          <Route path="/admin/users"    element={<ProtectedRoute allowedRoles={['superadmin','admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/slots"    element={<ProtectedRoute allowedRoles={['superadmin','admin']}><SlotManagement /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['superadmin','admin']}><BookingManagement /></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
          <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </Suspense>

      <Toaster position="top-right" toastOptions={{ duration: 3000,
        style: { background:'#1e293b', color:'white', border:'1px solid #334155' }
      }}/>
      <InstallPrompt />
      {token && <FloatingAI />}
    </Router>
  );
}

export default App;
