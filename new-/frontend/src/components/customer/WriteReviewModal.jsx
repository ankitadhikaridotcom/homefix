import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaStar } from 'react-icons/fa';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const WriteReviewModal = ({ isOpen, onClose, booking, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating.');
      return;
    }
    if (!reviewText.trim()) {
      toast.error('Please write a review.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bookingId: booking._id || booking.id,
          providerId: booking.providerId,
          rating,
          reviewText
        })
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('Review submitted successfully! 🎉');
        onSuccess(booking._id || booking.id);
        onClose();
        // Reset form
        setRating(0);
        setReviewText('');
      } else {
        throw new Error(data.message || 'Failed to submit review.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Write a Review</h2>
              <p className="text-sm text-gray-500 mt-1">For {booking.serviceName}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition"
            >
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="flex flex-col items-center">
              <p className="text-sm font-semibold text-gray-700 mb-3">How would you rate the service?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="text-3xl focus:outline-none transition-transform hover:scale-110"
                  >
                    <FaStar className={(hoverRating || rating) >= star ? 'text-amber-400' : 'text-gray-200'} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share your experience
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you like or dislike? How was the provider's behavior?"
                rows={4}
                className="input-field resize-none bg-gray-50 focus:bg-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Submit Review'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WriteReviewModal;
