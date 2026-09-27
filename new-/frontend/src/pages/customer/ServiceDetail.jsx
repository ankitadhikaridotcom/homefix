import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaStar, FaCheck, FaTimes, FaArrowLeft, FaShieldAlt, FaClock, FaTag, FaInfoCircle, FaSearch } from 'react-icons/fa';
import { CardSkeleton } from '../../components/common/LoadingSpinner';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/services/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.service) setService(data.service);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton h-64 w-full rounded-2xl" />
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-4 w-full" />
          </div>
          <div className="space-y-4"><div className="skeleton h-48 w-full rounded-2xl" /></div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl">😕</span>
          <h2 className="text-xl font-semibold mt-4">Service not found</h2>
          <Link to="/services" className="btn-primary mt-6 inline-block">Browse Services</Link>
        </div>
      </div>
    );
  }

  const providerInfo = service.provider || null;
  const pt = service.priceType;

  const handleBooking = () => {
    if (providerInfo) {
      navigate(`/booking?serviceId=${service.id}&providerId=${providerInfo.id}`);
    }
  };

  // Pricing info bar text
  const pricingLabel = pt === 'fixed' ? 'Fixed price'
    : pt === 'inspection' ? 'Quote after inspection'
    : pt === 'hourly' ? 'Hourly rate' : '';

  const pricingIcon = pt === 'fixed' ? <FaTag className="text-gray-400" />
    : pt === 'inspection' ? <FaSearch className="text-gray-400" />
    : <FaClock className="text-gray-400" />;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <FaArrowLeft className="text-xs" /> Back to Services
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Service Details */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl overflow-hidden">
              <img src={service.image} alt={service.name} className="w-full h-64 md:h-80 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="badge-primary mb-2">{service.category}</span>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{service.name}</h1>
              </div>
            </motion.div>

            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                {pricingIcon}
                {pt === 'fixed' && <span>₹{service.fixedPrice || service.price} fixed</span>}
                {pt === 'inspection' && <span>Visit from ₹{service.inspectionFee || service.price}</span>}
                {pt === 'hourly' && <span>₹{service.visitFee || service.price} visit + ₹{service.hourlyRate}/hr</span>}
              </div>
              <span className="text-gray-200">|</span>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <FaInfoCircle className="text-gray-400" /> {pricingLabel}
              </div>
              {providerInfo && (
                <>
                  <span className="text-gray-200">|</span>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">👤 {providerInfo.name}</div>
                </>
              )}
            </div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About this Service</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {service.description || 'Professional home service delivered by verified experts. Our trained professionals ensure quality work with guaranteed satisfaction.'}
              </p>
            </motion.div>

            {providerInfo && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Provider</h2>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center text-2xl flex-shrink-0">👤</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{providerInfo.name}</h3>
                    <p className="text-sm text-gray-500">Verified Service Provider</p>
                  </div>
                  <span className="badge-primary text-xs">✓ Verified</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right — Price & Booking Summary */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Price Breakdown</h3>

              {pt === 'fixed' && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Service Price</span><span className="font-semibold">₹{service.fixedPrice || service.price}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Platform Fee (3%)</span><span className="font-semibold">₹{Math.round((service.fixedPrice || service.price) * 0.03)}</span></div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-primary-600 text-lg">₹{(service.fixedPrice || service.price) + Math.round((service.fixedPrice || service.price) * 0.03)}</span>
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 text-xs p-3 rounded-xl mt-2 font-medium">
                    ✓ You pay exactly this amount. No hidden charges.
                  </div>
                </div>
              )}

              {pt === 'inspection' && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Visit / Inspection Fee</span><span className="font-semibold">₹{service.inspectionFee || service.price}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Platform Fee (3%)</span><span className="font-semibold">₹{Math.round((service.inspectionFee || service.price) * 0.03)}</span></div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="font-semibold text-gray-900">Pay Now</span>
                    <span className="font-bold text-primary-600 text-lg">₹{(service.inspectionFee || service.price) + Math.round((service.inspectionFee || service.price) * 0.03)}</span>
                  </div>
                  <div className="bg-amber-50 text-amber-700 text-xs p-3 rounded-xl mt-2 font-medium">
                    📋 After inspection, the provider will send a detailed quote with labour, parts & material charges. You approve before any additional payment.
                  </div>
                </div>
              )}

              {pt === 'hourly' && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Visit Fee</span><span className="font-semibold">₹{service.visitFee || service.price}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Hourly Rate</span><span className="font-semibold">₹{service.hourlyRate}/hr</span></div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="font-semibold text-gray-900">Pay at booking</span>
                    <span className="font-bold text-primary-600 text-lg">₹{(service.visitFee || service.price) + Math.round((service.visitFee || service.price) * 0.03)}</span>
                  </div>
                  <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-xl mt-2 font-medium">
                    ⏱ Final bill = Visit Fee + (Hourly Rate × Actual Hours) + Materials. Calculated after service completion.
                  </div>
                </div>
              )}

              {providerInfo && (
                <div className="mt-5 p-3 bg-primary-50 rounded-xl">
                  <p className="text-xs font-semibold text-primary-600 mb-1">Service Provider</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-sm">👤</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{providerInfo.name}</p>
                      <p className="text-xs text-gray-500">✓ Verified</p>
                    </div>
                  </div>
                </div>
              )}

              <button onClick={handleBooking} disabled={!providerInfo}
                className="btn-primary w-full mt-5 disabled:opacity-50 disabled:cursor-not-allowed">
                {providerInfo ? 'Book Now' : 'No Provider Available'}
              </button>

              <div className="flex items-center gap-2 mt-4 text-xs text-gray-400 justify-center">
                <FaShieldAlt /> Secure booking with money-back guarantee
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
