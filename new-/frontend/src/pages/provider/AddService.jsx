import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlus, FaArrowLeft, FaInfoCircle, FaTag, FaSearch, FaClock } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const categories = ['Cleaning', 'Plumbing', 'Electrical', 'Painting', 'Carpentry', 'Appliances', 'Pest Control', 'Home Security', 'Handyman', 'Other'];

const pricingModels = [
  { id: 'fixed', label: 'Fixed Price', icon: <FaTag />, color: 'from-emerald-500 to-emerald-600',
    desc: 'Set a complete price. Customer pays the exact amount at booking.' },
  { id: 'inspection', label: 'Inspection / Quote', icon: <FaSearch />, color: 'from-amber-500 to-orange-500',
    desc: 'Charge a visit fee. Send a detailed quote after inspecting the problem.' },
  { id: 'hourly', label: 'Hourly Rate', icon: <FaClock />, color: 'from-blue-500 to-indigo-600',
    desc: 'Charge a visit fee plus hourly labour rate. Bill based on actual time spent.' },
];

const AddService = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: '', description: '', image: '',
    pricingType: 'fixed',
    fixedPrice: '', inspectionFee: '',
    visitFee: '', hourlyRate: '', billingIncrement: '60',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectPricingType = (type) => {
    setFormData({ ...formData, pricingType: type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate
    const pt = formData.pricingType;
    if (pt === 'fixed' && (!formData.fixedPrice || Number(formData.fixedPrice) <= 0)) {
      return toast.error('Please enter a valid fixed price.');
    }
    if (pt === 'inspection' && (!formData.inspectionFee || Number(formData.inspectionFee) <= 0)) {
      return toast.error('Please enter a valid inspection/visit fee.');
    }
    if (pt === 'hourly') {
      if (!formData.visitFee || Number(formData.visitFee) <= 0) return toast.error('Please enter a valid visit fee.');
      if (!formData.hourlyRate || Number(formData.hourlyRate) <= 0) return toast.error('Please enter a valid hourly rate.');
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Service added successfully!');
      navigate('/provider');
    } catch (err) {
      toast.error(err.message || 'Failed to add service');
    } finally {
      setLoading(false);
    }
  };

  const pt = formData.pricingType;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/provider')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <FaArrowLeft /> Back to Dashboard
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">Add New Service</h1>
            <p className="text-gray-500 mt-1">Fill in the details below to offer a new service to customers.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {/* Name & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange}
                  className="input-field" placeholder="e.g. AC Gas Refill" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select name="category" required value={formData.category} onChange={handleChange} className="input-field">
                  <option value="">Select a category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                <input type="url" name="image" value={formData.image} onChange={handleChange}
                  className="input-field" placeholder="https://images.unsplash.com/..." />
              </div>
            </div>

            {/* Pricing Model Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Pricing Model *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {pricingModels.map((model) => (
                  <button
                    key={model.id} type="button"
                    onClick={() => selectPricingType(model.id)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200
                      ${pt === model.id
                        ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${model.color} flex items-center justify-center text-white text-sm mb-3`}>
                      {model.icon}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">{model.label}</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{model.desc}</p>
                    {pt === model.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Price Fields */}
            <motion.div key={pt} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 rounded-xl p-5 border border-gray-100">

              {pt === 'fixed' && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    Fixed Price (₹) *
                    <span className="group relative">
                      <FaInfoCircle className="text-gray-400 text-xs cursor-help" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 bg-gray-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        The complete price the customer pays for this service. No additional charges.
                      </span>
                    </span>
                  </label>
                  <input type="number" name="fixedPrice" required min="1" value={formData.fixedPrice}
                    onChange={handleChange} className="input-field" placeholder="e.g. 499" />
                  {formData.fixedPrice > 0 && (
                    <p className="text-xs text-emerald-600 mt-2 font-medium">
                      ✓ Customer will see: <strong>₹{formData.fixedPrice} fixed</strong>
                    </p>
                  )}
                </div>
              )}

              {pt === 'inspection' && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    Visit / Inspection Fee (₹) *
                    <span className="group relative">
                      <FaInfoCircle className="text-gray-400 text-xs cursor-help" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-52 bg-gray-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        Customer pays this upfront. You'll send a detailed quote after inspecting the issue.
                      </span>
                    </span>
                  </label>
                  <input type="number" name="inspectionFee" required min="1" value={formData.inspectionFee}
                    onChange={handleChange} className="input-field" placeholder="e.g. 99" />
                  {formData.inspectionFee > 0 && (
                    <p className="text-xs text-amber-600 mt-2 font-medium">
                      ✓ Customer will see: <strong>Starting from ₹{formData.inspectionFee}</strong> · Final quote after inspection
                    </p>
                  )}
                </div>
              )}

              {pt === 'hourly' && (
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      Visit Fee (₹) *
                      <span className="group relative">
                        <FaInfoCircle className="text-gray-400 text-xs cursor-help" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 bg-gray-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          Initial visit/travel charge. Customer pays this at booking time.
                        </span>
                      </span>
                    </label>
                    <input type="number" name="visitFee" required min="1" value={formData.visitFee}
                      onChange={handleChange} className="input-field" placeholder="e.g. 199" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      Hourly Rate (₹/hr) *
                      <span className="group relative">
                        <FaInfoCircle className="text-gray-400 text-xs cursor-help" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 bg-gray-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          Per-hour labour rate. Final bill = Visit Fee + (Rate × Hours) + Materials.
                        </span>
                      </span>
                    </label>
                    <input type="number" name="hourlyRate" required min="1" value={formData.hourlyRate}
                      onChange={handleChange} className="input-field" placeholder="e.g. 150" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Billing Increment</label>
                    <select name="billingIncrement" value={formData.billingIncrement} onChange={handleChange} className="input-field">
                      <option value="60">1 hour increments</option>
                      <option value="30">30 minute increments</option>
                    </select>
                  </div>
                  {formData.visitFee > 0 && formData.hourlyRate > 0 && (
                    <p className="text-xs text-blue-600 font-medium">
                      ✓ Customer will see: <strong>₹{formData.visitFee} visit + ₹{formData.hourlyRate}/hr</strong>
                    </p>
                  )}
                </div>
              )}
            </motion.div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" rows="4" value={formData.description} onChange={handleChange}
                className="input-field resize-none" placeholder="Describe what is included in this service..." />
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? 'Adding...' : <><FaPlus /> Add Service</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddService;
