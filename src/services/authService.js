import { apiClient } from './apiClient';

class AuthService {
  // Login user
  async login(credentials) {
    console.log('AuthService: Sending login request to /auth/login with:', credentials);
    
    // Test with direct axios call to bypass interceptors
    try {
      const directResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });
      
      const directData = await directResponse.json();
      console.log('Direct fetch response:', directData);
      console.log('Direct fetch status:', directResponse.status);
      
      if (directResponse.ok && directData.success) {
        return directData;
      } else {
        throw new Error(directData.message || 'Login failed');
      }
    } catch (fetchError) {
      console.log('Direct fetch failed, trying apiClient:', fetchError);
      
      // Fallback to apiClient
      const response = await apiClient.post('/auth/login', credentials);
      console.log('AuthService: Raw response from server:', response);
      console.log('AuthService: Response data:', response.data);
      return response.data;
    }
  }

  // Register user
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  }

  // Logout user
  async logout() {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }

  // Get current user
  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }

  // Refresh token
  async refreshToken() {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  }

  // Forgot password
  async forgotPassword(email) {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  }

  // Reset password
  async resetPassword(token, password) {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data;
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }

  // Verify email
  async verifyEmail(token) {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
  }

  // Resend verification email
  async resendVerification() {
    const response = await apiClient.post('/auth/resend-verification');
    return response.data;
  }
}

export default new AuthService();
