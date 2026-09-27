import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FaBriefcase, FaBell, FaChartLine, FaStar, FaClock,
  FaMapMarkerAlt, FaCheck, FaTimes, FaLocationArrow,
  FaSave, FaExclamationTriangle, FaTrash, FaPhone,
  FaCalendarAlt, FaPlus, FaToggleOn, FaToggleOff, FaEdit
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import LeafletMap from '../../components/common/LeafletMap';
import toast from 'react-hot-toast';

const API = 'http://localhost:5000';

const StatCard = ({ title, value, subtitle, icon, color, index }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-violet-500 to-violet-600',
    amber: 'from-amber-500 to-orange-500',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[color] || colors.blue} flex items-center justify-center text-white text-lg shadow-sm`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

const ProviderDashboard = () => {
  const { user, updateProviderSettings, updateUser } = useAuth();
  const [stats, setStats] = useState({ totalBookings: 0, completedJobs: 0, thisMonthEarnings: 0, avgRating: 0, pendingBookings: 0, activeBookings: 0 });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [pendingCustomRequests, setPendingCustomRequests] = useState([]);

  // Location state
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationForm, setLocationForm] = useState({
    street: user?.address?.street || '',
    locality: user?.address?.locality || '',
    city: user?.address?.city || user?.city || 'Haldwani',
    state: user?.address?.state || 'Uttarakhand',
    pincode: user?.address?.pincode || '',
    latitude: user?.address?.latitude || user?.location?.coordinates?.[1] || 29.3803,
    longitude: user?.address?.longitude || user?.location?.coordinates?.[0] || 79.5126,
    serviceRadius: user?.serviceRadius || 10,
  });
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  useEffect(() => {
    if (user) {
      setLocationForm(prev => ({
        ...prev,
        street: user.address?.street || prev.street,
        locality: user.address?.locality || prev.locality,
        city: user.address?.city || user.city || prev.city,
        state: user.address?.state || prev.state,
        pincode: user.address?.pincode || prev.pincode,
        latitude: user.address?.latitude || user.location?.coordinates?.[1] || prev.latitude,
        longitude: user.address?.longitude || user.location?.coordinates?.[0] || prev.longitude,
        serviceRadius: user.serviceRadius || prev.serviceRadius,
      }));
    }
  }, [user]);

  const loadDashboardData = async () => {
    // Stats
    try {
      const res = await fetch(`${API}/api/providers/me/stats`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (e) { console.error('Stats error', e); }

    // Bookings
    try {
      const res = await fetch(`${API}/api/bookings`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setPendingBookings(data.bookings.filter(b => b.status === 'pending'));
        setUpcomingBookings(
          data.bookings.filter(b => ['confirmed', 'upcoming', 'ongoing'].includes(b.status))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5)
        );
      }
    } catch (e) { console.error('Bookings error', e); }

    // My Services
    try {
      const res = await fetch(`${API}/api/services/me`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setMyServices(data.services || []);
    } catch (e) { console.error('Services error', e); }

    // Reviews
    try {
      const res = await fetch(`${API}/api/providers/me/reviews`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setRecentReviews((data.reviews || []).slice(0, 3));
    } catch (e) { /* Reviews model may not exist yet */ }

    // Notifications
    try {
      const res = await fetch(`${API}/api/notifications`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications || []);
    } catch (e) { console.error('Notifications error', e); }

    // Custom Requests
    try {
      const res = await fetch(`${API}/api/custom-requests`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        const myId = (user?.id || user?._id)?.toString();
        const unhandled = (data.requests || []).filter(r => {
          const isAccepted = (r.acceptedProviders?.some(p => (p._id || p)?.toString() === myId)) ||
            (r.selectedProviderId && (r.selectedProviderId._id || r.selectedProviderId)?.toString() === myId);
          const isDeclined = r.declinedProviders?.some(p => (p._id || p)?.toString() === myId);
          return (r.status === 'PENDING' || r.status === 'pending') && !isAccepted && !isDeclined;
        });
        setPendingCustomRequests(unhandled);
      }
    } catch (e) { console.error('Custom requests error', e); }
  };

  useEffect(() => { loadDashboardData(); }, [user]);

  const handleToggleAvailability = async (e) => {
    const newValue = e.target.checked;
    const hasValidLocation = user?.location?.coordinates &&
      (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0);
    if (newValue && !hasValidLocation) {
      toast.error('Please save your service location before turning on availability.');
      setIsEditingLocation(true);
      return;
    }
    setTogglingAvailability(true);
    try {
      const res = await updateProviderSettings({ openToCustomRequests: newValue });
      if (res.success) toast.success(newValue ? '🟢 You are now Online & accepting requests!' : '🔴 You are now Offline.');
    } catch (err) {
      toast.error(err.message || 'Failed to update availability');
    } finally { setTogglingAvailability(false); }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    toast.loading('Detecting GPS location...', { id: 'geo' });
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      try {
        const res = await fetch(`${API}/api/location/reverse-geocode`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: lat, longitude: lng })
        });
        const data = await res.json();
        setLocationForm(prev => ({
          ...prev, latitude: lat, longitude: lng,
          city: data.city || data.locality || prev.city,
          locality: data.locality || prev.locality,
          street: data.formattedAddress || prev.street,
          pincode: data.pincode || prev.pincode,
        }));
        toast.success('Location detected!', { id: 'geo' });
      } catch (e) {
        setLocationForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
        toast.success(`GPS coordinates captured`, { id: 'geo' });
      }
    }, () => toast.error('Could not get GPS location', { id: 'geo' }));
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    setSavingLocation(true);
    try {
      const res = await fetch(`${API}/api/location/provider`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({
          latitude: Number(locationForm.latitude), longitude: Number(locationForm.longitude),
          street: locationForm.street, locality: locationForm.locality,
          city: locationForm.city, state: locationForm.state, pincode: locationForm.pincode,
          serviceRadius: Number(locationForm.serviceRadius),
          formattedAddress: `${locationForm.street || ''} ${locationForm.locality || ''} ${locationForm.city}, ${locationForm.state} ${locationForm.pincode}`.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('✅ Location saved!');
        setIsEditingLocation(false);
        if (updateUser) updateUser(data.user);
        loadDashboardData();
      } else toast.error(data.message || 'Failed to save location');
    } catch (e) { toast.error('Network error saving location'); }
    finally { setSavingLocation(false); }
  };

  const handleAcceptBooking = async (id) => {
    setPendingBookings(prev => prev.filter(b => b.id !== id));
    try {
      const res = await fetch(`${API}/api/bookings/${id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ status: 'confirmed' })
      });
      const data = await res.json();
      if (data.success) { toast.success('Booking accepted!'); loadDashboardData(); }
      else throw new Error(data.message);
    } catch (e) { toast.error('Failed to accept booking'); loadDashboardData(); }
  };

  const handleRejectBooking = async (id) => {
    setPendingBookings(prev => prev.filter(b => b.id !== id));
    try {
      const res = await fetch(`${API}/api/bookings/${id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ status: 'cancelled' })
      });
      const data = await res.json();
      if (data.success) { toast.success('Booking declined'); loadDashboardData(); }
    } catch (e) { toast.error('Failed to decline booking'); loadDashboardData(); }
  };

  const handleCustomRequestAction = async (id, action) => {
    setPendingCustomRequests(prev => prev.filter(r => r._id !== id));
    try {
      const res = await fetch(`${API}/api/custom-requests/${id}/${action}`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        toast.success(action === 'accept' ? 'Custom request accepted!' : 'Request ignored');
        loadDashboardData();
      }
    } catch (e) { loadDashboardData(); }
  };

  const handleToggleService = async (serviceId, currentStatus) => {
    setMyServices(prev => prev.map(s => s._id === serviceId ? { ...s, isActive: !currentStatus } : s));
    try {
      const res = await fetch(`${API}/api/services/${serviceId}/toggle`, { method: 'PUT', credentials: 'include' });
      const data = await res.json();
      if (!data.success) {
        setMyServices(prev => prev.map(s => s._id === serviceId ? { ...s, isActive: currentStatus } : s));
        toast.error('Failed to toggle service');
      }
    } catch (e) {
      setMyServices(prev => prev.map(s => s._id === serviceId ? { ...s, isActive: currentStatus } : s));
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      const res = await fetch(`${API}/api/services/${serviceId}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setMyServices(prev => prev.filter(s => s._id !== serviceId));
        toast.success('Service deleted');
      } else toast.error(data.message || 'Failed to delete');
    } catch (e) { toast.error('Failed to delete service'); }
  };

  const isAvailable = user?.openToCustomRequests || false;
  const hasSavedLocation = user?.location?.coordinates &&
    (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0);
  const totalPending = pendingBookings.length + pendingCustomRequests.length;
  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    upcoming: 'bg-indigo-100 text-indigo-700',
    ongoing: 'bg-purple-100 text-purple-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6 pb-16">
      {user?.verificationStatus === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl flex items-start gap-3 shadow-sm">
          <FaExclamationTriangle className="mt-0.5 text-amber-600 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Profile Under Verification</p>
            <p className="mt-0.5 text-amber-700">Your provider account is currently pending verification. You can update your profile and add services, but they won't be visible to customers until approved.</p>
          </div>
        </div>
      )}
      {user?.verificationStatus === 'rejected' && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl flex items-start gap-3 shadow-sm">
          <FaBan className="mt-0.5 text-red-600 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Profile Rejected</p>
            <p className="mt-0.5 text-red-700">Your provider account application has been rejected. Please contact support for more details.</p>
          </div>
        </div>
      )}

      {/* ===== HEADER: Welcome + Online Toggle + Add Service ===== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's your business overview for today.</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Online/Offline Toggle — Prominent */}
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 transition-all duration-300 ${isAvailable
            ? 'bg-emerald-50 border-emerald-200 shadow-sm shadow-emerald-100'
            : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className={`text-sm font-bold ${isAvailable ? 'text-emerald-700' : 'text-gray-500'}`}>
                {isAvailable ? 'Online' : 'Offline'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isAvailable} onChange={handleToggleAvailability}
                disabled={togglingAvailability} className="sr-only peer" />
              <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer
                peer-checked:after:translate-x-full peer-checked:after:border-white
                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                after:bg-white after:border-gray-300 after:border after:rounded-full
                after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>

          <Link to="/provider/services"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-2xl text-sm font-bold hover:bg-primary-700 transition shadow-sm shadow-primary-200">
            <FaPlus /> Add New Service
          </Link>
        </div>
      </motion.div>

      {/* Location Warning */}
      {!hasSavedLocation && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
          <FaExclamationTriangle className="text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Location not set!</p>
            <p className="text-xs text-amber-600">Add your service location to receive booking requests from nearby customers.</p>
          </div>
          <button onClick={() => setIsEditingLocation(true)}
            className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition flex-shrink-0">
            Set Location
          </button>
        </motion.div>
      )}

      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Bookings" value={stats.totalBookings} subtitle="All time" icon={<FaCalendarAlt />} color="blue" index={0} />
        <StatCard title="Completed Jobs" value={stats.completedJobs} subtitle="Successfully done" icon={<FaCheck />} color="green" index={1} />
        <StatCard title="This Month" value={`₹${stats.thisMonthEarnings.toLocaleString()}`} subtitle="Net earnings" icon={<FaChartLine />} color="purple" index={2} />
        <StatCard title="Avg Rating"
          value={stats.avgRating > 0 ? `⭐ ${stats.avgRating}` : '—'}
          subtitle={stats.totalReviews > 0 ? `${stats.totalReviews} reviews` : 'No reviews yet'}
          icon={<FaStar />} color="amber" index={3} />
      </div>

      {/* ===== Location Edit Panel ===== */}
      <AnimatePresence>
        {isEditingLocation && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="card p-6 bg-gradient-to-br from-purple-50/60 to-white border border-purple-100 overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-purple-900 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-purple-500" /> Service Base Location
                </h3>
                <p className="text-xs text-gray-500">Set your GPS pin — customers within your radius will find you.</p>
              </div>
              <button type="button" onClick={handleDetectLocation}
                className="px-3 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 flex items-center gap-1.5">
                <FaLocationArrow /> Detect GPS
              </button>
            </div>
            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Street / Locality</label>
                  <input type="text" value={locationForm.street} onChange={e => setLocationForm({ ...locationForm, street: e.target.value })}
                    placeholder="e.g. Near Bus Stand, Mall Road" className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City *</label>
                  <input type="text" value={locationForm.city} onChange={e => setLocationForm({ ...locationForm, city: e.target.value })}
                    required className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pincode *</label>
                  <input type="text" value={locationForm.pincode} onChange={e => setLocationForm({ ...locationForm, pincode: e.target.value })}
                    required className="input-field text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Service Radius (km) *</label>
                  <input type="number" min="1" max="100" value={locationForm.serviceRadius}
                    onChange={e => setLocationForm({ ...locationForm, serviceRadius: e.target.value })}
                    required className="input-field text-sm" />
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-purple-900 font-semibold">
                    📍 Coordinates: <span className="font-mono">{Number(locationForm.latitude).toFixed(4)}, {Number(locationForm.longitude).toFixed(4)}</span>
                  </p>
                  <p className="text-[11px] text-gray-400">Drag pin on map or click to move</p>
                </div>
              </div>
              <LeafletMap
                center={[locationForm.latitude, locationForm.longitude]}
                markerPosition={[locationForm.latitude, locationForm.longitude]}
                radius={Number(locationForm.serviceRadius || 10)}
                useCustomRedIcon={true} interactive={true} height="280px"
                onPositionChange={(lat, lng) => setLocationForm(prev => ({ ...prev, latitude: lat, longitude: lng }))}
              />
              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => setIsEditingLocation(false)} className="btn-ghost text-sm">Cancel</button>
                <button type="submit" disabled={savingLocation} className="btn-primary text-sm flex items-center gap-2">
                  <FaSave /> {savingLocation ? 'Saving...' : 'Save Location'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MAIN GRID ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Pending Requests + Upcoming Bookings */}
        <div className="lg:col-span-2 space-y-6">

          {/* Pending Incoming Requests */}
          {totalPending > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  📥 Incoming Requests
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{totalPending}</span>
                </h2>
              </div>
              <div className="space-y-3">
                {pendingBookings.map(b => (
                  <div key={b.id} className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-blue-100 text-blue-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Booking</span>
                        <span className="text-xs text-gray-400">#{b.id}</span>
                      </div>
                      <h3 className="font-bold text-gray-900">{b.serviceName}</h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><FaPhone className="text-gray-400" /> {b.customerName}</span>
                        <span className="flex items-center gap-1"><FaCalendarAlt className="text-gray-400" /> {b.date} {b.time}</span>
                        <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-gray-400" /> {typeof b.address === 'string' ? b.address.split(',')[0] : b.address?.street || 'N/A'}</span>
                        <span className="font-bold text-emerald-600">₹{b.total}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-center flex-shrink-0">
                      <button onClick={() => handleAcceptBooking(b.id)}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 transition">
                        <FaCheck /> Accept
                      </button>
                      <button onClick={() => handleRejectBooking(b.id)}
                        className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center gap-1 transition">
                        <FaTimes /> Decline
                      </button>
                    </div>
                  </div>
                ))}
                {pendingCustomRequests.map(r => (
                  <div key={r._id} className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-purple-100 text-purple-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Custom Request</span>
                        {r.budget && <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">Budget: ₹{r.budget}</span>}
                      </div>
                      <h3 className="font-bold text-gray-900">{r.serviceTitle || 'Custom Service'}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1">{r.description}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span>📍 {r.location?.address?.split(',')[0]}</span>
                        <span>📅 {r.date} {r.time}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-center flex-shrink-0">
                      <button onClick={() => handleCustomRequestAction(r._id, 'accept')}
                        className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-purple-700 flex items-center gap-1 transition">
                        <FaCheck /> Accept
                      </button>
                      <button onClick={() => handleCustomRequestAction(r._id, 'decline')}
                        className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center gap-1 transition">
                        <FaTimes /> Ignore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Upcoming / Active Bookings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FaClock className="text-primary-500" /> Upcoming Bookings ({upcomingBookings.length})
              </h2>
              <Link to="/provider/bookings" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingBookings.length > 0 ? upcomingBookings.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900 text-sm">{b.serviceName}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${statusColors[b.status] || 'bg-gray-100 text-gray-600'}`}>
                          {b.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1.5">
                          <FaPhone className="text-gray-300 flex-shrink-0" />
                          <span className="font-semibold text-gray-700">{b.customerName}</span>
                          {b.customerPhone && <span className="text-gray-400">{b.customerPhone}</span>}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FaCalendarAlt className="text-gray-300 flex-shrink-0" />
                          {b.date} at {b.time}
                        </span>
                        <span className="flex items-center gap-1.5 sm:col-span-2">
                          <FaMapMarkerAlt className="text-gray-300 flex-shrink-0" />
                          {typeof b.address === 'string' ? b.address : b.address?.formattedAddress || b.address?.street || 'Address not provided'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-black text-gray-900">₹{b.finalTotal || b.total}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{b.paymentMethod}</p>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center">
                  <span className="text-3xl">📋</span>
                  <p className="text-gray-400 text-sm mt-2">No upcoming bookings right now.</p>
                  {!isAvailable && (
                    <p className="text-xs text-amber-600 mt-1">Turn ON your availability to receive new requests.</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-5">
          {/* Location Status */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <FaMapMarkerAlt className="text-primary-500" /> My Base Location
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {user?.address?.city || user?.city || 'Not set'}
                  {user?.address?.pincode ? ` - ${user.address.pincode}` : ''}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Radius: <span className="font-bold text-primary-600">{user?.serviceRadius || 10} km</span></p>
              </div>
              <button onClick={() => setIsEditingLocation(!isEditingLocation)}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 px-2 py-1 rounded-lg hover:bg-primary-50 transition">
                {isEditingLocation ? 'Close' : 'Edit 📍'}
              </button>
            </div>
          </motion.div>

          {/* Recent Reviews */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <FaStar className="text-amber-400" /> Recent Reviews
              </h3>
              <Link to="/provider/reviews" className="text-xs font-semibold text-primary-600 hover:text-primary-700">View all</Link>
            </div>
            <div className="space-y-3">
              {recentReviews.length > 0 ? recentReviews.map((review, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-gray-800">{review.customerId?.name || 'Customer'}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} className={`text-xs ${s <= review.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{review.comment}</p>
                </div>
              )) : (
                <p className="text-xs text-gray-400 text-center py-4">No reviews yet. Complete jobs to earn reviews!</p>
              )}
            </div>
          </motion.div>

          {/* My Services Quick Panel */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <FaBriefcase className="text-primary-500" /> My Services ({myServices.length})
              </h3>
              <Link to="/provider/services" className="text-xs font-semibold text-primary-600 hover:text-primary-700">Manage</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {myServices.length > 0 ? myServices.map(service => (
                <div key={service._id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={service.image} alt={service.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{service.name}</p>
                      <p className="text-[11px] text-gray-400">₹{service.price}{service.pricingType === 'hourly' ? '/hr' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleToggleService(service._id, service.isActive)}
                      className={`text-xs font-bold px-2 py-1 rounded-lg transition ${service.isActive
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {service.isActive ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={() => handleDeleteService(service._id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition">
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-6 text-center">
                  <p className="text-xs text-gray-400">No services listed yet.</p>
                  <Link to="/provider/services" className="text-xs text-primary-600 font-semibold mt-1 inline-block">+ Add Service</Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Notifications Panel */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <FaBell className="text-amber-400" /> Notifications
                {unreadNotifCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadNotifCount}</span>
                )}
              </h3>
              <Link to="/provider/notifications" className="text-xs font-semibold text-primary-600 hover:text-primary-700">View all</Link>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar">
              {notifications.slice(0, 5).length > 0 ? notifications.slice(0, 5).map(n => (
                <div key={n._id} className={`p-2.5 rounded-xl text-xs ${!n.read ? 'bg-primary-50 border border-primary-100' : 'bg-gray-50'}`}>
                  <p className="font-bold text-gray-900">{n.title}</p>
                  <p className="text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                </div>
              )) : (
                <p className="text-xs text-gray-400 text-center py-3">No notifications.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
