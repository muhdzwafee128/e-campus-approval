import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

// Auth pages
import Login from './pages/Login';
import RegisterStudent from './pages/RegisterStudent';
import RegisterAuthority from './pages/RegisterAuthority';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import MyRequests from './pages/student/MyRequests';
import RequestDetail from './pages/student/RequestDetail';
import NewRequest from './pages/student/NewRequest/NewRequest';

// Authority pages
import AuthorityDashboard from './pages/authority/Dashboard';
import PendingQueue from './pages/authority/PendingQueue';
import ReviewRequest from './pages/authority/ReviewRequest';
import History from './pages/authority/History';

// Office Staff pages
import OfficeDashboard from './pages/office/OfficeDashboard';
import ProcessRequest from './pages/office/ProcessRequest';
import OfficeHistory from './pages/office/OfficeHistory';

// Public
import VerifyPage from './pages/Verify';

// Settings (shared)
import Settings from './pages/Settings';

const AUTHORITY_ROLES = ['tutor', 'faculty_coordinator', 'hod', 'principal'];
const OFFICE_ROLES = ['office_staff'];

function ProtectedRoute({ children, allowed }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: 120 }} />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowed && !allowed.includes(user.role)) {
    // Navigate to the user's correct home
    if (user.role === 'student') return <Navigate to="/dashboard" replace />;
    if (user.role === 'office_staff') return <Navigate to="/office/dashboard" replace />;
    return <Navigate to="/authority/dashboard" replace />;
  }
  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: 120 }} />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'student') return <Navigate to="/dashboard" replace />;
  if (user.role === 'office_staff') return <Navigate to="/office/dashboard" replace />;
  return <Navigate to="/authority/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterStudent />} />
          <Route path="/register/authority" element={<RegisterAuthority />} />
          <Route path="/verify/:requestId" element={<VerifyPage />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* Student routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowed={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/requests" element={
            <ProtectedRoute allowed={['student']}>
              <MyRequests />
            </ProtectedRoute>
          } />
          <Route path="/requests/:id" element={
            <ProtectedRoute allowed={['student']}>
              <RequestDetail />
            </ProtectedRoute>
          } />
          <Route path="/new-request" element={
            <ProtectedRoute allowed={['student']}>
              <NewRequest />
            </ProtectedRoute>
          } />

          {/* Authority routes */}
          <Route path="/authority/dashboard" element={
            <ProtectedRoute allowed={AUTHORITY_ROLES}>
              <AuthorityDashboard />
            </ProtectedRoute>
          } />
          <Route path="/authority/queue" element={
            <ProtectedRoute allowed={AUTHORITY_ROLES}>
              <PendingQueue />
            </ProtectedRoute>
          } />
          <Route path="/authority/review/:id" element={
            <ProtectedRoute allowed={AUTHORITY_ROLES}>
              <ReviewRequest />
            </ProtectedRoute>
          } />
          <Route path="/authority/history" element={
            <ProtectedRoute allowed={AUTHORITY_ROLES}>
              <History />
            </ProtectedRoute>
          } />

          {/* Office Staff routes */}
          <Route path="/office/dashboard" element={
            <ProtectedRoute allowed={OFFICE_ROLES}>
              <OfficeDashboard />
            </ProtectedRoute>
          } />
          <Route path="/office/process/:id" element={
            <ProtectedRoute allowed={OFFICE_ROLES}>
              <ProcessRequest />
            </ProtectedRoute>
          } />
          <Route path="/office/history" element={
            <ProtectedRoute allowed={OFFICE_ROLES}>
              <OfficeHistory />
            </ProtectedRoute>
          } />

          {/* Shared */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
