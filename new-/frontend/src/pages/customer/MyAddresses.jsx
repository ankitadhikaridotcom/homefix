import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEdit, FaCheckCircle, FaMapMarkerAlt, FaHome, FaBriefcase, FaBookmark, FaSpinner, FaCrosshairs } from 'react-icons/fa';
import toast from 'react-hot-toast';
import LocationModal from '../../components/common/LocationModal';

export default function MyAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAddress, setEditAddress] = useState(null);

  // Form modal state for Add/Edit
  const [formData, setFormData] = useState({
    label: 'Home',
    customLabel: '',
    address: '',
    locality: '',
    city: '',
    state: '',
    pincode: '',
    latitude: 29.3803,
    longitude: 79.5126,
    isDefault: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/addresses', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load saved addresses.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditAddress(null);
    setFormData({
      label: 'Home',
      customLabel: '',
      address: '',
      locality: '',
      city: '',
      state: '',
      pincode: '',
      latitude: 29.3803,
      longitude: 79.5126,
      isDefault: addresses.length === 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (addr) => {
    setEditAddress(addr);
    setFormData({
      label: addr.label || 'Home',
      customLabel: addr.customLabel || '',
      address: addr.address || '',
      locality: addr.locality || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      latitude: addr.latitude || 29.3803,
      longitude: addr.longitude || 79.5126,
      isDefault: addr.isDefault || false,
    });
    setIsModalOpen(true);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Address deleted.');
        fetchAddresses();
      } else {
        toast.error(data.message || 'Failed to delete address.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete address.');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/addresses/${id}/default`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Default address updated.');
        fetchAddresses();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to set default address.');
    }
  };

  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleLocationPickedFromModal = (loc) => {
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

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!formData.address || !formData.latitude || !formData.longitude) {
      toast.error('Please select a valid address location.');
      return;
    }

    try {
      const url = editAddress
        ? `http://localhost:5000/api/addresses/${editAddress._id}`
        : 'http://localhost:5000/api/addresses';

      const method = editAddress ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editAddress ? 'Address updated!' : 'New address saved!');
        setIsModalOpen(false);
        fetchAddresses();
      } else {
        toast.error(data.message || 'Failed to save address.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while saving address.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <span>📍 My Saved Addresses</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your service locations for quick booking & discovery
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="btn-primary py-3 px-5 text-sm flex items-center justify-center space-x-2 shadow-lg shadow-primary-500/20"
        >
          <FaPlus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Address Cards Grid */}
      {loading ? (
        <div className="text-center py-16">
          <FaSpinner className="animate-spin w-8 h-8 text-primary-600 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Loading addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto text-2xl">
            <FaMapMarkerAlt />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Saved Addresses</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Save your home, work, or custom locations for fast location-based booking.
          </p>
          <button onClick={handleOpenAddModal} className="btn-primary py-2.5 px-6 text-sm">
            Add Address Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className={`bg-white rounded-3xl p-6 border transition-all duration-200 relative flex flex-col justify-between ${
                addr.isDefault
                  ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md'
                  : 'border-gray-100 hover:border-gray-200 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="p-2.5 bg-primary-50 text-primary-600 rounded-xl text-lg">
                      {addr.label === 'Home' ? <FaHome /> : addr.label === 'Work' ? <FaBriefcase /> : <FaBookmark />}
                    </span>
                    <span className="font-bold text-gray-900 text-base">
                      {addr.label === 'Other' && addr.customLabel ? addr.customLabel : addr.label}
                    </span>
                  </div>

                  {addr.isDefault ? (
                    <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-full flex items-center space-x-1">
                      <FaCheckCircle className="w-3 h-3" />
                      <span>Default</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(addr._id)}
                      className="text-xs font-semibold text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <p className="text-sm text-gray-700 font-medium line-clamp-2 mb-2">{addr.address}</p>
                <div className="text-xs text-gray-400 space-y-0.5">
                  {addr.locality && <p>Locality: {addr.locality}</p>}
                  {addr.city && <p>{addr.city}, {addr.state} {addr.pincode}</p>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleOpenEditModal(addr)}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                  title="Edit Address"
                >
                  <FaEdit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteAddress(addr._id)}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  title="Delete Address"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">{editAddress ? 'Edit Address' : 'Add New Address'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white p-1">✕</button>
            </div>

            <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
              {/* Label Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Address Label</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Home', 'Work', 'Other'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setFormData({ ...formData, label: lbl })}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        formData.label === lbl
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {lbl === 'Home' ? '🏠 Home' : lbl === 'Work' ? '🏢 Work' : '📍 Other'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Selector trigger button */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Location & Map</label>
                <LocationModal
                  isOpen={isPickerOpen}
                  onClose={() => setIsPickerOpen(false)}
                  onSelectLocation={handleLocationPickedFromModal}
                  initialLocation={{
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    formattedAddress: formData.address,
                  }}
                />

                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                  <p className="text-xs font-medium text-gray-800 line-clamp-2">
                    {formData.address || 'No location selected yet.'}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {[formData.locality, formData.city, formData.state, formData.pincode].filter(Boolean).join(', ')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(true)}
                    className="w-full mt-2 py-2 px-3 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold rounded-xl border border-primary-200 flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <FaCrosshairs className="w-3.5 h-3.5" />
                    <span>{formData.address ? 'Change Location on Map / GPS' : 'Select Location on Map / GPS'}</span>
                  </button>
                </div>
              </div>

              {/* Form Input details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="e.g. Haldwani"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="e.g. 263139"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultCheck"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <label htmlFor="isDefaultCheck" className="text-xs font-semibold text-gray-700">
                  Set as default address
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary py-2.5 px-6 text-xs shadow-md">
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
