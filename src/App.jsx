import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GoogleCallback from './pages/GoogleCallback';
import Events from './pages/Events';
import Policy from './pages/Policy';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import OrganizationsManagement from './pages/OrganizationsManagement';
import CreateOrganization from './pages/CreateOrganization';
import OrganizationMembers from './pages/OrganizationMembers';
import OrganizationDetail from './pages/OrganizationDetail';
import EditOrganization from './pages/EditOrganization';
``
function AppContent() {
  const location = useLocation();
  const hideFooterPaths = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password'];
  const isDashboardRoute = location.pathname.startsWith('/dashboard') || 
                           location.pathname.startsWith('/organizations') || 
                           location.pathname.startsWith('/create-organization');
  const showFooter = !hideFooterPaths.includes(location.pathname) && !isDashboardRoute;

  return (
    <div className="flex flex-col min-h-screen">
      <Routes>
        {/* Public routes - chỉ cho phép khi chưa đăng nhập */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-otp"
          element={
            <PublicRoute>
              <VerifyOTP />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/auth/callback"
          element={
            <PublicRoute>
              <GoogleCallback />
            </PublicRoute>
          }
        />

        {/* Home page - Public */}
        <Route path="/" element={<Home />} />

        {/* Public pages with header */}
        <Route path="/events" element={<Events />} />
        <Route path="/policy" element={<Policy />} />
        <Route path="/contact" element={<Contact />} />

        {/* Protected pages */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizations"
          element={
            <ProtectedRoute>
              <OrganizationsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-organization"
          element={
            <ProtectedRoute>
              <CreateOrganization />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizations/:organizationId/edit"
          element={
            <ProtectedRoute>
              <EditOrganization />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizations/:organizationId"
          element={
            <ProtectedRoute>
              <OrganizationDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizations/:organizationId/members"
          element={
            <ProtectedRoute>
              <OrganizationMembers />
            </ProtectedRoute>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
