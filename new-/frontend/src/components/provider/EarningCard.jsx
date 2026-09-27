import { motion } from 'framer-motion';

const EarningCard = ({ title, value, subtitle, icon, color = 'primary', index = 0 }) => {
  const colors = {
    primary: 'from-primary-500 to-primary-600',
    secondary: 'from-secondary-500 to-secondary-600',
    success: 'from-emerald-500 to-emerald-600',
    info: 'from-sky-500 to-sky-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card p-5 relative overflow-hidden group hover:shadow-lg transition-shadow"
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center
                        text-white text-lg group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${colors[color]} opacity-5
                     group-hover:opacity-10 transition-opacity`} />
    </motion.div>
  );
};

export default EarningCard;
