import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCamera, FaSave,
  FaStar, FaEdit, FaCheckCircle, FaClock, FaCalendarAlt, FaTimesCircle, FaPlus, FaTimes
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API = 'http://localhost:5000';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SKILL_SUGGESTIONS = ['Wiring', 'Panel Box', 'AC Installation', 'Plumbing', 'Tile Work', 'Painting', 'Carpentry', 'Appliance Repair', 'CCTV', 'Pest Control', 'Home Automation', 'Solar'];

const ProviderProfile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
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

      const updateRes = await fetch(`${API}/api/providers/me/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ profileImage: uploadData.photoUrl }),
      });
      const updateData = await updateRes.json();

      if (updateData.success) {
        if (updateUser) updateUser(updateData.user);
        toast.success('Profile picture updated!');
      } else {
        throw new Error(updateData.message || 'Failed to update profile');
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    city: user?.address?.city || user?.city || '',
    profession: user?.profession || '',
    experience: user?.experience || '',
    about: user?.about || '',
    skills: user?.skills || [],
  });

  const [availability, setAvailability] = useState({
    workingDays: user?.availability?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    startTime: user?.availability?.workingHours?.start || '09:00',
    endTime: user?.availability?.workingHours?.end || '18:00',
    unavailableDates: user?.availability?.unavailableDates || [],
  });
  const [newUnavailableDate, setNewUnavailableDate] = useState('');

  // Sync with user context
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        city: user.address?.city || user.city || '',
        profession: user.profession || '',
        experience: user.experience || '',
        about: user.about || '',
        skills: user.skills || [],
      });
      setAvailability({
        workingDays: user.availability?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        startTime: user.availability?.workingHours?.start || '09:00',
        endTime: user.availability?.workingHours?.end || '18:00',
        unavailableDates: user.availability?.unavailableDates || [],
      });
    }
  }, [user]);

  const toggleDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  const addSkill = (skill) => {
    const s = skill.trim();
    if (!s || form.skills.includes(s)) return;
    setForm(prev => ({ ...prev, skills: [...prev.skills, s] }));
    setNewSkill('');
  };

  const removeSkill = (skill) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const addUnavailableDate = () => {
    if (!newUnavailableDate) return;
    if (availability.unavailableDates.includes(newUnavailableDate)) {
      return toast.error('Date already added');
    }
    setAvailability(prev => ({ ...prev, unavailableDates: [...prev.unavailableDates, newUnavailableDate].sort() }));
    setNewUnavailableDate('');
  };

  const removeUnavailableDate = (date) => {
    setAvailability(prev => ({ ...prev, unavailableDates: prev.unavailableDates.filter(d => d !== date) }));
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch(`${API}/api/providers/me/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        if (updateUser) updateUser(data.user);
        toast.success('✅ Profile saved!');
        setEditing(false);
      } else toast.error(data.message || 'Failed to save');
    } catch (e) { toast.error('Failed to save profile'); }
    finally { setSavingProfile(false); }
  };

  const handleSaveAvailability = async () => {
    setSavingAvailability(true);
    try {
      const res = await fetch(`${API}/api/providers/me/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(availability),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('✅ Availability saved!');
        if (updateUser) updateUser({ ...user, availability: data.availability });
      } else toast.error(data.message || 'Failed to save');
    } catch (e) { toast.error('Failed to save availability'); }
    finally { setSavingAvailability(false); }
  };

  const formatTime = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your provider information and availability settings.</p>
      </motion.div>

      {/* === PROFILE HERO CARD === */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="card p-6 bg-gradient-to-r from-primary-600 via-primary-700 to-violet-700 text-white relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -left-6 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative flex flex-col sm:flex-row items-center gap-5">
          {/* Avatar */}
          <div className="relative group">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
            />
            <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center text-4xl font-black ring-4 ring-white/30 overflow-hidden relative">
              {user?.profileImage
                ? <img src={user.profileImage} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
                : user?.name?.charAt(0)?.toUpperCase() || '?'}
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                </div>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center disabled:opacity-0 cursor-pointer"
            >
              <FaCamera className="text-white text-lg" />
            </button>
          </div>
          {/* Info */}
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-black">{user?.name}</h2>
            <p className="text-primary-200 font-medium">{user?.profession || 'Service Provider'}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
              {user?.phoneVerified && (
                <span className="flex items-center gap-1 bg-white/15 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  <FaCheckCircle className="text-emerald-300" /> Verified
                </span>
              )}
              {user?.experience > 0 && (
                <span className="bg-white/15 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  🔧 {user.experience} yrs experience
                </span>
              )}
              {user?.address?.city || user?.city ? (
                <span className="bg-white/15 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  📍 {user.address?.city || user.city}
                </span>
              ) : null}
            </div>
          </div>
          <button onClick={() => setEditing(!editing)}
            className="sm:ml-auto bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2">
            <FaEdit /> {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </motion.div>

      {/* === PERSONAL INFORMATION === */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="card p-6">
        <h3 className="font-bold text-gray-900 text-base mb-5 flex items-center gap-2">
          <FaUser className="text-primary-500" /> Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Full Name', key: 'name', icon: <FaUser />, placeholder: 'Your full name' },
            { label: 'Phone', key: 'phone', icon: <FaPhone />, placeholder: '+91...' },
            { label: 'Email', key: 'email', icon: <FaEnvelope />, placeholder: 'email@example.com', disabled: true },
            { label: 'City / Service Area', key: 'city', icon: <FaMapMarkerAlt />, placeholder: 'e.g. Haldwani' },
            { label: 'Profession', key: 'profession', icon: '🔧', placeholder: 'e.g. Electrician, Plumber' },
            { label: 'Experience (years)', key: 'experience', icon: '📅', type: 'number', placeholder: 'e.g. 5' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{field.label}</label>
              <div className="relative">
                <input
                  type={field.type || 'text'}
                  value={form[field.key]}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  disabled={!editing || field.disabled}
                  placeholder={field.placeholder}
                  className="input-field pl-10 disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{field.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* About */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1">About Me</label>
          <textarea
            value={form.about}
            onChange={e => setForm(prev => ({ ...prev, about: e.target.value }))}
            disabled={!editing}
            rows={3}
            placeholder="Tell customers about yourself, your experience, and what makes you stand out..."
            className="input-field resize-none disabled:bg-gray-50 disabled:text-gray-500 text-sm"
          />
        </div>

        {/* Skills */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-600 mb-2">Skills</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.skills.map(skill => (
              <span key={skill} className="flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 text-xs font-semibold px-3 py-1.5 rounded-full">
                {skill}
                {editing && (
                  <button onClick={() => removeSkill(skill)} className="hover:text-red-500 transition ml-0.5">
                    <FaTimes className="text-[10px]" />
                  </button>
                )}
              </span>
            ))}
            {form.skills.length === 0 && !editing && (
              <p className="text-xs text-gray-400">No skills added yet.</p>
            )}
          </div>
          {editing && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))}
                  placeholder="Add a skill..."
                  className="input-field text-sm flex-1"
                />
                <button onClick={() => addSkill(newSkill)}
                  className="px-3 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition flex items-center gap-1">
                  <FaPlus />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_SUGGESTIONS.filter(s => !form.skills.includes(s)).map(s => (
                  <button key={s} onClick={() => addSkill(s)}
                    className="text-[11px] bg-gray-100 hover:bg-primary-50 hover:text-primary-600 text-gray-600 px-2.5 py-1 rounded-full transition font-medium">
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {editing && (
          <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
            <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleSaveProfile} disabled={savingProfile}
              className="btn-primary flex items-center gap-2">
              <FaSave /> {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        )}
      </motion.div>

      {/* === AVAILABILITY === */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="card p-6">
        <h3 className="font-bold text-gray-900 text-base mb-5 flex items-center gap-2">
          <FaClock className="text-primary-500" /> Availability Settings
        </h3>

        {/* Working Days */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Working Days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => (
              <button key={day} onClick={() => toggleDay(day)} type="button"
                className={`w-14 h-12 rounded-xl text-sm font-bold transition-all border-2 ${availability.workingDays.includes(day)
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-200'
                  : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-primary-200 hover:text-primary-500'}`}>
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Working Hours */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FaClock className="text-gray-400" /> Working Hours
          </label>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium w-10">From</label>
              <input type="time" value={availability.startTime}
                onChange={e => setAvailability(prev => ({ ...prev, startTime: e.target.value }))}
                className="input-field text-sm w-36" />
            </div>
            <span className="text-gray-400 font-bold">→</span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium w-10">To</label>
              <input type="time" value={availability.endTime}
                onChange={e => setAvailability(prev => ({ ...prev, endTime: e.target.value }))}
                className="input-field text-sm w-36" />
            </div>
            <div className="ml-auto bg-primary-50 border border-primary-100 px-4 py-2 rounded-xl">
              <p className="text-xs text-primary-700 font-bold">
                {availability.workingDays.join(', ') || 'No days selected'} | {formatTime(availability.startTime)} – {formatTime(availability.endTime)}
              </p>
            </div>
          </div>
        </div>

        {/* Unavailable Dates */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FaCalendarAlt className="text-gray-400" /> Unavailable Dates
            <span className="text-xs font-normal text-gray-400">(Holidays, leaves, etc.)</span>
          </label>
          <div className="flex gap-2 mb-3">
            <input type="date" value={newUnavailableDate}
              onChange={e => setNewUnavailableDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input-field text-sm flex-1 max-w-xs" />
            <button onClick={addUnavailableDate}
              className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl text-sm font-bold transition flex items-center gap-1">
              <FaPlus /> Mark Unavailable
            </button>
          </div>
          {availability.unavailableDates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availability.unavailableDates.map(date => (
                <span key={date}
                  className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-100 text-xs font-semibold px-3 py-1.5 rounded-full">
                  <FaTimesCircle className="text-red-400" />
                  {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  <button onClick={() => removeUnavailableDate(date)} className="hover:text-red-900 ml-1">
                    <FaTimes className="text-[10px]" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No unavailable dates added.</p>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button onClick={handleSaveAvailability} disabled={savingAvailability}
            className="btn-primary flex items-center gap-2">
            <FaSave /> {savingAvailability ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </motion.div>

      {/* === VERIFICATION STATUS === */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="card p-5">
        <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
          <FaCheckCircle className="text-emerald-500" /> Verification Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Phone Verified', status: user?.phoneVerified, icon: '📱' },
            { label: 'Profile Complete', status: !!(user?.profession && user?.about), icon: '👤' },
            { label: 'Location Set', status: !!(user?.location?.coordinates && (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0)), icon: '📍' },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${item.status ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
              <span className="text-lg">{item.icon}</span>
              <div>
                <p className="text-xs font-bold text-gray-800">{item.label}</p>
                <p className={`text-[11px] font-semibold mt-0.5 ${item.status ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {item.status ? '✅ Done' : '⏳ Pending'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ProviderProfile;
