import { API_BASE_URL, getHeaders, handleResponse } from './config';

/**
 * Khởi tạo thanh toán và lấy payment URL từ payment gateway
 * 
 * @param {string} orderId - ID của order cần thanh toán
 * @param {string} returnUrl - URL để payment gateway redirect về sau khi thanh toán
 * @param {string} cancelUrl - URL khi user cancel (optional)
 * @param {string} paymentMethod - Payment method: "VNPAY" | "PAYOS" (default: "PAYOS")
 * @returns {Promise<Object>} { payment_url, transaction_id, expires_at, ... }
 */
export const initiatePayment = async (orderId, returnUrl, cancelUrl = null, paymentMethod = 'PAYOS') => {
  const payload = {
    payment_method: paymentMethod,
    return_url: returnUrl,
  };
  
  // Only include cancel_url if provided (theo Backend doc: cancel_url là OPTIONAL)
  if (cancelUrl) {
    payload.cancel_url = cancelUrl;
  }
  
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment/initiate`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(payload),
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

/**
 * Confirm PayOS payment (sau khi return từ PayOS)
 * 
 * @param {number} orderCode - Order code từ PayOS return URL
 * @returns {Promise<Object>} { success: boolean, message: string, order_id?: string }
 */
export const confirmPayOSPayment = async (orderCode) => {
  const response = await fetch(`${API_BASE_URL}/payment/payos/confirm`, {
    method: 'POST',
    headers: getHeaders(false), // Public endpoint - không cần auth
    body: JSON.stringify({ orderCode }),
  });
  
  return handleResponse(response);
};
