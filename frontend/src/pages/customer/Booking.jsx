import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaShieldAlt, FaCreditCard, FaCheck, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Booking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const { register, handleSubmit, formState: { errors }, getValues } = useForm();

  const serviceId = searchParams.get('serviceId');
  const providerIdParam = searchParams.get('providerId');
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    if (!serviceId) { setLoading(false); return; }
    fetch(`http://localhost:5000/api/services/${serviceId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.service) setService(data.service);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [serviceId]);

  useEffect(() => {
    if (selectedDate && service && service.provider?.id) {
      // Fetch availability
      fetch(`http://localhost:5000/api/providers/${service.provider.id}/availability?date=${selectedDate}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAvailableSlots(data.availableSlots || []);
            setSelectedTime(''); // Reset time selection on date change
          }
        });
    }
  }, [selectedDate, service]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl">😕</span>
          <h2 className="text-xl font-semibold mt-4">Invalid booking details</h2>
          <button onClick={() => navigate('/services')} className="btn-primary mt-6">Browse Services</button>
        </div>
      </div>
    );
  }

  const providerName = service.provider?.name || 'Verified Provider';
  const providerId = providerIdParam || service.provider?.id || service.provider?._id || (typeof service.provider === 'string' ? service.provider : '');
  const pt = service.priceType || service.pricingType; // 'fixed', 'inspection', 'hourly'

  // Compute pricing
  let visitCharge = 0, labourCharge = 0, platformFee = 0, total = 0, initialPayment = 0;
  if (pt === 'fixed') {
    labourCharge = service.fixedPrice || service.price;
    platformFee = Math.round(labourCharge * 0.03);
    total = labourCharge + platformFee;
    initialPayment = total;
  } else if (pt === 'inspection') {
    visitCharge = service.inspectionFee || service.price;
    platformFee = Math.round(visitCharge * 0.03);
    total = visitCharge + platformFee;
    initialPayment = total;
  } else if (pt === 'hourly') {
    visitCharge = service.visitFee || service.price;
    const hrs = duration;
    labourCharge = (service.hourlyRate || 0) * hrs;
    platformFee = Math.round((visitCharge + labourCharge) * 0.03);
    total = visitCharge + labourCharge + platformFee;
    initialPayment = visitCharge + Math.round(visitCharge * 0.03);
  }

  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    return { value: d.toISOString().split('T')[0], day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(), month: d.toLocaleDateString('en-US', { month: 'short' }) };
  });

  const onSubmitBooking = async () => {
    if (!selectedDate || !selectedTime) { toast.error('Please select date and time'); return; }
    setStep(2);
  };

  const processPayment = async () => {
    setIsProcessing(true);
    try {
      // Fake delay for payment gateway
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const formValues = getValues();
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          serviceId, providerId, date: selectedDate, time: selectedTime,
          duration, paymentMethod,
          address: formValues.address || '', city: formValues.city || '',
          pincode: formValues.pincode || '', landmark: formValues.landmark || '',
          description: formValues.description || '',
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setBookingId(data.booking.id);
      setBookingConfirmed(true);
      setStep(3);
      toast.success('Booking confirmed! 🎉');
    } catch (err) {
      toast.error(err.message || 'Booking failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirmation Page
  if (bookingConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 15 }}
          className="card p-8 max-w-md w-full text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheck className="text-3xl text-emerald-500" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
          <p className="text-gray-500 mt-1">Booking #{bookingId}</p>
          <div className="mt-6 space-y-3 text-left bg-gray-50 rounded-xl p-5">
            <div className="flex items-center gap-3 text-sm"><FaCalendarAlt className="text-primary-500" /><span className="text-gray-600">Date: <span className="font-semibold text-gray-900">{selectedDate}</span></span></div>
            <div className="flex items-center gap-3 text-sm"><FaClock className="text-primary-500" /><span className="text-gray-600">Time: <span className="font-semibold text-gray-900">{selectedTime}</span></span></div>
            <div className="flex items-center gap-3 text-sm"><span className="text-primary-500">👤</span><span className="text-gray-600">Provider: <span className="font-semibold text-gray-900">{providerName}</span></span></div>
            <div className="flex items-center gap-3 text-sm border-t border-gray-200 pt-3">
              <span className="text-primary-500">💰</span>
              <span className="text-gray-600">
                {pt === 'fixed' ? 'Total Paid' : 'Paid Now'}:{' '}
                <span className="font-bold text-gray-900 text-lg">₹{initialPayment}</span>
              </span>
            </div>
            {pt === 'inspection' && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">📋 Final quote will be sent after inspection</div>
            )}
            {pt === 'hourly' && (
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">⏱ Final bill calculated after service completion</div>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate('/my-bookings')} className="btn-primary flex-1">View Bookings</button>
            <button onClick={() => navigate('/')} className="btn-outline flex-1">Back to Home</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <FaArrowLeft className="text-xs" /> Back
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-3 mb-8">
          {['Booking Details', 'Payment', 'Confirmation'].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                ${step > i + 1 ? 'bg-primary-600 text-white' : step === i + 1 ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                {step > i + 1 ? <FaCheck className="text-xs" /> : i + 1}
              </div>
              <span className={`hidden sm:block text-sm font-medium ${step >= i + 1 ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
              {i < 2 && <div className={`w-8 sm:w-12 h-0.5 ${step > i + 1 ? 'bg-primary-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <form onSubmit={handleSubmit(onSubmitBooking)} className="space-y-6">
                    {/* Service Info */}
                    <div className="card p-5">
                      <h3 className="font-semibold text-gray-900 mb-3">Service Details</h3>
                      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                        <img src={service.image} alt="" className="w-16 h-16 rounded-xl object-cover" />
                        <div>
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          <p className="text-sm text-gray-500">{providerName}</p>
                        </div>
                      </div>

                      {/* Duration — only for hourly */}
                      {pt === 'hourly' && (
                        <div className="mt-4">
                          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Estimated Duration (hours)</label>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setDuration(Math.max(1, duration - 1))}
                              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">-</button>
                            <span className="text-lg font-semibold w-10 text-center">{duration}</span>
                            <button type="button" onClick={() => setDuration(Math.min(8, duration + 1))}
                              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Final bill based on actual hours worked</p>
                        </div>
                      )}
                    </div>

                    {/* Date & Time */}
                    <div className="card p-5">
                      <h3 className="font-semibold text-gray-900 mb-3">Select Date & Time</h3>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {dates.map((d) => (
                          <button key={d.value} type="button" onClick={() => setSelectedDate(d.value)}
                            className={`flex-shrink-0 flex flex-col items-center py-3 px-4 rounded-xl border-2 transition-all
                              ${selectedDate === d.value ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-100 hover:border-gray-200'}`}>
                            <span className="text-xs font-medium">{d.day}</span>
                            <span className="text-lg font-bold">{d.date}</span>
                            <span className="text-xs">{d.month}</span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Time Slot</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots.length > 0 ? availableSlots.map((t) => (
                            <button key={t} type="button" onClick={() => setSelectedTime(t)}
                              className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all
                                ${selectedTime === t ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}>
                              {t}
                            </button>
                          )) : (
                            <div className="col-span-full text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">No slots available on this date.</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="card p-5">
                      <h3 className="font-semibold text-gray-900 mb-3">Service Address</h3>
                      <div className="space-y-3">
                        <input {...register('address', { required: 'Address is required' })} placeholder="Street address" className="input-field" />
                        {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
                        <div className="grid grid-cols-2 gap-3">
                          <input {...register('city')} placeholder="City" className="input-field" />
                          <input {...register('pincode')} placeholder="Pincode" className="input-field" />
                        </div>
                        <input {...register('landmark')} placeholder="Landmark (optional)" className="input-field" />
                      </div>
                    </div>

                    <div className="card p-5">
                      <h3 className="font-semibold text-gray-900 mb-3">Additional Details</h3>
                      <textarea {...register('description')} placeholder="Describe your problem or requirements..." rows={3} className="input-field resize-none" />
                    </div>

                    <button type="submit" className="btn-primary w-full">Continue to Payment</button>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="card p-5">
                    <h3 className="font-semibold text-gray-900 mb-5">Payment Method</h3>
                    <div className="space-y-3">
                      {[
                        { id: 'upi', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm', icon: '📱' },
                        { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', icon: '💳' },
                        { id: 'netbanking', label: 'Net Banking', desc: 'All major banks', icon: '🏦' },
                        { id: 'cash', label: 'Cash on Service', desc: 'Pay after service completion', icon: '💵' },
                      ].map((method) => (
                        <label key={method.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                            ${paymentMethod === method.id ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'}`}>
                          <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id}
                            onChange={() => setPaymentMethod(method.id)} className="sr-only" />
                          <span className="text-2xl">{method.icon}</span>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900">{method.label}</p>
                            <p className="text-xs text-gray-500">{method.desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id ? 'border-primary-500' : 'border-gray-300'}`}>
                            {paymentMethod === method.id && <div className="w-3 h-3 rounded-full bg-primary-500" />}
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl flex items-center gap-2 text-xs text-amber-700">
                      <FaShieldAlt /> This is a test/demo payment — no real charges will be made
                    </div>
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={processPayment} disabled={isProcessing}
                      className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-60">
                      {isProcessing ? <LoadingSpinner size="sm" /> : (
                        <>
                          <FaCreditCard />
                          {pt === 'fixed' ? `Pay ₹${initialPayment}` : `Pay Visit Fee ₹${initialPayment}`}
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                <img src={service.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{service.name}</p>
                  <p className="text-xs text-gray-500">{providerName}</p>
                </div>
              </div>

              {selectedDate && (
                <div className="text-sm text-gray-600 space-y-1.5 mb-4 pb-4 border-b border-gray-100">
                  <p>📅 {selectedDate}</p>
                  {selectedTime && <p>⏰ {selectedTime}</p>}
                  {pt === 'hourly' && <p>⏱️ {duration} hour(s) estimated</p>}
                </div>
              )}

              <div className="space-y-2.5 text-sm">
                {pt === 'fixed' && (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">Service Price</span><span>₹{labourCharge}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Platform Fee</span><span>₹{platformFee}</span></div>
                    <div className="flex justify-between border-t border-gray-100 pt-2.5 font-bold text-gray-900">
                      <span>Total</span><span className="text-primary-600 text-lg">₹{total}</span>
                    </div>
                  </>
                )}

                {pt === 'inspection' && (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">Visit / Inspection Fee</span><span>₹{visitCharge}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Platform Fee</span><span>₹{platformFee}</span></div>
                    <div className="flex justify-between border-t border-gray-100 pt-2.5 font-bold text-gray-900">
                      <span>Pay Now</span><span className="text-primary-600 text-lg">₹{total}</span>
                    </div>
                    <div className="bg-amber-50 text-amber-700 text-xs p-2.5 rounded-lg mt-1">
                      📋 Final repair charges after inspection quote
                    </div>
                  </>
                )}

                {pt === 'hourly' && (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">Visit Fee</span><span>₹{visitCharge}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Labour ({duration} hr × ₹{service.hourlyRate})</span><span>₹{labourCharge}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Platform Fee</span><span>₹{platformFee}</span></div>
                    <div className="flex justify-between border-t border-gray-100 pt-2.5 text-gray-500">
                      <span>Estimated Total</span><span>₹{total}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>Pay Now (Visit Fee)</span><span className="text-primary-600 text-lg">₹{initialPayment}</span>
                    </div>
                    <div className="bg-blue-50 text-blue-700 text-xs p-2.5 rounded-lg mt-1">
                      ⏱ Final bill based on actual hours after completion
                    </div>
                  </>
                )}
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs text-gray-400 justify-center">
                <FaShieldAlt /> Secure & encrypted checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
