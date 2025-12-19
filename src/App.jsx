import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Footer from './components/Footer';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';

// Pages
import CheckInDashboard from './pages/CheckInDashboard';
import CheckInHistory from './pages/CheckInHistory';
import CheckInScanner from './pages/CheckInScanner';
import CheckoutPage from './pages/CheckoutPage';
import Contact from './pages/Contact';
import CreateEvent from './pages/CreateEvent';
import CreateOrganization from './pages/CreateOrganization';
import Dashboard from './pages/Dashboard';
import EditEvent from './pages/EditEvent';
import EditOrganization from './pages/EditOrganization';
import EventDetail from './pages/EventDetail';
import Events from './pages/Events';
import EventsPage from './pages/EventsPage';
import ForgotPassword from './pages/ForgotPassword';
import GoogleCallback from './pages/GoogleCallback';
import Home from './pages/Home';
import Login from './pages/Login';
import MyOrders from './pages/MyOrders';
import MyRefunds from './pages/MyRefunds';
import NotFound from './pages/NotFound';
import OrderDetail from './pages/OrderDetail';
import OrderSuccess from './pages/OrderSuccess';
import OrderTracking from './pages/OrderTracking';
import OrganizationDetail from './pages/OrganizationDetail';
import OrganizationMembers from './pages/OrganizationMembers';
import OrganizationsPage from './pages/OrganizationsPage';
import PaymentError from './pages/PaymentError';
import PaymentFailure from './pages/PaymentFailure';
import PaymentResult from './pages/PaymentResult';
import PaymentReturn from './pages/PaymentReturn';
import PaymentSuccess from './pages/PaymentSuccess';
import Policy from './pages/Policy';
import Profile from './pages/Profile';
import PublicEventDetail from './pages/PublicEventDetail';
import RefundDetail from './pages/RefundDetail';
import RefundsManagement from './pages/RefundsManagement';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import RevenueSharesManagement from './pages/RevenueSharesManagement';
import Settings from './pages/Settings';
import VerifyOTP from './pages/VerifyOTP';

function AppContent() {
  const location = useLocation();
  const hideFooterPaths = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password'];
  const isDashboardRoute = location.pathname.startsWith('/dashboard') || 
                           location.pathname.startsWith('/organizations') || 
                           location.pathname.startsWith('/create-organization') ||
                           location.pathname.startsWith('/events-management') ||
                           (location.pathname.startsWith('/events/') && location.pathname !== '/events') ||
                           location.pathname.startsWith('/create-event') ||
                           location.pathname.startsWith('/checkout') ||
                           location.pathname.startsWith('/order-success') ||
                           location.pathname.startsWith('/orders') ||
                           location.pathname.startsWith('/profile') ||
                           location.pathname.startsWith('/settings') ||
                           location.pathname.startsWith('/admin/revenue-shares') ||
                           location.pathname.startsWith('/refunds') ||
                           location.pathname.startsWith('/check-in');
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
        <Route path="/e/:slug" element={<PublicEventDetail />} />
        <Route path="/policy" element={<Policy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/track-order" element={<OrderTracking />} />
        <Route path="/payment/return" element={<PaymentReturn />} />
        <Route path="/payment/result" element={<PaymentResult />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
        <Route path="/payment/error" element={<PaymentError />} />

        {/* Protected pages */}
        <Route
          path="/checkout/:eventId"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-success/:orderId"
          element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
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
              <OrganizationsPage />
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
        <Route
          path="/events-management"
          element={
            <ProtectedRoute>
              <EventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/revenue-shares"
          element={
            <ProtectedRoute>
              <RevenueSharesManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/refunds"
          element={
            <ProtectedRoute>
              <MyRefunds />
            </ProtectedRoute>
          }
        />
        <Route
          path="/refunds/:refundId"
          element={
            <ProtectedRoute>
              <RefundDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/refunds"
          element={
            <ProtectedRoute>
              <RefundsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/check-in"
          element={
            <ProtectedRoute>
              <CheckInDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/check-in/scanner"
          element={
            <ProtectedRoute>
              <CheckInScanner />
            </ProtectedRoute>
          }
        />
        <Route
          path="/check-in/history/:eventId"
          element={
            <ProtectedRoute>
              <CheckInHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:eventId"
          element={
            <ProtectedRoute>
              <EventDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:eventId/edit"
          element={
            <ProtectedRoute>
              <EditEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-event"
          element={
            <ProtectedRoute>
              <CreateEvent />
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
