import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaBell, FaUser, FaBars, FaTimes, FaSignOutAlt, FaCalendarAlt, FaChevronDown, FaHome, FaClipboardList, FaCog, FaUserTie, FaChartBar } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (isAuthenticated) {
      const fetchNotifications = async () => {
        try {
          const res = await fetch('http://localhost:5000/api/notifications', { credentials: 'include' });
          const data = await res.json();
          if (data.success) {
            setNotifications(data.notifications || []);
          }
        } catch (e) {
          console.error('Failed to fetch notifications', e);
        }
      };
      fetchNotifications();
    }
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const markAsRead = async (id, link) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      setNotifications(prev => prev.map(n => n._id === id || n.id === id ? { ...n, read: true } : n));
      if (link) navigate(link);
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  const isAdminOrProvider = user?.role === 'admin' || user?.role === 'provider';

  // Only hide the public navbar when user is on their dashboard routes
  // (provider/admin have their own sidebar layout on /provider/* and /admin/*)
  // On public pages like /, /services, /login, etc. — always show the navbar
  const isOnDashboardRoute = location.pathname.startsWith('/provider') || location.pathname.startsWith('/admin');
  if (loading) return <div className="h-16 md:h-18" />;
  if (isAdminOrProvider && isAuthenticated && isOnDashboardRoute) return null;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <span className="text-2xl">🏠</span>
              <span className="text-xl font-bold text-gray-900">Home<span className="text-primary-600">Fix</span></span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6 ml-6">
              <Link to="/" className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`}>
                Home
              </Link>
              <Link to="/services" className={`text-sm font-medium transition-colors ${location.pathname === '/services' ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`}>
                Services
              </Link>
              <Link to="/help" className={`text-sm font-medium transition-colors ${location.pathname === '/help' ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`}>
                Help
              </Link>
            </div>

            {/* Search Bar — Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for services..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-100 border border-transparent
                           focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100
                           text-sm transition-all duration-200 outline-none"
                />
              </div>
            </form>

            {/* Right Section */}
            <div className="flex items-center gap-2 md:gap-3">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="hidden sm:inline-flex btn-ghost text-sm">
                    Login
                  </Link>
                  <Link to="/register" className="hidden sm:inline-flex btn-primary text-sm !py-2.5 !px-5">
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  {/* Notifications */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={async () => {
                        const opening = !notifOpen;
                        setNotifOpen(opening);
                        setProfileOpen(false);
                        if (opening && unreadCount > 0) {
                          try {
                            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                            await fetch('http://localhost:5000/api/notifications/read-all', {
                              method: 'PUT',
                              credentials: 'include'
                            });
                          } catch (e) {
                            console.error('Failed to mark all as read', e);
                          }
                        }
                      }}
                      className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <FaBell className="text-gray-600 text-lg" />
                      {unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold
                                   rounded-full flex items-center justify-center"
                        >
                          {unreadCount}
                        </motion.span>
                      )}
                    </button>

                    <AnimatePresence>
                      {notifOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                        >
                          <div className="p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            {notifications.map((n) => (
                              <div
                                key={n.id}
                                onClick={() => markAsRead(n.id)}
                                className={`flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors
                                          ${!n.read ? 'bg-primary-50/50' : ''}`}
                              >
                                <span className="text-xl flex-shrink-0">{n.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                    {n.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                                </div>
                                {!n.read && <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />}
                              </div>
                            ))}
                          </div>
                          <div className="p-3 border-t border-gray-100 text-center">
                            <button className="text-sm text-primary-600 font-medium hover:text-primary-700">
                              View all notifications
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Profile */}
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                      className="hidden sm:flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      {user?.profileImage || user?.avatar ? (
                        <img
                          src={user.profileImage || user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-100"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center ring-2 ring-primary-100 text-primary-600 text-sm font-bold">
                          {user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">{user.name?.split(' ')[0]}</span>
                      <FaChevronDown className={`text-gray-400 text-[10px] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                        >
                          <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                user.role === 'provider' 
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {user.role === 'provider' ? 'Provider' : 'Customer'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
                          </div>
                          <div className="py-2">
                            {user?.role === 'customer' && (
                              <>
                                <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                  <FaUser className="text-gray-400" /> My Profile
                                </Link>
                                <Link to="/my-bookings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                  <FaCalendarAlt className="text-gray-400" /> My Bookings
                                </Link>
                                <Link to="/my-custom-requests" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                  <span className="text-gray-400">✨</span> My Custom Requests
                                </Link>
                                <Link to="/register?role=provider" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                  <FaUserTie className="text-gray-400" /> Become a Provider
                                </Link>
                              </>
                            )}

                            {user?.role === 'provider' && (
                              <>
                                <Link to="/provider" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                  <FaChartBar className="text-gray-400" /> Dashboard
                                </Link>
                                <Link to="/provider/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                  <FaUser className="text-gray-400" /> My Profile
                                </Link>
                                <Link to="/provider/bookings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                  <FaCalendarAlt className="text-gray-400" /> Bookings
                                </Link>
                                <Link to="/provider/custom-requests" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                  <span className="text-gray-400">✨</span> Custom Requests
                                </Link>
                              </>
                            )}

                            {user?.role === 'admin' && (
                              <>
                                <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                  <FaChartBar className="text-gray-400" /> Dashboard
                                </Link>
                              </>
                            )}
                          </div>
                          <div className="border-t border-gray-100 py-2">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                            >
                              <FaSignOutAlt /> Logout
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* Mobile Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="sm:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                {mobileOpen ? <FaTimes className="text-gray-600 text-lg" /> : <FaBars className="text-gray-600 text-lg" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 sm:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white z-50 shadow-2xl sm:hidden"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">🏠 Home<span className="text-primary-600">Fix</span></span>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-gray-100">
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="p-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search services..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 text-sm outline-none
                             focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              </form>

              <div className="px-4 space-y-1">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 p-3 mb-3 bg-primary-50 rounded-xl">
                      {user?.profileImage ? (
                        <img src={user.profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                          {user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                    </div>
                    <Link to="/" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium">
                      <FaHome className="text-gray-400" /> Home
                    </Link>
                    <Link to="/services" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium">
                      <FaSearch className="text-gray-400" /> Services
                    </Link>
                    
                    {user?.role === 'customer' && (
                      <>
                        <Link to="/my-bookings" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium">
                          <FaCalendarAlt className="text-gray-400" /> My Bookings
                        </Link>
                        <Link to="/profile" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium">
                          <FaUser className="text-gray-400" /> Profile
                        </Link>
                      </>
                    )}

                    {user?.role === 'provider' && (
                      <>
                        <Link to="/provider" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium">
                          <FaChartBar className="text-gray-400" /> Dashboard
                        </Link>
                        <Link to="/provider/bookings" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium">
                          <FaCalendarAlt className="text-gray-400" /> Bookings
                        </Link>
                        <Link to="/provider/profile" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium">
                          <FaUser className="text-gray-400" /> Profile
                        </Link>
                      </>
                    )}

                    {user?.role === 'admin' && (
                      <>
                        <Link to="/admin" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium">
                          <FaChartBar className="text-gray-400" /> Dashboard
                        </Link>
                      </>
                    )}
                    <div className="pt-3 border-t border-gray-100 mt-3">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 text-sm font-medium w-full"
                      >
                        <FaSignOutAlt /> Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link to="/" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium">
                      <FaHome className="text-gray-400" /> Home
                    </Link>
                    <Link to="/services" className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium">
                      <FaSearch className="text-gray-400" /> All Services
                    </Link>
                    <div className="pt-4 space-y-2">
                      <Link to="/login" className="block w-full btn-primary text-center text-sm">Login</Link>
                      <Link to="/register" className="block w-full btn-outline text-center text-sm">Register</Link>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      {isAuthenticated && user?.role === 'customer' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 sm:hidden">
          <div className="flex items-center justify-around py-2">
            {[
              { to: '/', icon: FaHome, label: 'Home' },
              { to: '/services', icon: FaSearch, label: 'Search' },
              { to: '/my-bookings', icon: FaClipboardList, label: 'Bookings' },
              { to: '/profile', icon: FaUser, label: 'Profile' },
            ].map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors
                            ${isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <item.icon className="text-lg" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="h-16 md:h-18" />
    </>
  );
};

export default Navbar;
