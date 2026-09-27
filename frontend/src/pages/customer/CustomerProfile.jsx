import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCamera, FaEdit, FaSave } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CustomerProfile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
    },
  });

  const onSubmit = (data) => {
    updateUser(data);
    setEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancel = () => {
    reset();
    setEditing(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const uploadRes = await fetch(`${API}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      
      if (!uploadData.success) throw new Error(uploadData.message || 'Failed to upload image');

      await updateUser({ profileImage: uploadData.photoUrl });
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account settings</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6 mt-6">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group">
              <img
                src={user?.profileImage || user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face'}
                alt={user?.name}
                className={`w-24 h-24 rounded-2xl object-cover ring-4 ring-primary-100 ${uploadingImage ? 'opacity-50' : ''}`}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100
                             transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed">
                <FaCamera className="text-white text-lg" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
              />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className="badge-primary mt-2 capitalize">{user?.role}</span>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="sm:ml-auto btn-ghost flex items-center gap-2"
            >
              <FaEdit className="text-sm" /> {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6 mt-4">
          <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input {...register('name')} disabled={!editing} className="input-field pl-11 disabled:bg-gray-50 disabled:text-gray-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input {...register('email')} disabled={!editing} className="input-field pl-11 disabled:bg-gray-50 disabled:text-gray-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone</label>
                <div className="relative">
                  <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input {...register('phone')} disabled={!editing} className="input-field pl-11 disabled:bg-gray-50 disabled:text-gray-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">City</label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input {...register('city')} disabled={!editing} className="input-field pl-11 disabled:bg-gray-50 disabled:text-gray-500" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Address</label>
              <textarea {...register('address')} disabled={!editing} rows={2} className="input-field disabled:bg-gray-50 disabled:text-gray-500 resize-none" />
            </div>

            {editing && (
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={handleCancel} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <FaSave className="text-sm" /> Save Changes
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerProfile;
