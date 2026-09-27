import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff,
  FaSearch, FaFilter, FaTimes, FaSave, FaStar, FaBriefcase
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const API = 'http://localhost:5000';

const categories = ['Cleaning', 'Plumbing', 'Electrical', 'Painting', 'Carpentry', 'Appliances', 'Pest Control', 'Home Security', 'Handyman', 'Other'];

const categoryIcons = {
  Cleaning: '🧹', Plumbing: '🚿', Electrical: '⚡', Painting: '🎨',
  Carpentry: '🪚', Appliances: '🔧', 'Pest Control': '🐛',
  'Home Security': '🔐', Handyman: '🛠️', Other: '📦',
};

const pricingLabel = (service) => {
  if (service.pricingType === 'fixed') return `₹${service.fixedPrice} Fixed`;
  if (service.pricingType === 'inspection') return `From ₹${service.inspectionFee}`;
  if (service.pricingType === 'hourly') return `₹${service.visitFee} visit + ₹${service.hourlyRate}/hr`;
  return `₹${service.price}`;
};

const EditModal = ({ service, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: service.name,
    category: service.category,
    description: service.description || '',
    image: service.image || '',
    pricingType: service.pricingType || 'fixed',
    fixedPrice: service.fixedPrice || '',
    inspectionFee: service.inspectionFee || '',
    visitFee: service.visitFee || '',
    hourlyRate: service.hourlyRate || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.category) return toast.error('Name and category are required');
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/services/${service._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Service updated!');
        onSave(data.service);
        onClose();
      } else toast.error(data.message || 'Failed to update');
    } catch (e) {
      toast.error('Failed to update service');
    } finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Edit Service</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition"><FaTimes /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Service Name *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="input-field" placeholder="e.g. AC Gas Refill" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Pricing Type</label>
              <select value={form.pricingType} onChange={e => setForm({ ...form, pricingType: e.target.value })} className="input-field">
                <option value="fixed">Fixed Price</option>
                <option value="inspection">Inspection/Quote</option>
                <option value="hourly">Hourly Rate</option>
              </select>
            </div>
          </div>
          {form.pricingType === 'fixed' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fixed Price (₹)</label>
              <input type="number" value={form.fixedPrice} onChange={e => setForm({ ...form, fixedPrice: e.target.value })}
                className="input-field" placeholder="e.g. 499" />
            </div>
          )}
          {form.pricingType === 'inspection' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Inspection Fee (₹)</label>
              <input type="number" value={form.inspectionFee} onChange={e => setForm({ ...form, inspectionFee: e.target.value })}
                className="input-field" placeholder="e.g. 99" />
            </div>
          )}
          {form.pricingType === 'hourly' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Visit Fee (₹)</label>
                <input type="number" value={form.visitFee} onChange={e => setForm({ ...form, visitFee: e.target.value })}
                  className="input-field" placeholder="e.g. 199" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Hourly Rate (₹/hr)</label>
                <input type="number" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })}
                  className="input-field" placeholder="e.g. 150" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3} className="input-field resize-none" placeholder="What's included in this service..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
            <input type="url" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })}
              className="input-field" placeholder="https://..." />
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ProviderServices = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingService, setEditingService] = useState(null);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await fetch(`${API}/api/services/me`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) setServices(data.services || []);
      } catch (e) { toast.error('Failed to load services'); }
      finally { setLoading(false); }
    };
    loadServices();
  }, []);

  const handleToggle = async (service) => {
    const original = service.isActive;
    setServices(prev => prev.map(s => s._id === service._id ? { ...s, isActive: !original } : s));
    try {
      const res = await fetch(`${API}/api/services/${service._id}/toggle`, { method: 'PUT', credentials: 'include' });
      const data = await res.json();
      if (!data.success) {
        setServices(prev => prev.map(s => s._id === service._id ? { ...s, isActive: original } : s));
        toast.error('Failed to toggle service');
      } else {
        toast.success(data.isActive ? '🟢 Service is now Active' : '⭕ Service is now Inactive');
      }
    } catch (e) {
      setServices(prev => prev.map(s => s._id === service._id ? { ...s, isActive: original } : s));
    }
  };

  const handleDelete = async (service) => {
    if (!window.confirm(`Delete "${service.name}"? This cannot be undone.`)) return;
    setServices(prev => prev.filter(s => s._id !== service._id));
    try {
      const res = await fetch(`${API}/api/services/${service._id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || 'Failed to delete');
        // Re-add
        const res2 = await fetch(`${API}/api/services/me`, { credentials: 'include' });
        const d2 = await res2.json();
        if (d2.success) setServices(d2.services);
      } else toast.success('Service deleted');
    } catch (e) {
      toast.error('Failed to delete service');
    }
  };

  const handleEditSave = (updated) => {
    setServices(prev => prev.map(s => s._id === updated._id ? updated : s));
  };

  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = filterCategory === 'all' || s.category === filterCategory;
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? s.isActive : !s.isActive);
    return matchSearch && matchCategory && matchStatus;
  });

  const activeCount = services.filter(s => s.isActive).length;
  const inactiveCount = services.filter(s => !s.isActive).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <AnimatePresence>
        {editingService && (
          <EditModal
            service={editingService}
            onClose={() => setEditingService(null)}
            onSave={handleEditSave}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-3">
            <FaBriefcase className="text-primary-500" /> My Services
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your service listings — turn them ON/OFF, edit or delete.</p>
        </div>
        <Link to="/provider/add-service"
          className="btn-primary flex items-center gap-2 self-start sm:self-center">
          <FaPlus /> Add New Service
        </Link>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Services', value: services.length, color: 'text-gray-900', bg: 'bg-gray-50 border-gray-100' },
          { label: 'Active', value: activeCount, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Inactive', value: inactiveCount, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-100' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`${s.bg} border rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search services..." className="input-field pl-9 text-sm" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="input-field text-sm sm:w-44">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field text-sm sm:w-36">
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Services Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((service, i) => (
            <motion.div key={service._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow group ${!service.isActive ? 'opacity-70' : ''}`}>
              {/* Image */}
              <div className="relative h-40 overflow-hidden bg-gray-100">
                <img src={service.image} alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {/* Category Badge */}
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <span>{categoryIcons[service.category] || '📦'}</span> {service.category}
                </span>
                {/* Status Badge */}
                <span className={`absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm ${service.isActive
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-400 text-white'}`}>
                  {service.isActive ? '🟢 Active' : '⭕ Inactive'}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-base leading-tight">{service.name}</h3>
                {service.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-black text-primary-600">{pricingLabel(service)}</span>
                  {service.rating > 0 && (
                    <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                      <FaStar className="text-amber-400" /> {service.rating} ({service.reviewCount})
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 flex items-center gap-2">
                {/* ON/OFF Toggle */}
                <button onClick={() => handleToggle(service)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${service.isActive
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {service.isActive ? <><FaToggleOn className="text-base" /> Active</> : <><FaToggleOff className="text-base" /> Inactive</>}
                </button>
                {/* Edit */}
                <button onClick={() => setEditingService(service)}
                  className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition" title="Edit">
                  <FaEdit />
                </button>
                {/* Delete */}
                <button onClick={() => handleDelete(service)}
                  className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition" title="Delete">
                  <FaTrash />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <span className="text-6xl">🛠️</span>
          <h3 className="text-lg font-bold text-gray-700 mt-4">
            {searchQuery || filterCategory !== 'all' ? 'No services match your filters' : 'No services yet'}
          </h3>
          <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
            {searchQuery || filterCategory !== 'all'
              ? 'Try clearing your search or changing filters.'
              : 'Add your first service to start receiving bookings from customers.'}
          </p>
          {!searchQuery && filterCategory === 'all' && (
            <Link to="/provider/add-service" className="btn-primary mt-6 inline-flex items-center gap-2">
              <FaPlus /> Add Your First Service
            </Link>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ProviderServices;
