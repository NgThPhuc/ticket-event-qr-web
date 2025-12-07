import { getBaseURL, getHeaders, handleResponse } from './config';

const API_BASE_URL = getBaseURL();

/**
 * Khởi tạo thanh toán và lấy payment URL từ VNPAY
 * 
 * @param {string} orderId - ID của order cần thanh toán
 * @param {string} returnUrl - URL để VNPAY redirect về sau khi thanh toán
 * @param {string} cancelUrl - URL khi user cancel (optional)
 * @returns {Promise<Object>} { payment_url, transaction_id, expires_at, ... }
 */
export const initiatePayment = async (orderId, returnUrl, cancelUrl = null) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment/initiate`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({
      payment_method: 'VNPAY',
      return_url: returnUrl,
      cancel_url: cancelUrl
    }),
  });
  
  return handleResponse(response);
};

/**
 * Kiểm tra trạng thái thanh toán của order
 * 
 * @param {string} orderId - ID của order cần check
 * @returns {Promise<Object>} { payment_status, transaction_id, paid_at, gateway_response }
 */
export const checkPaymentStatus = async (orderId) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment/status`, {
    method: 'GET',
    headers: getHeaders(true),
  });
  
  return handleResponse(response);
};
