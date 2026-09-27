import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaStar } from 'react-icons/fa';

const PriceBadge = ({ service }) => {
  const pt = service.priceType;
  if (pt === 'fixed') {
    return (
      <div>
        <span className="text-lg font-bold text-gray-900">₹{service.fixedPrice || service.price}</span>
        <span className="text-xs text-gray-400 ml-1">fixed</span>
      </div>
    );
  }
  if (pt === 'inspection') {
    return (
      <div>
        <span className="text-lg font-bold text-gray-900">₹{service.inspectionFee || service.price}</span>
        <div className="text-[10px] text-amber-600 font-medium leading-tight">Visit fee · Quote after inspection</div>
      </div>
    );
  }
  if (pt === 'hourly') {
    return (
      <div>
        <span className="text-lg font-bold text-gray-900">₹{service.visitFee || service.price}</span>
        <span className="text-xs text-gray-400 ml-1">visit</span>
        {service.hourlyRate && (
          <span className="text-xs text-blue-600 font-semibold ml-1">+ ₹{service.hourlyRate}/hr</span>
        )}
      </div>
    );
  }
  // Fallback
  return (
    <div>
      <span className="text-lg font-bold text-gray-900">₹{service.price}</span>
      <span className="text-xs text-gray-400 ml-1">onwards</span>
    </div>
  );
};

const ServiceCard = ({ service, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="card-hover overflow-hidden group"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={service.image}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute top-3 left-3 badge-primary text-[11px]">
          {service.category}
        </span>
        {service.distance !== undefined && (
          <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
            📍 {service.distance} km away
          </span>
        )}
        {service.popular && (
          <span className="absolute top-3 right-3 badge bg-gradient-to-r from-secondary-500 to-orange-500 text-white text-[11px]">
            Popular
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
          {service.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</p>

        <div className="flex items-center gap-1 mt-3">
          <FaStar className="text-secondary-500 text-sm" />
          <span className="text-sm font-semibold text-gray-800">{service.rating}</span>
          <span className="text-xs text-gray-400">({service.reviewCount} reviews)</span>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
          <PriceBadge service={service} />
          <Link
            to={`/services/${service.id}`}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold
                     hover:bg-primary-700 transition-all duration-200 hover:shadow-md active:scale-95"
          >
            Book Now
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
