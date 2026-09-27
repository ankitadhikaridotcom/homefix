import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaSearch, FaStar, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
const categories = [
  { id: 'cleaning', name: 'Cleaning' },
  { id: 'plumbing', name: 'Plumbing' },
  { id: 'electrical', name: 'Electrical' },
  { id: 'painting', name: 'Painting' },
  { id: 'carpentry', name: 'Carpentry' },
  { id: 'appliances', name: 'Appliances' },
  { id: 'pest-control', name: 'Pest Control' },
  { id: 'handyman', name: 'Handyman' },
  { id: 'other', name: 'Other' }
];

const ManageServices = () => {
  const [serviceList, setServiceList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [editingService, setEditingService] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const filtered = serviceList.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = (data) => {
    if (editingService) {
      setServiceList(prev => prev.map(s => s.id === editingService.id ? { ...s, ...data, price: parseInt(data.price) } : s));
      toast.success('Service updated!');
    } else {
      const newService = {
        id: Date.now(),
        ...data,
        price: parseInt(data.price),
        rating: 0,
        reviewCount: 0,
        popular: false,
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
        includes: ['Standard service'],
        excludes: ['Additional parts cost'],
      };
      setServiceList(prev => [...prev, newService]);
      toast.success('Service added!');
    }
    reset();
    setShowForm(false);
    setEditingService(null);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    reset({
      name: service.name,
      category: service.category,
      description: service.description,
      price: service.price,
      priceType: service.priceType,
      estimatedTime: service.estimatedTime,
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setServiceList(prev => prev.filter(s => s.id !== id));
    toast.success('Service deleted');
  };

  const togglePopular = (id) => {
    setServiceList(prev => prev.map(s => s.id === id ? { ...s, popular: !s.popular } : s));
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manage Services</h1>
          <p className="text-gray-500 text-sm mt-1">{serviceList.length} services</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingService(null); reset(); }} className="btn-primary flex items-center gap-2 text-sm">
          {showForm ? <FaTimes /> : <FaPlus />} {showForm ? 'Cancel' : 'Add Service'}
        </button>
      </motion.div>

      {/* Add/Edit Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">{editingService ? 'Edit Service' : 'Add New Service'}</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Service Name</label>
                <input {...register('name', { required: 'Required' })} placeholder="e.g. Fan Installation" className="input-field" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Category</label>
                <select {...register('category', { required: 'Required' })} className="input-field">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Price (₹)</label>
                <input type="number" {...register('price', { required: 'Required' })} placeholder="299" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Price Type</label>
                <select {...register('priceType')} className="input-field">
                  <option value="fixed">Fixed</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Estimated Time</label>
                <input {...register('estimatedTime')} placeholder="1-2 hours" className="input-field" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
              <textarea {...register('description', { required: 'Required' })} placeholder="Service description..." rows={3} className="input-field resize-none" />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-ghost">Cancel</button>
              <button type="submit" className="btn-primary">{editingService ? 'Update Service' : 'Add Service'}</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services..." className="input-field pl-11 !py-2.5" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((service, i) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="card overflow-hidden group"
          >
            <div className="relative h-36 overflow-hidden">
              <img src={service.image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <span className="absolute top-3 left-3 badge-primary text-[10px]">{service.category}</span>
              {service.popular && <span className="absolute top-3 right-3 badge bg-secondary-500 text-white text-[10px]">Popular</span>}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 text-sm">{service.name}</h3>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-gray-900">₹{service.price}</span>
                <span className="flex items-center gap-1 text-sm"><FaStar className="text-secondary-500 text-xs" /> {service.rating}</span>
              </div>
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">
                <button onClick={() => handleEdit(service)} className="flex-1 py-1.5 rounded-lg text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-1">
                  <FaEdit className="text-[10px]" /> Edit
                </button>
                <button onClick={() => togglePopular(service.id)} className="flex-1 py-1.5 rounded-lg text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1">
                  {service.popular ? <FaToggleOn /> : <FaToggleOff />} {service.popular ? 'Featured' : 'Feature'}
                </button>
                <button onClick={() => handleDelete(service.id)} className="flex-1 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
                  <FaTrash className="text-[10px]" /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ManageServices;
