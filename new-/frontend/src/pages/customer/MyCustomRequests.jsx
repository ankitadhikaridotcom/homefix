import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaCalendarAlt, FaClock, FaChevronRight } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { EmptyState, ListSkeleton } from '../../components/common/LoadingSpinner';

const tabs = ['active', 'completed', 'cancelled', 'expired'];

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROVIDER_SELECTED: 'bg-blue-100 text-blue-800',
  QUOTE_SENT: 'bg-purple-100 text-purple-800',
  QUOTE_ACCEPTED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  PENDING: 'Waiting for providers',
  PROVIDER_SELECTED: 'Provider Selected',
  QUOTE_SENT: 'Quote Received',
  QUOTE_ACCEPTED: 'Booked',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired'
};

const MyCustomRequests = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/custom-requests', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (err) {
      toast.error('Failed to load custom requests');
    } finally {
      setLoading(false);
    }
  };

  const filtered = requests.filter(r => {
    if (activeTab === 'active') return ['PENDING', 'PROVIDER_SELECTED', 'QUOTE_SENT', 'QUOTE_ACCEPTED'].includes(r.status);
    if (activeTab === 'completed') return r.status === 'COMPLETED'; // Custom req doesn't have COMPLETED natively, the booking does, but we'll map QUOTE_ACCEPTED to active until we sync.
    return r.status === activeTab.toUpperCase();
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Custom Requests</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your customized service requests</p>
          </motion.div>
          <Link to="/request-custom-service" className="btn-primary text-sm whitespace-nowrap">
            + New Request
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap
                        ${activeTab === tab ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="mt-6 space-y-4">
          {loading ? <ListSkeleton rows={3} /> : filtered.length > 0 ? (
            filtered.map((req, i) => (
              <motion.div key={req._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/custom-requests/${req._id}`)}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{req.serviceTitle || 'Custom Service'}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{req.description}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${statusColors[req.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[req.status] || req.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 mt-4 pt-4 border-t border-gray-50">
                  <span className="flex items-center gap-1.5"><FaMapMarkerAlt className="text-gray-400" /> {req.location.address.split(',')[0]}</span>
                  <span className="flex items-center gap-1.5"><FaCalendarAlt className="text-gray-400" /> {req.date}</span>
                  <span className="flex items-center gap-1.5"><FaClock className="text-gray-400" /> {req.time}</span>
                  
                  <div className="ml-auto flex items-center text-primary-600 font-semibold group-hover:translate-x-1 transition-transform">
                    View Details <FaChevronRight className="ml-1 text-[10px]" />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <EmptyState icon="📝" title="No requests found" description={`You don't have any ${activeTab} custom requests.`} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MyCustomRequests;
