import { motion } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUser, FaCheck, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const BookingRequestCard = ({ booking, index = 0, onAccept, onReject }) => {
  const handleAccept = () => {
    onAccept?.(booking.id);
    toast.success(`Booking #${booking.id} accepted!`);
  };

  const handleReject = () => {
    onReject?.(booking.id);
    toast.error(`Booking #${booking.id} rejected`);
  };

  const categoryEmojis = {
    Electrician: '🔧',
    Plumber: '🚰',
    Cleaning: '🧹',
    Carpenter: '🪚',
    'AC Service': '❄️',
    Painter: '🎨',
    'Appliance Repair': '🔨',
    'Pest Control': '🐛',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-xl flex-shrink-0">
          {categoryEmojis[booking.category] || '📋'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900">{booking.serviceName}</h3>
            <span className="text-sm font-bold text-gray-900">₹{booking.total}</span>
          </div>

          <div className="space-y-1.5 mt-2 text-sm text-gray-500">
            <p className="flex items-center gap-2">
              <FaUser className="text-gray-400 text-xs" />
              {booking.customerName}
            </p>
            <p className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400 text-xs" />
              {booking.date} at {booking.time}
            </p>
            <p className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-gray-400 text-xs" />
              {booking.address.split(',').slice(0, 2).join(',')}
            </p>
          </div>

          {booking.description && (
            <p className="text-sm text-gray-400 mt-2 line-clamp-2 italic">"{booking.description}"</p>
          )}

          <div className="flex items-center gap-2 mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAccept}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm
                       font-semibold hover:bg-emerald-600 transition-colors"
            >
              <FaCheck className="text-xs" /> Accept
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReject}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg
                       text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              <FaTimes className="text-xs" /> Reject
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookingRequestCard;
