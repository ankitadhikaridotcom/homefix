import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaCheck, FaTimes, FaPlay, FaCheckDouble, FaFileInvoiceDollar } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { EmptyState } from '../../components/common/LoadingSpinner';

const tabs = ['all', 'pending', 'upcoming', 'ongoing', 'completed', 'cancelled'];

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  upcoming: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  ongoing: 'bg-purple-100 text-purple-700',
  quote_sent: 'bg-purple-100 text-purple-700',
  quote_approved: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const ProviderBookings = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [bookingList, setBookingList] = useState([]);
  
  // States for forms
  const [quoteForm, setQuoteForm] = useState(null); // { id: bookingId }
  const [hourlyForm, setHourlyForm] = useState(null); // { id: bookingId }
  
  const [quoteData, setQuoteData] = useState({ labourCharge: '', partsCharge: '', additionalCharge: '', description: '' });
  const [hourlyData, setHourlyData] = useState({ actualHours: '', materialCharge: '' });

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/bookings', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setBookingList(data.bookings);
        }
      } catch (e) {
        toast.error('Failed to load bookings from server');
      }
    };
    loadBookings();
  }, []);

  const filtered = activeTab === 'all'
    ? bookingList
    : bookingList.filter(b => {
        if (activeTab === 'pending') return b.status === 'pending';
        if (activeTab === 'upcoming') return b.status === 'upcoming' || b.status === 'confirmed';
        if (activeTab === 'ongoing') return b.status === 'ongoing' || b.status === 'quote_sent' || b.status === 'quote_approved';
        return b.status === activeTab;
      });

  const handleStatusUpdate = async (id, newStatus) => {
    setBookingList(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(newStatus === 'confirmed' ? 'Booking accepted!' : newStatus === 'cancelled' ? 'Booking declined' : `Booking status updated to ${newStatus}`);
      } else throw new Error();
    } catch (e) {
      toast.error('Failed to update booking status');
    }
  };

  const submitQuote = async (id) => {
    if (!quoteData.labourCharge) return toast.error('Labour charge is required');
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(quoteData)
      });
      const data = await res.json();
      if (data.success) {
        setBookingList(prev => prev.map(b => b.id === id ? { ...b, status: 'quote_sent', quote: data.booking.quote } : b));
        setQuoteForm(null);
        setQuoteData({ labourCharge: '', partsCharge: '', additionalCharge: '', description: '' });
        toast.success('Quote sent to customer successfully');
      } else throw new Error(data.message);
    } catch (err) {
      toast.error(err.message || 'Failed to submit quote');
    }
  };

  const submitHourly = async (id) => {
    if (!hourlyData.actualHours) return toast.error('Actual hours is required');
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${id}/complete-hourly`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(hourlyData)
      });
      const data = await res.json();
      if (data.success) {
        setBookingList(prev => prev.map(b => b.id === id ? { ...b, status: 'completed', finalTotal: data.booking.finalTotal, actualHours: data.booking.actualHours } : b));
        setHourlyForm(null);
        setHourlyData({ actualHours: '', materialCharge: '' });
        toast.success('Service completed & billed successfully');
      } else throw new Error(data.message);
    } catch (err) {
      toast.error(err.message || 'Failed to complete service');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage and track your service jobs</p>
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
        {filtered.length > 0 ? (
          filtered.map((booking, i) => (
            <motion.div key={booking.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-xl flex-shrink-0">🔧</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        {booking.serviceName}
                        {booking.pricingType === 'inspection' && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">Inspection</span>}
                        {booking.pricingType === 'hourly' && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Hourly</span>}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">Customer: {booking.customerName}</p>
                    </div>
                    <span className={`badge ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><FaCalendarAlt className="text-gray-400 text-xs" />{booking.date}</span>
                    <span className="flex items-center gap-1.5"><FaClock className="text-gray-400 text-xs" />{booking.time}</span>
                    <span className="flex items-center gap-1.5"><FaMapMarkerAlt className="text-gray-400 text-xs" />{typeof booking.address === 'string' ? booking.address.split(',')[0] : booking.address?.street}</span>
                  </div>

                  {/* Quote Form for Inspection pricing */}
                  <AnimatePresence>
                    {quoteForm?.id === booking.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100 overflow-hidden">
                        <div className="flex items-center gap-2 text-purple-800 font-semibold mb-3">
                          <FaFileInvoiceDollar /> Create Final Quote
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Labour Charge *</label>
                            <input type="number" value={quoteData.labourCharge} onChange={e => setQuoteData({...quoteData, labourCharge: e.target.value})} className="w-full text-sm p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="₹" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Parts/Materials</label>
                            <input type="number" value={quoteData.partsCharge} onChange={e => setQuoteData({...quoteData, partsCharge: e.target.value})} className="w-full text-sm p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="₹" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Description / Notes</label>
                            <textarea value={quoteData.description} onChange={e => setQuoteData({...quoteData, description: e.target.value})} className="w-full text-sm p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none" rows="2" placeholder="Details of repair..." />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => submitQuote(booking.id)} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition">Send Quote to Customer</button>
                          <button onClick={() => setQuoteForm(null)} className="px-4 bg-white text-gray-600 border border-gray-200 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
                        </div>
                      </motion.div>
                    )}

                    {/* Hourly Completion Form */}
                    {hourlyForm?.id === booking.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 overflow-hidden">
                        <div className="flex items-center gap-2 text-blue-800 font-semibold mb-3">
                          <FaCheckDouble /> Complete Service & Bill
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Actual Hours Worked *</label>
                            <input type="number" step="0.5" value={hourlyData.actualHours} onChange={e => setHourlyData({...hourlyData, actualHours: e.target.value})} className="w-full text-sm p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. 2.5" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Extra Material Charge</label>
                            <input type="number" value={hourlyData.materialCharge} onChange={e => setHourlyData({...hourlyData, materialCharge: e.target.value})} className="w-full text-sm p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="₹" />
                          </div>
                        </div>
                        <p className="text-xs text-blue-600 mb-3">Labour rate is ₹{booking.hourlyRate}/hr.</p>
                        <div className="flex gap-2">
                          <button onClick={() => submitHourly(booking.id)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">Complete Job</button>
                          <button onClick={() => setHourlyForm(null)} className="px-4 bg-white text-gray-600 border border-gray-200 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-gray-900">₹{booking.finalTotal || booking.initialPayment || booking.total}</span>
                      {(booking.pricingType === 'inspection' || booking.pricingType === 'hourly') && booking.status !== 'completed' && booking.status !== 'quote_approved' && (
                        <span className="text-[10px] text-gray-400 font-medium -mt-1 tracking-wide uppercase">Paid (Visit Fee)</span>
                      )}
                      {(booking.pricingType === 'inspection' || booking.pricingType === 'hourly') && (booking.status === 'completed' || booking.status === 'quote_approved') && (
                        <span className="text-[10px] text-emerald-600 font-medium -mt-1 tracking-wide uppercase">Final Total</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 ml-2">•</span>
                    <span className="text-sm text-gray-500 ml-2">{booking.paymentMethod}</span>

                    <div className="flex flex-wrap gap-2 ml-auto">
                      {(booking.status === 'pending' || booking.status === 'upcoming') && (
                        <>
                          <button onClick={() => handleStatusUpdate(booking.id, 'confirmed')} className="text-sm font-semibold text-white px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors flex items-center gap-1"><FaCheck className="text-xs" /> Accept</button>
                          <button onClick={() => handleStatusUpdate(booking.id, 'cancelled')} className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"><FaTimes className="text-xs" /> Reject</button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <button onClick={() => handleStatusUpdate(booking.id, 'ongoing')} className="text-sm font-semibold text-white px-3 py-1.5 bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors flex items-center gap-1"><FaPlay className="text-xs" /> Start Job</button>
                      )}
                      
                      {/* Ongoing Actions */}
                      {booking.status === 'ongoing' && (
                        <>
                          {booking.pricingType === 'inspection' && !quoteForm && (
                            <button onClick={() => setQuoteForm({ id: booking.id })} className="text-sm font-semibold text-white px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-1"><FaFileInvoiceDollar className="text-xs" /> Send Quote</button>
                          )}
                          {booking.pricingType === 'hourly' && !hourlyForm && (
                            <button onClick={() => setHourlyForm({ id: booking.id })} className="text-sm font-semibold text-white px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"><FaCheckDouble className="text-xs" /> Complete Job</button>
                          )}
                          {booking.pricingType === 'fixed' && (
                            <button onClick={() => handleStatusUpdate(booking.id, 'completed')} className="text-sm font-semibold text-white px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors flex items-center gap-1"><FaCheckDouble className="text-xs" /> Complete Job</button>
                          )}
                        </>
                      )}
                      
                      {booking.status === 'quote_approved' && (
                        <button onClick={() => handleStatusUpdate(booking.id, 'completed')} className="text-sm font-semibold text-white px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors flex items-center gap-1"><FaCheckDouble className="text-xs" /> Complete Job</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <EmptyState icon="📋" title="No bookings" description="No bookings match the selected filter." />
        )}
      </div>
    </div>
  );
};

export default ProviderBookings;
