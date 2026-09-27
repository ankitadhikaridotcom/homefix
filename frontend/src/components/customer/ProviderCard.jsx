import { motion } from 'framer-motion';
import { FaStar, FaCheckCircle, FaMapMarkerAlt } from 'react-icons/fa';

const ProviderCard = ({ provider, index = 0, onSelect, selected }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      className={`card p-5 cursor-pointer transition-all duration-200
                ${selected ? 'ring-2 ring-primary-500 border-primary-200 bg-primary-50/30' : 'hover:shadow-md'}`}
      onClick={() => onSelect && onSelect(provider)}
    >
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <img
            src={provider.avatar}
            alt={provider.name}
            className="w-16 h-16 rounded-xl object-cover"
          />
          {provider.verified && (
            <FaCheckCircle className="absolute -bottom-1 -right-1 text-primary-500 text-sm bg-white rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900">{provider.name}</h3>
              <p className="text-sm text-gray-500">{provider.services.join(', ')}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold text-gray-900">₹{provider.hourlyRate}</p>
              <p className="text-xs text-gray-400">/hour</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-sm">
              <FaStar className="text-secondary-500" />
              <span className="font-semibold text-gray-800">{provider.rating}</span>
              <span className="text-gray-400">({provider.reviewCount})</span>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">{provider.experience} yrs exp</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <FaMapMarkerAlt className="text-xs" />
              {provider.distance}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {provider.badges?.map((badge, i) => (
              <span key={i} className="badge-primary text-[10px]">{badge}</span>
            ))}
            {!provider.available && (
              <span className="badge-danger text-[10px]">Currently Unavailable</span>
            )}
          </div>
        </div>
      </div>

      {onSelect && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(provider); }}
            disabled={!provider.available}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all
                      ${provider.available
                        ? selected
                          ? 'bg-primary-600 text-white'
                          : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
          >
            {selected ? '✓ Selected' : provider.available ? 'Select Provider' : 'Unavailable'}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ProviderCard;
