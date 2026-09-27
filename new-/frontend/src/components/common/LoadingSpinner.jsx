import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div
        className={`${sizes[size]} border-3 border-gray-200 border-t-primary-600 rounded-full`}
        style={{ borderWidth: '3px' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && <p className="text-sm text-gray-500 font-medium">{text}</p>}
    </div>
  );
};

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-4"
      >
        <span className="text-4xl">🏠</span>
      </motion.div>
      <LoadingSpinner size="lg" text="Loading HomeFix..." />
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="card p-4 space-y-3">
    <div className="skeleton h-40 w-full rounded-xl" />
    <div className="skeleton h-4 w-3/4" />
    <div className="skeleton h-4 w-1/2" />
    <div className="flex justify-between items-center">
      <div className="skeleton h-6 w-20" />
      <div className="skeleton h-8 w-24 rounded-lg" />
    </div>
  </div>
);

export const ListSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 card">
        <div className="skeleton h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
        <div className="skeleton h-8 w-20 rounded-lg" />
      </div>
    ))}
  </div>
);

export const ProfileSkeleton = () => (
  <div className="card p-6 space-y-4">
    <div className="flex items-center gap-4">
      <div className="skeleton h-20 w-20 rounded-full" />
      <div className="space-y-2">
        <div className="skeleton h-5 w-40" />
        <div className="skeleton h-4 w-32" />
      </div>
    </div>
    <div className="space-y-3">
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-4 w-1/2" />
    </div>
  </div>
);

export const EmptyState = ({ icon = '📭', title, description, actionText, onAction }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
  >
    <span className="text-6xl mb-4">{icon}</span>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6 max-w-sm">{description}</p>
    {actionText && onAction && (
      <button onClick={onAction} className="btn-primary">
        {actionText}
      </button>
    )}
  </motion.div>
);

export default LoadingSpinner;
