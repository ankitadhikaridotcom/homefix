import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Login = () => {
  const navigate = useNavigate();
  const { login, googleLogin, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  // If already authenticated, redirect
  if (isAuthenticated && user) {
    const role = user.role;
    if (role === 'admin') { navigate('/admin', { replace: true }); return null; }
    if (role === 'provider') { navigate('/provider', { replace: true }); return null; }
    navigate('/', { replace: true }); return null;
  }

  const redirectByRole = (role) => {
    if (role === 'admin') navigate('/admin', { replace: true });
    else if (role === 'provider') navigate('/provider', { replace: true });
    else navigate('/', { replace: true });
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await login({ email: data.email, password: data.password });
      toast.success('Welcome back! 🎉');
      redirectByRole(result?.user?.role);
    } catch (err) {
      toast.error(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const result = await googleLogin(credentialResponse.credential);
      // If the user needs to select a role (new Google user)
      if (result?.needsRole) {
        navigate('/register', { state: { googleData: result.googleData } });
        return;
      }
      toast.success('Welcome back! 🎉');
      redirectByRole(result?.user?.role);
    } catch (err) {
      toast.error(err.message || 'Google login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/" className="flex items-center gap-2 mb-8">
              <span className="text-5xl">🏠</span>
              <span className="text-3xl font-bold">Home<span className="text-secondary-400">Fix</span></span>
            </Link>
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
              Welcome back to<br />
              <span className="text-secondary-400">HomeFix</span>
            </h1>
            <p className="text-blue-100 mt-4 text-lg leading-relaxed max-w-md">
              Your trusted marketplace for home services. Book verified professionals in minutes.
            </p>

            <div className="mt-10 space-y-4">
              {[
                { num: '10K+', text: 'Happy Customers' },
                { num: '500+', text: 'Verified Professionals' },
                { num: '4.8⭐', text: 'Average Rating' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-secondary-400" />
                  <span className="font-semibold">{stat.num}</span>
                  <span className="text-blue-200">{stat.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="text-3xl">🏠</span>
              <h2 className="text-2xl font-bold text-gray-900">Home<span className="text-primary-600">Fix</span></h2>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-500 text-sm mt-1">Login to your HomeFix account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email or Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email or Phone</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    id="login-email"
                    type="text"
                    {...register('email', { required: 'Email or phone number is required.' })}
                    placeholder="Enter your email or phone"
                    className="input-field pl-11"
                    autoComplete="username"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { required: 'Password is required.' })}
                    placeholder="Enter your password"
                    className="input-field pl-11 pr-11"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Forgot Password */}
              <div className="flex items-center justify-end">
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <motion.button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Login'}
              </motion.button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              <div className="mt-6 flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    toast.error('Google Sign-In failed. Please try again.');
                  }}
                  theme="outline"
                  size="large"
                />
              </div>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
                Sign Up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
