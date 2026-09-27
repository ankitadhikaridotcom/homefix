import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BookingCard from '../../components/customer/BookingCard';
import { ListSkeleton, EmptyState } from '../../components/common/LoadingSpinner';
import WriteReviewModal from '../../components/customer/WriteReviewModal';

const tabs = ['all', 'upcoming', 'ongoing', 'completed', 'cancelled'];

const MyBookings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);

  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/bookings', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setBookings(data.bookings || []);
        } else throw new Error();
      } catch (err) {
        console.error('Failed to load bookings:', err);
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, []);

  const filtered = activeTab === 'all'
    ? bookings
    : bookings.filter(b => {
        if (activeTab === 'upcoming') return b.status === 'upcoming' || b.status === 'confirmed' || b.status === 'pending';
        if (activeTab === 'ongoing') return b.status === 'ongoing' || b.status === 'quote_sent' || b.status === 'quote_approved';
        return b.status === activeTab;
      });

  const handleCancel = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'cancelled' })
      });
      const data = await res.json();
      if (!data.success) throw new Error();

      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled successfully');
    } catch (err) {
      toast.error('Failed to cancel booking');
    }
  };

  const handleReviewClick = (id) => {
    const booking = bookings.find(b => (b.id === id || b._id === id));
    if (booking) {
      setSelectedBookingForReview(booking);
      setIsReviewModalOpen(true);
    }
  };

  const handleReviewSuccess = (id) => {
    setBookings(prev => prev.map(b => (b.id === id || b._id === id) ? { ...b, isReviewed: true } : b));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage your service bookings</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const count = tab === 'all'
              ? bookings.length
              : bookings.filter(b => {
                  if (tab === 'upcoming') return b.status === 'upcoming' || b.status === 'confirmed' || b.status === 'pending';
                  if (tab === 'ongoing') return b.status === 'ongoing' || b.status === 'quote_sent' || b.status === 'quote_approved';
                  return b.status === tab;
                }).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap
                          ${activeTab === tab
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                          }`}
              >
                {tab} {count > 0 && <span className="text-xs opacity-60">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Booking List */}
        <div className="mt-6 space-y-4">
          {loading ? (
            <ListSkeleton rows={3} />
          ) : filtered.length > 0 ? (
            filtered.map((booking, i) => (
              <BookingCard
                key={booking.id || booking._id}
                booking={booking}
                index={i}
                onCancel={handleCancel}
                onReview={handleReviewClick}
              />
            ))
          ) : (
            <EmptyState
              icon="📋"
              title="No bookings here"
              description={`You don't have any ${activeTab === 'all' ? '' : activeTab + ' '}bookings yet.`}
              actionText="Browse Services"
              onAction={() => navigate('/services')}
            />
          )}
        </div>
      </div>
      <WriteReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        booking={selectedBookingForReview}
        onSuccess={handleReviewSuccess}
      />
    </div>
  );
};

export default MyBookings;
