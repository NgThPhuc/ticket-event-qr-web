import { API_BASE_URL, getHeaders, handleResponse } from './config';

/**
 * Tạo đơn hàng mới (Booking)
 * @param {Object} data - Order data
 * @param {string} token - Access token (optional, will use localStorage if not provided)
 * @returns {Promise}
 */
export const createOrder = async (data) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

/**
 * Lấy danh sách đơn hàng của tôi
 * @param {Object} params - Query parameters { page, limit, status, payment_status, event_id }
 * @returns {Promise}
 */
export const getMyOrders = async (params = {}) => {
  const queryString = new URLSearchParams();
  
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryString.append(key, params[key]);
    }
  });

  const url = `${API_BASE_URL}/orders${queryString.toString() ? `?${queryString.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};

/**
 * Lấy chi tiết đơn hàng theo ID
 * @param {string} orderId - Order ID
 * @returns {Promise}
 */
export const getOrderById = async (orderId) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    method: 'GET',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};

/**
 * Tracking đơn hàng theo order number (Public - không cần login)
 * @param {string} orderNumber - Order number (e.g., ORD-1706150000-ABC123456)
 * @returns {Promise}
 */
export const trackOrder = async (orderNumber) => {
  const response = await fetch(`${API_BASE_URL}/orders/order-number/${orderNumber}`, {
    method: 'GET',
    headers: getHeaders(false), // Public endpoint - không cần auth
  });

  return handleResponse(response);
};

/**
 * Hủy đơn hàng
 * @param {string} orderId - Order ID
 * @returns {Promise}
 */
export const cancelOrder = async (orderId) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};
