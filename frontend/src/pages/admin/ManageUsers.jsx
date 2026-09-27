import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaEye, FaBan, FaTrash, FaUserCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';
// TODO: Replace with API call to fetch users from backend

const ManageUsers = () => {
  const [userList, setUserList] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = userList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleBlock = (id) => {
    setUserList(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'blocked' ? 'active' : 'blocked' } : u));
    toast.success('User status updated');
  };

  const handleDelete = (id) => {
    setUserList(prev => prev.filter(u => u.id !== id));
    toast.success('User deleted');
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manage Users</h1>
        <p className="text-gray-500 text-sm mt-1">{userList.length} registered users</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="input-field pl-11 !py-2.5" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field !w-auto !py-2.5 text-sm">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Bookings</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                >
                  <td className="table-cell text-gray-400">{i + 1}</td>
                  <td className="table-cell">
                    <div>
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </td>
                  <td className="table-cell">{u.phone}</td>
                  <td className="table-cell"><span className="badge-primary capitalize">{u.role}</span></td>
                  <td className="table-cell">{u.joinedDate}</td>
                  <td className="table-cell">{u.bookings}</td>
                  <td className="table-cell">
                    <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{u.status}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button className="p-2 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors" title="View"><FaEye className="text-sm" /></button>
                      <button onClick={() => handleBlock(u.id)} className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Block/Unblock">
                        {u.status === 'blocked' ? <FaUserCheck className="text-sm" /> : <FaBan className="text-sm" />}
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors" title="Delete"><FaTrash className="text-sm" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl">🔍</span>
            <p className="text-gray-500 mt-3">No users found matching your search</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ManageUsers;
