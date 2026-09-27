import { motion } from 'framer-motion';

const StatsCard = ({ title, value, change, icon, color = 'primary', index = 0 }) => {
  const colors = {
    primary: { bg: 'bg-primary-50', icon: 'bg-primary-500', text: 'text-primary-600' },
    success: { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-600' },
    warning: { bg: 'bg-amber-50', icon: 'bg-amber-500', text: 'text-amber-600' },
    info: { bg: 'bg-sky-50', icon: 'bg-sky-500', text: 'text-sky-600' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-500', text: 'text-purple-600' },
  };

  const c = colors[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="card p-5 hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-xs font-semibold mt-1 ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center text-white text-xl shadow-lg shadow-${color}-200`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
