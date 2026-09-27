import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMapMarkerAlt, FaCalendarAlt, FaClock, FaRupeeSign, FaCheck, FaTimes, FaUserCircle, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

const CustomRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      // In the real implementation, we should have a GET /api/custom-requests/:id endpoint
      // We didn't build it explicitly in server.js but we can fetch all and find it, or build it now.
      // Wait, we built GET /api/custom-requests which returns all. Let's filter for now.
      const res = await fetch('http://localhost:5000/api/custom-requests', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        const found = data.requests.find(r => r._id === id);
        if (found) setRequest(found);
        else toast.error('Request not found');
      }
    } catch (err) {
      toast.error('Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProvider = async (providerId) => {
    setProcessing(true);
    try {
      const res = await fetch(`http://localhost:5000/api/custom-requests/${id}/select-provider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ providerId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Provider selected! Waiting for their quote.');
        fetchDetail();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleQuoteResponse = async (action) => {
    setProcessing(true);
    try {
      const res = await fetch(`http://localhost:5000/api/custom-requests/${id}/quote-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, paymentMethod: 'card' }) // Mock payment
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'accept') {
          toast.success('Quote accepted and payment successful!');
          navigate('/my-bookings'); // Or anywhere else
        } else {
          toast.success('Quote rejected.');
          fetchDetail();
        }
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (!request) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Request not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Request Details</h1>
          <span className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            {request.status.replace('_', ' ')}
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-50">
            <h2 className="text-xl font-bold text-gray-900">{request.serviceTitle || 'Custom Service'}</h2>
            <p className="text-gray-600 mt-3 whitespace-pre-wrap text-sm">{request.description}</p>
          </div>
          <div className="p-6 bg-gray-50 grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500 block mb-1">Date & Time</span><span className="font-semibold text-gray-900">{request.date} at {request.time}</span></div>
            <div><span className="text-gray-500 block mb-1">Location</span><span className="font-semibold text-gray-900">{request.location.address}</span></div>
            {request.budget && <div><span className="text-gray-500 block mb-1">Budget</span><span className="font-semibold text-gray-900">₹{request.budget}</span></div>}
          </div>
        </div>

        {/* Phase 1: PENDING - Show accepted providers */}
        {request.status === 'PENDING' && request.acceptedProviders && request.acceptedProviders.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Providers available for your request</h3>
            {request.acceptedProviders.map(provider => (
              <motion.div key={provider._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {provider.profileImage ? (
                    <img src={provider.profileImage} alt={provider.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <FaUserCircle className="w-12 h-12 text-gray-300" />
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-1">{provider.name} <FaShieldAlt className="text-primary-500 text-xs" /></h4>
                    <p className="text-xs text-gray-500 mt-0.5">Verified Professional</p>
                  </div>
                </div>
                <button onClick={() => handleSelectProvider(provider._id)} disabled={processing}
                  className="w-full sm:w-auto btn-primary !py-2 !px-6 text-sm">
                  Select Provider
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {request.status === 'PENDING' && (!request.acceptedProviders || request.acceptedProviders.length === 0) && (
          <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 border-dashed">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3 text-xl">🔍</div>
            <h3 className="font-semibold text-gray-900">Searching for providers...</h3>
            <p className="text-sm text-gray-500 mt-1">We've notified nearby professionals. We'll alert you when someone accepts.</p>
          </div>
        )}

        {/* Phase 2: PROVIDER_SELECTED - Waiting for quote */}
        {request.status === 'PROVIDER_SELECTED' && request.selectedProviderId && (
          <div className="text-center p-8 bg-white rounded-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3 text-xl">⏳</div>
            <h3 className="font-semibold text-gray-900">Waiting for Quote</h3>
            <p className="text-sm text-gray-500 mt-1">You selected <b>{request.selectedProviderId.name}</b>. They are currently preparing a quote for your service.</p>
          </div>
        )}

        {/* Phase 3: QUOTE_SENT - Accept/Reject */}
        {request.status === 'QUOTE_SENT' && request.quoteId && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
            <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2 mb-4">
              <FaRupeeSign className="text-purple-600" /> Provider sent you a quote
            </h3>
            
            <div className="bg-white rounded-xl p-4 space-y-3 text-sm text-gray-700 shadow-sm mb-6">
              <div className="flex justify-between"><span>Inspection / Visit Fee</span><span className="font-medium">₹{request.quoteId.inspectionFee || 0}</span></div>
              <div className="flex justify-between"><span>Labour Charges</span><span className="font-medium">₹{request.quoteId.labourFee || 0}</span></div>
              {request.quoteId.materialFee > 0 && <div className="flex justify-between"><span>Materials</span><span className="font-medium">₹{request.quoteId.materialFee}</span></div>}
              {request.quoteId.additionalFee > 0 && <div className="flex justify-between"><span>Additional Charges</span><span className="font-medium">₹{request.quoteId.additionalFee}</span></div>}
              
              <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-center text-lg font-bold text-gray-900">
                <span>Total Amount</span>
                <span>₹{request.quoteId.totalAmount}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => handleQuoteResponse('accept')} disabled={processing} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
                <FaCheck /> Accept & Pay ₹{request.quoteId.totalAmount + Math.round(request.quoteId.totalAmount * 0.03)}
              </button>
              <button onClick={() => handleQuoteResponse('reject')} disabled={processing} className="flex-1 bg-white hover:bg-gray-50 text-red-600 border border-red-200 font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
                <FaTimes /> Reject Quote
              </button>
            </div>
            <p className="text-center text-xs text-purple-600/70 mt-3">Accepting will process the payment and confirm the booking immediately.</p>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default CustomRequestDetail;
