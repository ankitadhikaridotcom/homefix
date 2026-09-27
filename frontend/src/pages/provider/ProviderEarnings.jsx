import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaWallet, FaArrowDown, FaArrowUp, FaUniversity } from 'react-icons/fa';
import toast from 'react-hot-toast';
import EarningCard from '../../components/provider/EarningCard';

const ProviderEarnings = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [chartView, setChartView] = useState('weekly');

  useEffect(() => {
    fetch('http://localhost:5000/api/providers/me/earnings', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.earnings) {
          setData(data.earnings);
        } else {
          throw new Error('Failed');
        }
      })
      .catch(() => {
        setData({
          totalEarnings: 0, platformFees: 0, netEarnings: 0, availableBalance: 0,
          weekly: [], monthly: [], transactions: [],
          bankDetails: { accountNumber: 'Not set', bankName: 'Not set', ifsc: '' }
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleWithdraw = () => {
    if (!withdrawAmount || parseInt(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (parseInt(withdrawAmount) > data.availableBalance) {
      toast.error('Insufficient balance');
      return;
    }
    toast.success(`₹${withdrawAmount} withdrawal initiated!`);
    setWithdrawAmount('');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  const chartData = chartView === 'weekly' ? data.weekly : data.monthly;
  const maxVal = Math.max(...chartData.map(d => d.earnings || d.earnings));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-500 text-sm mt-1">Track your income and manage withdrawals</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <EarningCard title="Total Earnings" value={`₹${data.totalEarnings.toLocaleString()}`} icon="💰" color="primary" index={0} />
        <EarningCard title="Platform Fees" value={`₹${data.platformFees.toLocaleString()}`} icon="🏢" color="secondary" index={1} />
        <EarningCard title="Net Earnings" value={`₹${data.netEarnings.toLocaleString()}`} icon="💵" color="success" index={2} />
        <EarningCard title="Available Balance" value={`₹${data.availableBalance.toLocaleString()}`} icon="🏦" color="info" index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-900">Earnings Overview</h2>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {['weekly', 'monthly'].map((view) => (
                <button
                  key={view}
                  onClick={() => setChartView(view)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all
                            ${chartView === view ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="flex items-end gap-3 h-48">
            {chartData.map((item, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${(item.earnings / maxVal) * 100}%` }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <span className="text-xs font-semibold text-gray-600">₹{(item.earnings / 1000).toFixed(1)}k</span>
                <div className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg flex-1 min-h-[4px]
                             hover:from-primary-700 hover:to-primary-500 transition-colors cursor-pointer" />
                <span className="text-xs text-gray-400">{item.week || item.month}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Withdraw */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaWallet className="text-primary-500" /> Withdraw
          </h2>

          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-4 text-white mb-4">
            <p className="text-sm text-primary-200">Available Balance</p>
            <p className="text-2xl font-bold mt-1">₹{data.availableBalance.toLocaleString()}</p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                className="input-field pl-9"
              />
            </div>
            <button onClick={handleWithdraw} className="btn-primary w-full">Withdraw</button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 text-sm">
              <FaUniversity className="text-gray-400" />
              <div>
                <p className="font-medium text-gray-700">{data.bankDetails.bankName}</p>
                <p className="text-xs text-gray-400">A/C: {data.bankDetails.accountNumber}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transactions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Booking</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Fee</th>
                <th className="px-6 py-3">Net</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((txn) => (
                <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="table-cell font-medium">#{txn.bookingId}</td>
                  <td className="table-cell">₹{txn.amount}</td>
                  <td className="table-cell text-red-500">-₹{txn.fee}</td>
                  <td className="table-cell font-semibold text-emerald-600">₹{txn.net}</td>
                  <td className="table-cell">{txn.date}</td>
                  <td className="table-cell">
                    <span className={`badge ${txn.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                      {txn.status}
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

export default ProviderEarnings;
