import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { FaChartBar, FaClipboardList, FaMoneyBillWave, FaStar, FaUser, FaCog, FaUsers, FaUserTie, FaBoxOpen, FaCreditCard, FaCalendarAlt, FaBriefcase, FaBell, FaCommentAlt } from 'react-icons/fa';

import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Sidebar from './components/common/Sidebar';
import { PageLoader } from './components/common/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Customer Pages
import Home from './pages/customer/Home';
import Services from './pages/customer/Services';
import ServiceDetail from './pages/customer/ServiceDetail';
import Booking from './pages/customer/Booking';
import MyBookings from './pages/customer/MyBookings';
import CustomerProfile from './pages/customer/CustomerProfile';
import MyAddresses from './pages/customer/MyAddresses';
import RequestCustomService from './pages/customer/RequestCustomService';
import MyCustomRequests from './pages/customer/MyCustomRequests';
import CustomRequestDetail from './pages/customer/CustomRequestDetail';

// Provider Pages
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderEarnings from './pages/provider/ProviderEarnings';
import ProviderBookings from './pages/provider/ProviderBookings';
import ProviderProfile from './pages/provider/ProviderProfile';
import ProviderServices from './pages/provider/ProviderServices';
import ProviderReviews from './pages/provider/ProviderReviews';
import ProviderNotifications from './pages/provider/ProviderNotifications';
import AddService from './pages/provider/AddService';
import ProviderCustomRequests from './pages/provider/ProviderCustomRequests';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageProviders from './pages/admin/ManageProviders';
import ManageServices from './pages/admin/ManageServices';
import AdminBookings from './pages/admin/AdminBookings';

// Static Customer Pages
import About from './pages/customer/About';
import Terms from './pages/customer/Terms';
import Help from './pages/customer/Help';



// Page transition wrapper
const PageTransition = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Provider Layout
const providerLinks = [
  { to: '/provider', label: 'Dashboard', icon: FaChartBar, end: true },
  { to: '/provider/bookings', label: 'Bookings', icon: FaClipboardList },
  { to: '/provider/services', label: 'My Services', icon: FaBriefcase },
  { to: '/provider/custom-requests', label: 'Custom Requests', icon: FaCommentAlt },
  { to: '/provider/earnings', label: 'Earnings', icon: FaMoneyBillWave },
  { to: '/provider/reviews', label: 'Reviews', icon: FaStar },
  { to: '/provider/notifications', label: 'Notifications', icon: FaBell },
  { to: '/provider/profile', label: 'My Profile', icon: FaUser },
];

const ProviderLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar links={providerLinks} title="Provider" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        {/* Top Bar for provider */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-3 flex items-center justify-between lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold text-gray-900">🏠 Home<span className="text-primary-600">Fix</span></span>
          <div className="w-9" />
        </div>
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Admin Layout
const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: FaChartBar, end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: FaClipboardList },
  { to: '/admin/users', label: 'Users', icon: FaUsers },
  { to: '/admin/providers', label: 'Providers', icon: FaUserTie, badge: '12' },
  { to: '/admin/services', label: 'Services', icon: FaBoxOpen },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar links={adminLinks} title="Admin" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-3 flex items-center justify-between lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold text-gray-900">🏠 Home<span className="text-primary-600">Fix</span> Admin</span>
          <div className="w-9" />
        </div>
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Public Layout
const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

// 404
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
      <span className="text-8xl">🏚️</span>
      <h1 className="text-4xl font-bold text-gray-900 mt-6">404</h1>
      <p className="text-gray-500 mt-2">Oops! This page doesn't exist</p>
      <a href="/" className="btn-primary mt-6 inline-block">Go Home</a>
    </motion.div>
  </div>
);

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#ffffff',
              color: '#1f2937',
              boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
              borderRadius: '12px',
              padding: '14px 18px',
              fontSize: '14px',
              fontWeight: '500',
            },
          }}
        />

        <Routes>
          {/* Auth Routes — no navbar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Provider Routes */}
          <Route path="/provider" element={<ProtectedRoute allowedRoles={['provider']}><ProviderLayout /></ProtectedRoute>}>
              <Route index element={<ProviderDashboard />} />
              <Route path="bookings" element={<ProviderBookings />} />
              <Route path="services" element={<ProviderServices />} />
              <Route path="earnings" element={<ProviderEarnings />} />
              <Route path="profile" element={<ProviderProfile />} />
              <Route path="reviews" element={<ProviderReviews />} />
              <Route path="notifications" element={<ProviderNotifications />} />
              <Route path="add-service" element={<AddService />} />
              <Route path="custom-requests" element={<ProviderCustomRequests />} />
            </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="providers" element={<ManageProviders />} />
            <Route path="services" element={<ManageServices />} />
          </Route>

          {/* Public + Customer Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            
            {/* New Static Pages */}
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/help" element={<Help />} />

            {/* Protected customer routes */}
            <Route path="/booking" element={<ProtectedRoute allowedRoles={['customer']}><Booking /></ProtectedRoute>} />
            <Route path="/my-bookings" element={<ProtectedRoute allowedRoles={['customer']}><MyBookings /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={['customer']}><CustomerProfile /></ProtectedRoute>} />
            <Route path="/my-addresses" element={<ProtectedRoute allowedRoles={['customer']}><MyAddresses /></ProtectedRoute>} />
            
            {/* Custom Service Routes */}
            <Route path="/request-custom-service" element={<ProtectedRoute allowedRoles={['customer']}><RequestCustomService /></ProtectedRoute>} />
            <Route path="/my-custom-requests" element={<ProtectedRoute allowedRoles={['customer']}><MyCustomRequests /></ProtectedRoute>} />
            <Route path="/custom-requests/:id" element={<ProtectedRoute allowedRoles={['customer']}><CustomRequestDetail /></ProtectedRoute>} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
