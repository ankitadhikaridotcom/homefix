import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSearch, FaMapMarkerAlt, FaArrowRight, FaShieldAlt, FaLock, FaHeadset, FaStar, FaBolt, FaFaucet, FaBroom, FaHammer, FaSnowflake, FaPaintRoller, FaWrench, FaBug } from 'react-icons/fa';
import ServiceCard from '../../components/customer/ServiceCard';
import { useEffect } from 'react';

import LocationModal from '../../components/common/LocationModal';
import { useAuth } from '../../context/AuthContext';

const categories = [
  { id: 'cleaning', name: 'Cleaning', icon: 'FaBroom', desc: 'Home & Office', color: 'from-amber-500 to-orange-600', count: 42 },
  { id: 'plumbing', name: 'Plumbing', icon: 'FaFaucet', desc: 'Repairs & Fitting', color: 'from-blue-500 to-indigo-600', count: 35 },
  { id: 'electrical', name: 'Electrical', icon: 'FaBolt', desc: 'Wiring & Fixes', color: 'from-yellow-500 to-amber-600', count: 28 },
  { id: 'painting', name: 'Painting', icon: 'FaPaintRoller', desc: 'Wall & Texture', color: 'from-purple-500 to-pink-600', count: 19 },
  { id: 'carpentry', name: 'Carpentry', icon: 'FaHammer', desc: 'Woodwork', color: 'from-emerald-500 to-teal-600', count: 24 },
  { id: 'appliances', name: 'Appliances', icon: 'FaSnowflake', desc: 'AC & Fridge', color: 'from-cyan-500 to-blue-600', count: 31 },
  { id: 'pest-control', name: 'Pest Control', icon: 'FaBug', desc: 'Termite & Ants', color: 'from-rose-500 to-red-600', count: 15 },
  { id: 'handyman', name: 'Handyman', icon: 'FaWrench', desc: 'General Repairs', color: 'from-slate-600 to-slate-800', count: 50 }
];

const iconMap = { FaBolt, FaFaucet, FaBroom, FaHammer, FaSnowflake, FaPaintRoller, FaWrench, FaBug };

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (user?.address?.latitude && user?.address?.longitude) {
      const initialLoc = {
        latitude: user.address.latitude,
        longitude: user.address.longitude,
        address: user.address.formattedAddress || `${user.address.city || ''}, ${user.address.state || ''}`,
      };
      setUserLocation(initialLoc);
      fetchNearbyServices(initialLoc.latitude, initialLoc.longitude);
    } else {
      fetchDefaultServices();
    }
  }, [user]);

  const fetchDefaultServices = () => {
    fetch('http://localhost:5000/api/services')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.services) setServices(data.services);
      })
      .catch(console.error);
  };

  const fetchNearbyServices = (lat, lng) => {
    fetch(`http://localhost:5000/api/providers/nearby?lat=${lat}&lng=${lng}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.services && data.services.length > 0) {
          setServices(data.services);
        } else {
          fetchDefaultServices();
        }
      })
      .catch(() => fetchDefaultServices());
  };

  const handleLocationSelected = (loc) => {
    setUserLocation(loc);
    fetchNearbyServices(loc.latitude, loc.longitude);
  };

  const popularServices = services.slice(0, 4);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const stagger = {
    container: { hidden: {}, show: { transition: { staggerChildren: 0.05 } } },
    item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } },
  };

  return (
    <div className="min-h-screen">
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={handleLocationSelected}
        initialLocation={userLocation}
      />

      {/* Hero Section */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />

        <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-secondary-500/10 blur-3xl" />
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-white/90 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-secondary-400 animate-pulse" />
              Trusted by 10,000+ customers
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Find Trusted Service{' '}
              <span className="text-secondary-400">Professionals</span>
            </h1>
            <p className="text-blue-100 mt-4 text-lg md:text-xl max-w-2xl mx-auto">
              Book electricians, plumbers, cleaners & more — verified professionals at your doorstep
            </p>

            {/* Location Discovery Bar */}
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 bg-white/15 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20 text-white text-sm">
              <span className="font-bold flex items-center gap-1.5 text-secondary-300">
                <FaMapMarkerAlt /> Your Location:
              </span>
              <span className="font-medium text-white max-w-xs truncate">
                {userLocation?.address || 'No location set'}
              </span>
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all border border-white/30 flex items-center gap-1"
              >
                {userLocation ? 'Change Location' : '📍 Use My Current Location'}
              </button>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-8 max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="What service do you need?"
                    className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl text-gray-900 placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm sm:text-base"
                  />
                </div>
                <button type="submit" className="btn-secondary !rounded-xl flex items-center justify-center gap-2 !py-3.5 sm:w-auto">
                  <FaSearch /> Search
                </button>
              </div>
            </form>

            {/* Custom Service Request Banner */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-8 max-w-2xl mx-auto bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-5 sm:p-6 text-left flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">✨ Need a Customized Service?</h3>
                <p className="text-blue-100 text-sm mt-1">Can't find what you're looking for? Tell us what you need and we'll find the right provider.</p>
              </div>
              <Link to="/request-custom-service" className="bg-white text-primary-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition shadow-lg whitespace-nowrap flex-shrink-0">
                Request Custom Service
              </Link>
            </motion.div>




          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-subtitle">Choose from our wide range of home services</p>
          </motion.div>

          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          >
            {categories.map((cat) => {
              const IconComponent = iconMap[cat.icon];
              return (
                <motion.div key={cat.id} variants={stagger.item}>
                  <Link
                    to={`/services?category=${cat.name}`}
                    className="group flex flex-col items-center p-6 rounded-2xl bg-gray-50 hover:bg-white
                             border border-transparent hover:border-gray-100 hover:shadow-lg
                             transition-all duration-300"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center
                                  text-white text-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {IconComponent && <IconComponent />}
                    </div>
                    <h3 className="font-semibold text-gray-900 mt-3 text-sm">{cat.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{cat.count} providers</p>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <h2 className="section-title">Popular Services</h2>
              <p className="section-subtitle">Most booked services by our customers</p>
            </div>
            <Link to="/services" className="hidden sm:flex items-center gap-2 text-primary-600 font-semibold text-sm hover:text-primary-700">
              View All <FaArrowRight className="text-xs" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {popularServices.map((service, i) => (
              <ServiceCard key={service.id} service={service} index={i} />
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Link to="/services" className="btn-outline inline-flex items-center gap-2">
              View All Services <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Book a service in 3 easy steps</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', icon: '🔍', title: 'Choose a Service', desc: 'Browse through our wide range of home services and pick what you need' },
              { step: '02', icon: '📅', title: 'Book & Pay', desc: 'Select a time slot, fill in details, and make a secure payment' },
              { step: '03', icon: '✅', title: 'Get It Done', desc: 'A verified professional arrives at your door and completes the job' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary-200 to-transparent" />
                )}
                <div className="relative inline-flex">
                  <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center text-3xl mx-auto">
                    {item.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold
                               flex items-center justify-center">{item.step}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mt-4">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offer Banner */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-secondary-500 via-secondary-400 to-orange-400 rounded-3xl p-8 md:p-12
                     text-white relative overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -right-20 -bottom-20 w-60 h-60 rounded-full bg-white/5" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="inline-block bg-white/20 text-sm font-semibold px-3 py-1 rounded-full mb-3">
                  🎉 Limited Time Offer
                </span>
                <h3 className="text-2xl md:text-3xl font-bold">20% OFF your first booking!</h3>
                <p className="text-white/80 mt-2">Use code <span className="font-bold bg-white/20 px-2 py-0.5 rounded">WELCOME20</span> at checkout</p>
              </div>
              <Link
                to="/services"
                className="bg-white text-secondary-600 px-8 py-3 rounded-xl font-bold text-sm
                         hover:bg-gray-100 transition-colors shadow-lg flex-shrink-0"
              >
                Book Now
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="section-title">Why Choose HomeFix?</h2>
            <p className="section-subtitle">We ensure quality and trust at every step</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: <FaShieldAlt className="text-primary-500" />, title: 'Verified Professionals', desc: 'All service providers are background-verified and trained' },
              { icon: <FaLock className="text-primary-500" />, title: 'Secure Payments', desc: 'Your payments are protected with industry-standard encryption' },
              { icon: <FaHeadset className="text-primary-500" />, title: '24/7 Support', desc: 'Our support team is available round the clock to help you' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-xl mx-auto">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mt-4">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-2">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '10K+', label: 'Happy Customers' },
              { value: '500+', label: 'Service Providers' },
              { value: '25K+', label: 'Jobs Completed' },
              { value: '4.8⭐', label: 'Average Rating' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-3xl md:text-4xl font-bold text-gradient">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
