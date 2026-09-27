import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSearch, FaSortAmountDown, FaThLarge, FaList } from 'react-icons/fa';
import ServiceCard from '../../components/customer/ServiceCard';

import LocationModal from '../../components/common/LocationModal';
import { useAuth } from '../../context/AuthContext';
import { FaMapMarkerAlt } from 'react-icons/fa';

const categories = ['Cleaning', 'Plumbing', 'Electrical', 'Painting', 'Carpentry', 'Appliances', 'Pest Control', 'Home Security', 'Handyman', 'Other'];
import { CardSkeleton } from '../../components/common/LoadingSpinner';

const Services = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const perPage = 9;

  useEffect(() => {
    if (user?.address?.latitude && user?.address?.longitude) {
      setUserLocation({
        latitude: user.address.latitude,
        longitude: user.address.longitude,
        address: user.address.formattedAddress || `${user.address.city || ''}, ${user.address.state || ''}`,
      });
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      let endpoint = '';
      if (userLocation?.latitude && userLocation?.longitude) {
        endpoint = `http://localhost:5000/api/providers/nearby?lat=${userLocation.latitude}&lng=${userLocation.longitude}`;
        if (selectedCategory) endpoint += `&category=${encodeURIComponent(selectedCategory)}`;
        if (search) endpoint += `&search=${encodeURIComponent(search)}`;
      } else {
        const queryParams = new URLSearchParams();
        if (selectedCategory) queryParams.append('category', selectedCategory);
        if (search) queryParams.append('search', search);
        if (sortBy) queryParams.append('sort', sortBy);
        endpoint = `http://localhost:5000/api/services?${queryParams.toString()}`;
      }

      fetch(endpoint)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.services) {
            setFilteredServices(data.services);
            setCurrentPage(1);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [search, selectedCategory, sortBy, userLocation]);

  const totalPages = Math.ceil(filteredServices.length / perPage);
  const paginated = filteredServices.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={(loc) => setUserLocation(loc)}
        initialLocation={userLocation}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">All Services</h1>
              <p className="text-gray-500 text-sm mt-1">{filteredServices.length} services available</p>
            </div>

            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-primary-200 flex items-center gap-2 self-start sm:self-auto transition-colors"
            >
              <FaMapMarkerAlt className="text-primary-600" />
              <span className="max-w-[200px] truncate">{userLocation?.address || 'Set Location for Nearby Feed'}</span>
            </button>
          </motion.div>

          {/* Search & Sort */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="input-field pl-11 !py-2.5"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field !w-auto !py-2.5 text-sm"
            >
              <option value="popular">Sort: Popularity</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="bg-white border-b border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory('')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
                        ${!selectedCategory
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
            >
              All Services
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
                          ${selectedCategory === cat
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : paginated.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginated.map((service, i) => (
                <ServiceCard key={service.id} service={service} index={i} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600
                           hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all
                              ${currentPage === i + 1
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100'
                              }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600
                           hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <span className="text-5xl">🔍</span>
            <h3 className="text-xl font-semibold text-gray-800 mt-4">No services found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
            <button onClick={() => { setSearch(''); setSelectedCategory(''); }} className="btn-primary mt-6">
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
