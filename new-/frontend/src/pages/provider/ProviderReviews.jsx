import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaReply, FaUser, FaTimes, FaPaperPlane } from 'react-icons/fa';
import toast from 'react-hot-toast';

const API = 'http://localhost:5000';

const StarDisplay = ({ rating, size = 'text-base' }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <span key={s} className={`${size} ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
    ))}
  </div>
);

const ProviderReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filterRating, setFilterRating] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/providers/me/reviews`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setReviews(data.reviews || []);
          setAvgRating(data.avgRating || 0);
        }
      } catch (e) { /* Reviews may not exist */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return toast.error('Please write a reply');
    // For now store locally (backend Reply endpoint can be added later)
    setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, providerReply: replyText } : r));
    toast.success('Reply sent!');
    setReplyingTo(null);
    setReplyText('');
  };

  const filtered = filterRating === 0 ? reviews : reviews.filter(r => r.rating === filterRating);
  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({ rating: r, count: reviews.filter(rv => rv.rating === r).length }));

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6 pb-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-3">
          <FaStar className="text-amber-400" /> Customer Reviews
        </h1>
        <p className="text-gray-500 text-sm mt-1">See what your customers say and reply to their reviews.</p>
      </motion.div>

      {reviews.length > 0 ? (
        <>
          {/* Rating Overview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="card p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Big Rating */}
              <div className="text-center flex-shrink-0">
                <p className="text-7xl font-black text-amber-500">{avgRating.toFixed(1)}</p>
                <StarDisplay rating={Math.round(avgRating)} size="text-xl" />
                <p className="text-sm text-gray-500 mt-1 font-medium">{reviews.length} reviews</p>
              </div>
              {/* Rating Bars */}
              <div className="flex-1 w-full space-y-2">
                {ratingCounts.map(({ rating, count }) => (
                  <button key={rating}
                    onClick={() => setFilterRating(filterRating === rating ? 0 : rating)}
                    className={`flex items-center gap-3 w-full hover:opacity-80 transition ${filterRating === rating ? 'opacity-100' : 'opacity-80'}`}>
                    <span className="text-xs font-bold text-gray-600 w-4 text-right">{rating}</span>
                    <span className="text-amber-400 text-xs">★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full transition-all"
                        style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }} />
                    </div>
                    <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
                  </button>
                ))}
              </div>
            </div>
            {filterRating > 0 && (
              <button onClick={() => setFilterRating(0)}
                className="mt-4 text-xs text-amber-700 font-semibold flex items-center gap-1 hover:underline">
                <FaTimes /> Clear filter (showing {filterRating}★ only)
              </button>
            )}
          </motion.div>

          {/* Reviews List */}
          <div className="space-y-4">
            {filtered.length > 0 ? filtered.map((review, i) => (
              <motion.div key={review._id || i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg flex-shrink-0">
                    {review.customerId?.profileImage
                      ? <img src={review.customerId.profileImage} alt="" className="w-full h-full rounded-full object-cover" />
                      : (review.customerId?.name?.charAt(0) || <FaUser />)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-bold text-gray-900">{review.customerId?.name || 'Anonymous Customer'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarDisplay rating={review.rating} size="text-sm" />
                          <span className="text-xs text-gray-400">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>

                    {/* Provider Reply */}
                    {review.providerReply && (
                      <div className="mt-3 ml-4 p-3 bg-primary-50 border-l-2 border-primary-300 rounded-r-xl">
                        <p className="text-xs font-bold text-primary-700 mb-1">Your Reply:</p>
                        <p className="text-xs text-primary-600">{review.providerReply}</p>
                      </div>
                    )}

                    {/* Reply Box */}
                    <AnimatePresence>
                      {replyingTo === (review._id || i) && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden">
                          <textarea
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Write a thoughtful reply to this review..."
                            rows={2} className="input-field text-sm resize-none w-full" autoFocus
                          />
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleReply(review._id || i)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 transition">
                              <FaPaperPlane /> Send Reply
                            </button>
                            <button onClick={() => { setReplyingTo(null); setReplyText(''); }}
                              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition">
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Reply Button */}
                    {replyingTo !== (review._id || i) && !review.providerReply && (
                      <button onClick={() => { setReplyingTo(review._id || i); setReplyText(''); }}
                        className="mt-2 flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-semibold transition">
                        <FaReply /> Reply to review
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="card p-8 text-center">
                <span className="text-3xl">🔍</span>
                <p className="text-gray-400 text-sm mt-2">No {filterRating}★ reviews found.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card p-16 text-center border border-dashed border-gray-200">
          <span className="text-6xl">⭐</span>
          <h3 className="text-xl font-bold text-gray-700 mt-4">No reviews yet</h3>
          <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">
            Complete your first jobs and provide excellent service — customers will leave reviews after their experience.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ProviderReviews;
