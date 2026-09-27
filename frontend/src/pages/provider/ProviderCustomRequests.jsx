import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMapMarkerAlt, FaCalendarAlt, FaClock, FaCheck, FaTimes, FaRupeeSign, FaFileInvoiceDollar } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { EmptyState, ListSkeleton } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

import LeafletMap from '../../components/common/LeafletMap';

const tabs = ['new', 'accepted'];

// Helper to calculate distance in km using Haversine formula
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

const ProviderCustomRequests = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('new');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quoteForm, setQuoteForm] = useState(null); // { id: requestId }
  const [quoteData, setQuoteData] = useState({ inspectionFee: '', labourFee: '', materialFee: '', additionalFee: '' });
  
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

  const handleAction = async (id, action) => {
    setRequests(prev => prev.filter(r => r._id !== id));
    try {
      const res = await fetch(`http://localhost:5000/api/custom-requests/${id}/${action}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === 'accept' ? 'Request accepted!' : 'Request ignored & deleted');
        fetchRequests();
      } else {
        toast.error(data.message);
        fetchRequests();
      }
    } catch (err) {
      toast.error(`Failed to ${action} request`);
      fetchRequests();
    }
  };

  const submitQuote = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/custom-requests/${id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(quoteData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Quote sent to customer successfully');
        setQuoteForm(null);
        setQuoteData({ inspectionFee: '', labourFee: '', materialFee: '', additionalFee: '' });
        fetchRequests();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to submit quote');
    }
  };

  // The backend already filters based on role and what the provider should see.
  // We just need to separate them into tabs on the frontend based on the provider's status for the request.
  const myId = user?.id || user?._id;

  const filtered = requests.filter(r => {
    const isAccepted = (r.acceptedProviders && r.acceptedProviders.some(p => (p._id || p)?.toString() === myId?.toString())) || 
                       (r.selectedProviderId && (r.selectedProviderId._id || r.selectedProviderId)?.toString() === myId?.toString());
    if (activeTab === 'new') return (r.status === 'PENDING' || r.status === 'pending') && !isAccepted;
    if (activeTab === 'accepted') return isAccepted;
    return false;
  });

  return (
    <div className="space-y-6 pb-20">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Custom Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Accept nearby custom requests and bid for jobs</p>
      </motion.div>

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

      <div className="space-y-4">
        {loading ? <ListSkeleton rows={3} /> : filtered.length > 0 ? (
          filtered.map((req, i) => {
            const isSelected = req.selectedProviderId && (req.selectedProviderId._id === myId || req.selectedProviderId === myId);

            // Calculate distance from provider base location
            const reqLat = req.location?.latitude || (req.location?.coordinates && req.location.coordinates[1]);
            const reqLng = req.location?.longitude || (req.location?.coordinates && req.location.coordinates[0]);
            const provLat = user?.address?.latitude;
            const provLng = user?.address?.longitude;

            const distanceKm = calculateHaversineDistance(provLat, provLng, reqLat, reqLng);

            return (
              <motion.div key={req._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`bg-white p-5 rounded-2xl border ${isSelected ? 'border-purple-200 shadow-md ring-1 ring-purple-100' : 'border-gray-100 shadow-sm'} transition`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      {req.serviceTitle || 'Custom Service'}
                      {isSelected && <span className="bg-purple-100 text-purple-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">Selected by Customer</span>}
                      {distanceKm && (
                        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-200">
                          📍 {distanceKm} km away
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">{req.description}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap bg-gray-100 text-gray-600`}>
                    {req.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 mt-4 pt-4 border-t border-gray-50">
                  <span className="flex items-center gap-1.5"><FaMapMarkerAlt className="text-gray-400" /> {req.location.address.split(',')[0]}</span>
                  <span className="flex items-center gap-1.5"><FaCalendarAlt className="text-gray-400" /> {req.date}</span>
                  <span className="flex items-center gap-1.5"><FaClock className="text-gray-400" /> {req.time}</span>
                  {req.budget && <span className="flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Budget: ₹{req.budget}</span>}
                  
                  <div className="ml-auto flex gap-2">
                    {activeTab === 'new' && (
                      <>
                        <button onClick={() => handleAction(req._id, 'accept')} className="bg-primary-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary-700 flex items-center gap-1"><FaCheck /> Accept</button>
                        <button onClick={() => handleAction(req._id, 'decline')} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-1"><FaTimes /> Ignore</button>
                      </>
                    )}
                    
                    {activeTab === 'accepted' && isSelected && req.status === 'PROVIDER_SELECTED' && (
                      <button onClick={() => setQuoteForm({ id: req._id })} className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-purple-700 flex items-center gap-1">
                        <FaFileInvoiceDollar /> Send Quote
                      </button>
                    )}

                    {activeTab === 'accepted' && !isSelected && req.status === 'PENDING' && (
                      <span className="text-sm font-medium text-amber-600 flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg">Waiting for Customer...</span>
                    )}

                    {req.status === 'QUOTE_SENT' && isSelected && (
                      <span className="text-sm font-medium text-purple-600 flex items-center gap-1 bg-purple-50 px-3 py-1.5 rounded-lg">Quote Sent - Waiting...</span>
                    )}
                  </div>
                </div>

                {/* Quote Form */}
                <AnimatePresence>
                  {quoteForm?.id === req._id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100 overflow-hidden">
                      <h4 className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2"><FaRupeeSign /> Prepare Final Quote</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Inspection / Visit Fee *</label>
                          <input type="number" value={quoteData.inspectionFee} onChange={e => setQuoteData({...quoteData, inspectionFee: e.target.value})} className="w-full text-sm p-2 rounded-lg border border-gray-200" placeholder="₹" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Labour Charge *</label>
                          <input type="number" value={quoteData.labourFee} onChange={e => setQuoteData({...quoteData, labourFee: e.target.value})} className="w-full text-sm p-2 rounded-lg border border-gray-200" placeholder="₹" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Parts/Materials</label>
                          <input type="number" value={quoteData.materialFee} onChange={e => setQuoteData({...quoteData, materialFee: e.target.value})} className="w-full text-sm p-2 rounded-lg border border-gray-200" placeholder="₹" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Additional Charges</label>
                          <input type="number" value={quoteData.additionalFee} onChange={e => setQuoteData({...quoteData, additionalFee: e.target.value})} className="w-full text-sm p-2 rounded-lg border border-gray-200" placeholder="₹" />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => submitQuote(req._id)} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition">Send Quote to Customer</button>
                        <button onClick={() => setQuoteForm(null)} className="px-4 bg-white text-gray-600 border border-gray-200 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            );
          })
        ) : (
          <EmptyState icon="📬" title="No requests found" description={`There are no ${activeTab} custom requests matching your settings.`} />
        )}
      </div>
    </div>
  );
};

export default ProviderCustomRequests;
