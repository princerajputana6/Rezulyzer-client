import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Mail, Lock, Brain } from 'lucide-react';
import { loginStart, loginSuccess, loginFailure } from '../../redux/slices/authSlice';
import { showToast } from '../../redux/slices/toastSlice';
import authService from '../../services/authService';
import PasswordResetModal from '../../components/PasswordResetModal';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Debug modal state
  console.log('Modal state - showPasswordResetModal:', showPasswordResetModal, 'userEmail:', userEmail);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    dispatch(loginStart());

    try {
      console.log('Sending login request with:', formData);
      const response = await authService.login(formData);
      console.log('Full Login Response:', response);
      
      if (response.success) {
        // Extract data from response structure
        const { user, accessToken, refreshToken, passwordResetRequired } = response.data;
        
        // Set auth state for all successful logins
        dispatch(loginSuccess({
          user: user,
          token: accessToken,
        }));

        // Check if password reset is required (for companies)
        if (passwordResetRequired) {
          console.log('Password reset required, navigating to dashboard with flag');
          
          dispatch(showToast({
            message: 'First-time login detected. Please reset your password.',
            type: 'info',
          }));
          
          // Navigate to dashboard with password reset flag
          navigate('/dashboard', { 
            replace: true, 
            state: { passwordResetRequired: true, userEmail: user.email } 
          });
        } else {
          dispatch(showToast({
            message: 'Login successful! Welcome back.',
            type: 'success',
          }));
          
          // Navigate based on user role
          console.log('Navigating to dashboard for user:', user);
          navigate('/dashboard', { replace: true });
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.log('Login Error:', error);
      console.log('Error Response:', error.response);
      const message = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      dispatch(loginFailure(message));
      dispatch(showToast({
        message,
        type: 'error',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your AI Testing Portal account
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input pl-10 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full btn-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Sign up link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Admin:</strong> admin@example.com / password123</p>
            <p><strong>User:</strong> user@example.com / password123</p>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordResetModal && (
        <PasswordResetModal
          isOpen={showPasswordResetModal}
          onClose={() => setShowPasswordResetModal(false)}
          userEmail={userEmail}
        />
      )}
    </div>
  );
};

export default LoginPage;
