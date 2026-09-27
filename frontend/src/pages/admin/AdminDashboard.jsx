import { motion } from 'framer-motion';
import { FaUsers, FaUserTie, FaClipboardList, FaRupeeSign, FaArrowRight, FaChartLine } from 'react-icons/fa';
import StatsCard from '../../components/admin/StatsCard';
import { Link } from 'react-router-dom';

const adminStats = {
  totalUsers: 0, totalProviders: 0, totalBookings: 0, totalRevenue: 0,
  pendingProviders: 0, monthlyGrowth: 0, revenueGrowth: 0,
  recentRevenue: [
    { day: 'Mon', revenue: 0 }, { day: 'Tue', revenue: 0 },
    { day: 'Wed', revenue: 0 }, { day: 'Thu', revenue: 0 },
    { day: 'Fri', revenue: 0 }, { day: 'Sat', revenue: 0 },
    { day: 'Sun', revenue: 0 },
  ],
  topServices: [],
};

const AdminDashboard = () => {
  const maxRevenue = Math.max(1, ...adminStats.recentRevenue.map(d => d.revenue));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome to HomeFix administration panel</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={adminStats.totalUsers.toLocaleString()} change={adminStats.monthlyGrowth} icon="👤" color="primary" index={0} />
        <StatsCard title="Providers" value={adminStats.totalProviders.toString()} change={8.2} icon="🔧" color="success" index={1} />
        <StatsCard title="Bookings" value={adminStats.totalBookings.toLocaleString()} change={12.5} icon="📋" color="warning" index={2} />
        <StatsCard title="Revenue" value={`₹${(adminStats.totalRevenue / 100000).toFixed(1)}L`} change={adminStats.revenueGrowth} icon="💰" color="info" index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FaChartLine className="text-primary-500" /> Revenue Trend
            </h2>
            <span className="text-sm text-gray-400">Last 7 days</span>
          </div>

          <div className="flex items-end gap-4 h-52">
            {adminStats.recentRevenue.map((item, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <span className="text-xs font-semibold text-gray-600">₹{(item.revenue / 1000).toFixed(0)}k</span>
                <div className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg flex-1 min-h-[4px]
                             hover:from-primary-700 hover:to-primary-500 transition-colors cursor-pointer" />
                <span className="text-xs text-gray-400">{item.day}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions + Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-6">
          {/* Quick Actions */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/admin/providers" className="flex items-center justify-between p-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors group">
                <span className="text-sm font-medium text-amber-700">Approve Providers</span>
                <div className="flex items-center gap-2">
                  <span className="badge bg-amber-200 text-amber-700">{adminStats.pendingProviders}</span>
                  <FaArrowRight className="text-xs text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <Link to="/admin/bookings" className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group">
                <span className="text-sm font-medium text-emerald-700">Manage Bookings</span>
                <FaArrowRight className="text-xs text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/admin/services" className="flex items-center justify-between p-3 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors group">
                <span className="text-sm font-medium text-primary-700">Add New Service</span>
                <FaArrowRight className="text-xs text-primary-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Top Services */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Top Services</h2>
            <div className="space-y-3">
              {adminStats.topServices.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-sm font-medium text-gray-700">{s.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{s.bookings} bookings</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Bookings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
          <Link to="/admin/bookings" className="text-sm font-semibold text-primary-600 hover:text-primary-700">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase font-semibold">
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'HF1024', serviceName: 'Deep House Cleaning', customerName: 'Rohan Gupta', total: 1899, status: 'completed' },
                { id: 'HF1025', serviceName: 'AC Filter Cleaning', customerName: 'Priya Verma', total: 499, status: 'upcoming' },
                { id: 'HF1026', serviceName: 'Kitchen Plumbing', customerName: 'Amit Singh', total: 850, status: 'ongoing' },
                { id: 'HF1027', serviceName: 'Ceiling Fan Repair', customerName: 'Neha Sharma', total: 299, status: 'confirmed' },
              ].map((b) => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3.5 px-4 font-mono font-semibold text-primary-600 text-xs">#{b.id}</td>
                  <td className="py-3.5 px-4 font-medium text-gray-900">{b.serviceName}</td>
                  <td className="py-3.5 px-4">{b.customerName}</td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900">₹{b.total}</td>
                  <td className="py-3.5 px-4">
                    <span className={`badge ${b.status === 'completed' ? 'badge-success' : b.status === 'ongoing' ? 'badge-warning' : 'badge-primary'}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
