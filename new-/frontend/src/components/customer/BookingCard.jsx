import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaFileInvoiceDollar, FaCheck, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  upcoming: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  ongoing: 'bg-amber-100 text-amber-700',
  quote_sent: 'bg-purple-100 text-purple-700 border border-purple-200',
  quote_approved: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels = {
  pending: 'Pending',
  upcoming: 'Upcoming',
  confirmed: 'Confirmed',
  ongoing: 'On-Going',
  quote_sent: 'Quote Received',
  quote_approved: 'Quote Approved',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const BookingCard = ({ booking, index = 0, onCancel, onReview, onQuoteResponse }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const addressText = typeof booking.address === 'string'
    ? booking.address.split(',')[0]
    : booking.address?.street || 'Address not provided';

  const handleQuoteResponse = async (action) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${booking.id || booking._id}/quote-response`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      toast.success(action === 'approve' ? 'Quote approved successfully!' : 'Quote rejected and booking cancelled.');
      if (onQuoteResponse) onQuoteResponse(data.booking);
    } catch (err) {
      toast.error(err.message || `Failed to ${action} quote`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Service Image or icon */}
        {booking.serviceImage ? (
          <img src={booking.serviceImage} alt={booking.serviceName}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 ring-2 ring-gray-100" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center text-xl flex-shrink-0">🔧</div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {booking.serviceName}
                {booking.pricingType === 'inspection' && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">Inspection</span>}
                {booking.pricingType === 'hourly' && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Hourly</span>}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">by {booking.providerName}</p>
            </div>
            <span className={`badge ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
              {statusLabels[booking.status] || booking.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><FaCalendarAlt className="text-gray-400 text-xs" />{booking.date}</span>
            <span className="flex items-center gap-1.5"><FaClock className="text-gray-400 text-xs" />{booking.time}</span>
            <span className="flex items-center gap-1.5"><FaMapMarkerAlt className="text-gray-400 text-xs" />{addressText}</span>
          </div>

          {/* Quote Section for Customers */}
          <AnimatePresence>
            {booking.status === 'quote_sent' && booking.quote && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100 overflow-hidden">
                <div className="flex items-center gap-2 text-purple-800 font-semibold mb-3">
                  <FaFileInvoiceDollar /> Provider sent a quote for repair
                </div>
                <div className="space-y-1.5 text-sm text-gray-700 mb-4 bg-white p-3 rounded-lg">
                  <div className="flex justify-between"><span>Labour Charge</span><span>₹{booking.quote.labourCharge}</span></div>
                  {booking.quote.partsCharge > 0 && <div className="flex justify-between"><span>Parts/Materials</span><span>₹{booking.quote.partsCharge}</span></div>}
                  {booking.quote.additionalCharge > 0 && <div className="flex justify-between"><span>Additional Charges</span><span>₹{booking.quote.additionalCharge}</span></div>}
                  {booking.quote.description && <p className="text-xs text-gray-500 italic mt-1 pb-1">"{booking.quote.description}"</p>}
                  <div className="flex justify-between border-t border-gray-100 pt-1.5 font-bold">
                    <span>Quote Total</span><span>₹{booking.quote.total}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleQuoteResponse('approve')} disabled={isProcessing}
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2">
                    <FaCheck /> Approve & Continue
                  </button>
                  <button onClick={() => handleQuoteResponse('reject')} disabled={isProcessing}
                    className="flex-1 bg-white text-red-600 border border-red-200 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2">
                    <FaTimes /> Reject (Cancel)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-50">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">
                ₹{booking.finalTotal || booking.initialPayment || booking.total}
              </span>
              {(booking.pricingType === 'inspection' || booking.pricingType === 'hourly') && booking.status !== 'completed' && booking.status !== 'quote_approved' && (
                <span className="text-[10px] text-gray-400 font-medium -mt-1 tracking-wide uppercase">Paid (Visit Fee)</span>
              )}
              {(booking.pricingType === 'inspection' || booking.pricingType === 'hourly') && (booking.status === 'completed' || booking.status === 'quote_approved') && (
                <span className="text-[10px] text-emerald-600 font-medium -mt-1 tracking-wide uppercase">Final Total</span>
              )}
            </div>
            
            <span className="text-xs text-gray-400 ml-2">•</span>
            <span className="text-sm text-gray-500 ml-2">{booking.paymentMethod}</span>

            <div className="flex gap-2 ml-auto">
              {(booking.status === 'pending' || booking.status === 'upcoming' || booking.status === 'confirmed') && onCancel && (
                <button onClick={() => onCancel(booking.id || booking._id)}
                  className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  Cancel
                </button>
              )}
              {booking.status === 'completed' && booking.isReviewed && (
                <span className="text-sm font-medium text-emerald-600 px-3 py-1.5 flex items-center gap-1">
                  <FaCheck /> Reviewed
                </span>
              )}
              {booking.status === 'completed' && !booking.isReviewed && onReview && (
                <button onClick={() => onReview(booking.id || booking._id)}
                  className="text-sm font-medium text-secondary-600 hover:text-secondary-700 px-3 py-1.5 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
                  Write Review
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookingCard;
