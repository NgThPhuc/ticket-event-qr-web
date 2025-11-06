import { API_BASE_URL, API_ENDPOINTS, getHeaders, handleResponse } from './config';

/**
 * Đăng ký tài khoản mới
 * @param {Object} data - { full_name, email, password }
 * @returns {Promise}
 */
export const register = async (data) => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

/**
 * Xác thực OTP
 * @param {Object} data - { email, otp_code }
 * @returns {Promise}
 */
export const verifyOTP = async (data) => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.VERIFY_OTP}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

/**
 * Đăng nhập
 * @param {Object} data - { email, password }
 * @returns {Promise} - { message, access_token, user }
 */
export const login = async (data) => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const result = await handleResponse(response);
  
  // Lưu token vào localStorage
  if (result.access_token) {
    localStorage.setItem('access_token', result.access_token);
    if (result.user) {
      localStorage.setItem('user', JSON.stringify(result.user));
    }
  }

  return result;
};

/**
 * Đăng nhập bằng Google
 * Redirect đến Google OAuth
 */
export const loginWithGoogle = () => {
  window.location.href = `${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE}`;
};

/**
 * Quên mật khẩu
 * @param {Object} data - { email }
 * @returns {Promise}
 */
export const forgotPassword = async (data) => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

/**
 * Đặt lại mật khẩu
 * @param {Object} data - { token, new_password, confirm_new_password }
 * @returns {Promise}
 */
export const resetPassword = async (data) => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

/**
 * Lấy thông tin profile
 * @returns {Promise}
 */
export const getProfile = async () => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.PROFILE}`, {
    method: 'GET',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};

/**
 * Đăng xuất
 * @returns {Promise}
 */
export const logout = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, {
      method: 'POST',
      headers: getHeaders(true),
    });

    await handleResponse(response);
  } catch (error) {
    // Nếu có lỗi vẫn xóa token local
    console.error('Logout error:', error);
  } finally {
    // Xóa token và user khỏi localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }
};

/**
 * Kiểm tra xem user đã đăng nhập chưa
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

/**
 * Lấy token hiện tại
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Lấy thông tin user hiện tại
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

