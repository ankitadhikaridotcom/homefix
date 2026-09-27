import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTimes, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ links, title, isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-100 z-50
                   transform transition-transform duration-300 ease-in-out
                   lg:translate-x-0 lg:static lg:z-auto
                   ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            >
              <span className="text-xl">🏠</span>
              <span className="font-bold text-gray-900">
                Home<span className="text-primary-600">Fix</span>
                <span className="text-xs text-gray-400 block -mt-0.5">{title}</span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaTimes className="text-gray-500 text-sm" />
            </button>
          </div>

          {/* User info */}
          {user && (
            <div className="p-4 mx-3 mt-3 bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-xl">
              <div className="flex items-center gap-3">
                {user?.profileImage || user?.avatar ? (
                  <img
                    src={user.profileImage || user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center ring-2 ring-white text-primary-600 font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-primary-600 capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
            {links.map((link, index) => (
              <NavLink
                key={index}
                to={link.to}
                end={link.end}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive ? 'sidebar-link-active' : 'sidebar-link'
                }
              >
                <link.icon className="text-lg flex-shrink-0" />
                <span className="text-sm">{link.label}</span>
                {link.badge && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="sidebar-link text-red-500 hover:bg-red-50 hover:text-red-600 w-full"
            >
              <FaSignOutAlt className="text-lg" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
