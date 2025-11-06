// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    VERIFY_OTP: '/auth/verify-otp',
    LOGIN: '/auth/login',
    GOOGLE: '/auth/google',
    GOOGLE_CALLBACK: '/auth/google/callback',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout',
  },
};

// Helper function để tạo headers
export const getHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Helper function để xử lý response
export const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    const error = {
      message: data.message || 'Đã có lỗi xảy ra',
      status: response.status,
      errors: data.message instanceof Array ? data.message : [],
    };
    throw error;
  }

  return data;
};

