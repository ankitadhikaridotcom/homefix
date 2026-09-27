import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaCalendarAlt, FaClock, FaRupeeSign, FaImage } from 'react-icons/fa';
import toast from 'react-hot-toast';


import LocationModal from '../../components/common/LocationModal';

const RequestCustomService = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    serviceTitle: '',
    description: '',
    date: '',
    time: '',
    budget: '',
    address: '',
    houseOrFlat: '',
    landmark: '',
    locality: '',
    city: '',
    state: '',
    pincode: '',
    latitude: 29.3803,
    longitude: 79.5126,
  });

  const handleLocationPicked = (loc) => {
    setFormData(prev => ({
      ...prev,
      address: loc.address,
      locality: loc.locality || prev.locality,
      city: loc.city || prev.city,
      state: loc.state || prev.state,
      pincode: loc.pincode || prev.pincode,
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.address || !formData.date || !formData.time) {
      return toast.error('Please fill all required fields');
    }
    
    const locationObj = {
      address: formData.address,
      houseOrFlat: formData.houseOrFlat,
      landmark: formData.landmark,
      locality: formData.locality,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      latitude: formData.latitude,
      longitude: formData.longitude,
      coordinates: [formData.longitude, formData.latitude] // GeoJSON Point [lng, lat]
    };

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/custom-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          serviceTitle: formData.serviceTitle,
          description: formData.description,
          photos: [],
          location: locationObj,
          date: formData.date,
          time: formData.time,
          budget: formData.budget ? Number(formData.budget) : null
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Request sent to nearby service providers!');
        navigate('/my-custom-requests');
      } else {
        toast.error(data.message || 'Failed to submit request');
      }
    } catch (err) {
      toast.error('Network error while submitting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 pb-24">
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={handleLocationPicked}
        initialLocation={{
          latitude: formData.latitude,
          longitude: formData.longitude,
          formattedAddress: formData.address
        }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900">Tell us what you need</h1>
          <p className="text-gray-500 mt-2">Describe your requirement and we will find the perfect professional for the job.</p>
        </motion.div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onSubmit={handleSubmit} className="mt-8 space-y-6"
        >
          {/* Service Details */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Service Details</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Title (Optional)</label>
              <input type="text" value={formData.serviceTitle} onChange={e => setFormData({...formData, serviceTitle: e.target.value})}
                placeholder="e.g., Water Tank Installation" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Description *</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required rows="4"
                placeholder="Example: I need someone to install a 500L water tank on my terrace. Pipes are already laid out."
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photos (Optional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition cursor-pointer">
                <FaImage className="mx-auto text-3xl text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to upload photos of the problem/work area</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Service Location</h2>
            
            <button type="button" onClick={() => setIsLocationModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3.5 rounded-xl font-bold hover:bg-blue-100 transition shadow-sm">
              <FaMapMarkerAlt /> 📍 Select / Pin Location on Map
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complete Address *</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required
                placeholder="e.g., 123 Main Street, Dwarahat" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House/Flat No.</label>
                <input type="text" value={formData.houseOrFlat} onChange={e => setFormData({...formData, houseOrFlat: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                <input type="text" value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          </div>

          {/* Schedule & Budget */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Schedule & Budget</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FaCalendarAlt /> Preferred Date *</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FaClock /> Preferred Time *</label>
                <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><FaRupeeSign /> Customer Budget (Optional)</label>
              <p className="text-xs text-gray-500 mb-2">What's your approximate budget for this work? Providers can still negotiate.</p>
              <input type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})}
                placeholder="₹" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary py-4 text-lg !rounded-xl shadow-lg">
            {loading ? 'Finding Nearby Providers...' : 'Find Nearby Providers'}
          </button>
        </motion.form>
      </div>
    </div>
  );
};

export default RequestCustomService;
