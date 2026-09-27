import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaEye, FaCheck, FaTimes, FaBan, FaStar, FaPhone, FaEnvelope } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';

const ManageProviders = () => {
  const [providerList, setProviderList] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/providers`, { withCredentials: true });
      if (res.data.success) {
        setProviderList(res.data.providers);
      }
    } catch (err) {
      toast.error('Failed to load providers.');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = providerList.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesCat = categoryFilter === 'all' || (p.profession && p.profession.toLowerCase().includes(categoryFilter.toLowerCase()));
    return matchesSearch && matchesStatus && matchesCat;
  });

  const handleAction = async (id, action) => {
    const statusMap = { approve: 'approved', reject: 'rejected', suspend: 'suspended' };
    const newStatus = statusMap[action];
    try {
      const res = await axios.put(`${API_BASE}/api/admin/providers/${id}/status`, { status: newStatus }, { withCredentials: true });
      if (res.data.success) {
        setProviderList(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
        setSelectedProvider(null);
        toast.success(`Provider ${action}${action.endsWith('e') ? 'd' : 'ed'} successfully`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleDelete = (id) => {
    // Left empty: Optional to implement real delete later
    setProviderList(prev => prev.filter(p => p.id !== id));
    setSelectedProvider(null);
    toast.success('Provider deleted locally');
  };

  const statusColors = {
    pending: 'badge-warning',
    approved: 'badge-success',
    suspended: 'badge-danger',
    rejected: 'badge-danger',
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manage Providers</h1>
        <p className="text-gray-500 text-sm mt-1">{providerList.length} registered providers</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search providers..." className="input-field pl-11 !py-2.5" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field !w-auto !py-2.5 text-sm">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field !w-auto !py-2.5 text-sm">
          <option value="all">All Categories</option>
          <option value="Electrician">Electrician</option>
          <option value="Plumber">Plumber</option>
          <option value="Cleaning">Cleaning</option>
          <option value="AC Service">AC Service</option>
          <option value="Carpenter">Carpenter</option>
        </select>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Provider</th>
                <th className="px-6 py-3">Services</th>
                <th className="px-6 py-3">Experience</th>
                <th className="px-6 py-3">Rating</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                >
                  <td className="table-cell text-gray-400">{i + 1}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <img src={p.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell"><span className="badge-primary">{p.services.join(', ')}</span></td>
                  <td className="table-cell">{p.experience} yrs</td>
                  <td className="table-cell">
                    <span className="flex items-center gap-1"><FaStar className="text-secondary-500 text-xs" /> {p.rating}</span>
                  </td>
                  <td className="table-cell"><span className={`badge ${statusColors[p.status]}`}>{p.status}</span></td>
                  <td className="table-cell">
                    <button onClick={() => setSelectedProvider(p)} className="p-2 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors">
                      <FaEye className="text-sm" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Provider Detail Modal */}
      <AnimatePresence>
        {selectedProvider && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={() => setSelectedProvider(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                       bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Provider Details</h2>
                  <button onClick={() => setSelectedProvider(null)} className="p-2 rounded-lg hover:bg-gray-100"><FaTimes /></button>
                </div>

                {/* Profile */}
                <div className="flex items-center gap-4 mb-6">
                  <img src={selectedProvider.avatar} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedProvider.name}</h3>
                    <p className="text-sm text-gray-500">{selectedProvider.services.join(', ')}</p>
                    <span className={`badge mt-1 ${statusColors[selectedProvider.status]}`}>{selectedProvider.status}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600"><FaEnvelope className="text-gray-400" /> {selectedProvider.email}</div>
                  <div className="flex items-center gap-2 text-gray-600"><FaPhone className="text-gray-400" /> {selectedProvider.phone}</div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Experience</p><p className="font-semibold">{selectedProvider.experience} years</p></div>
                    <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Rate</p><p className="font-semibold">₹{selectedProvider.hourlyRate}/hr</p></div>
                    <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Rating</p><p className="font-semibold">⭐ {selectedProvider.rating} ({selectedProvider.reviewCount})</p></div>
                    <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Jobs Done</p><p className="font-semibold">{selectedProvider.completedJobs}</p></div>
                  </div>
                  <p className="text-gray-600 bg-gray-50 rounded-xl p-3 mt-3">{selectedProvider.bio}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-100">
                  {selectedProvider.status === 'pending' && (
                    <>
                      <button onClick={() => handleAction(selectedProvider.id, 'approve')} className="flex-1 btn-primary !py-2.5 flex items-center justify-center gap-2 text-sm"><FaCheck /> Approve</button>
                      <button onClick={() => handleAction(selectedProvider.id, 'reject')} className="flex-1 bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-100 flex items-center justify-center gap-2"><FaTimes /> Reject</button>
                    </>
                  )}
                  {selectedProvider.status === 'approved' && (
                    <button onClick={() => handleAction(selectedProvider.id, 'suspend')} className="flex-1 bg-amber-50 text-amber-600 border border-amber-200 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-100 flex items-center justify-center gap-2"><FaBan /> Suspend</button>
                  )}
                  {selectedProvider.status === 'suspended' && (
                    <button onClick={() => handleAction(selectedProvider.id, 'approve')} className="flex-1 btn-primary !py-2.5 flex items-center justify-center gap-2 text-sm"><FaCheck /> Reactivate</button>
                  )}
                  <button onClick={() => handleDelete(selectedProvider.id)} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-100 flex items-center justify-center gap-2">
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageProviders;
