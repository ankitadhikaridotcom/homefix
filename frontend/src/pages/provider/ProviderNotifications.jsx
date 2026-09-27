import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBell, FaCalendarAlt, FaTimes, FaCheckDouble, FaMoneyBillWave, FaExclamationCircle, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const API = 'http://localhost:5000';

const notifTypeConfig = {
  NEW_BOOKING_REQUEST: { icon: '📅', color: 'bg-blue-100 text-blue-600', label: 'New Booking' },
  SUCCESS: { icon: '✅', color: 'bg-emerald-100 text-emerald-600', label: 'Success' },
  WARNING: { icon: '⚠️', color: 'bg-amber-100 text-amber-600', label: 'Alert' },
  INFO: { icon: 'ℹ️', color: 'bg-blue-50 text-blue-500', label: 'Info' },
  CUSTOM_REQUEST: { icon: '🔔', color: 'bg-purple-100 text-purple-600', label: 'Custom Request' },
  PAYMENT: { icon: '💰', color: 'bg-emerald-100 text-emerald-600', label: 'Payment' },
  DEFAULT: { icon: '🔔', color: 'bg-gray-100 text-gray-600', label: 'Notification' },
};

const ProviderNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/notifications`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) setNotifications(data.notifications || []);
      } catch (e) { toast.error('Failed to load notifications'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    try {
      await fetch(`${API}/api/notifications/${id}/read`, { method: 'PUT', credentials: 'include' });
    } catch (e) { /* ignore */ }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await fetch(`${API}/api/notifications/read-all`, { method: 'PUT', credentials: 'include' });
      toast.success('All notifications marked as read');
    } catch (e) { toast.error('Failed to mark all read'); }
    finally { setMarkingAll(false); }
  };

  const getConfig = (type) => notifTypeConfig[type] || notifTypeConfig.DEFAULT;

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'NEW_BOOKING_REQUEST', label: 'Bookings' },
    { key: 'CUSTOM_REQUEST', label: 'Custom Requests' },
    { key: 'SUCCESS', label: 'Updates' },
  ];

  const filtered = notifications.filter(n => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.read;
    return n.type === filterType;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-3">
            <FaBell className="text-amber-400" /> Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Stay updated on bookings, requests, and payments.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-xl text-sm font-bold hover:bg-primary-100 transition">
            <FaCheckDouble /> {markingAll ? 'Marking...' : 'Mark all read'}
          </button>
        )}
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setFilterType(tab.key)}
            className={`flex-shrink-0 py-2 px-4 rounded-lg text-xs font-semibold transition-all whitespace-nowrap
              ${filterType === tab.key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
            {tab.key === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((notif, i) => {
            const config = getConfig(notif.type);
            return (
              <motion.div key={notif._id || i}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => !notif.read && markAsRead(notif._id)}
                className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-sm ${!notif.read
                  ? 'bg-primary-50/50 border-primary-100 hover:bg-primary-50'
                  : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center text-lg flex-shrink-0`}>
                  {config.icon}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-900">{notif.title}</p>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
                      {notif.createdAt
                        ? new Date(notif.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </p>
                  </div>
                  {notif.link && (
                    <a href={notif.link} onClick={e => e.stopPropagation()}
                      className="text-[11px] text-primary-600 font-semibold hover:underline mt-1 inline-block">
                      View details →
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <span className="text-6xl">🔔</span>
          <h3 className="text-lg font-bold text-gray-600 mt-4">
            {filterType !== 'all' ? 'No notifications in this category' : 'All caught up!'}
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            {filterType !== 'all'
              ? 'Try viewing all notifications.'
              : 'New bookings, updates, and alerts will appear here.'}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ProviderNotifications;
