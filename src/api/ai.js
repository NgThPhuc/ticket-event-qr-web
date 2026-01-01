import { API_BASE_URL, getHeaders, handleResponse } from './config';

/**
 * Gửi tin nhắn chat đến AI
 * @param {Object} data - Chat request data
 * @param {string} data.message - Tin nhắn từ người dùng (required)
 * @param {string} [data.event_id] - ID sự kiện để lấy context (optional)
 * @param {string} [data.order_id] - ID đơn hàng để lấy context (optional)
 * @returns {Promise<Object>} { response: string, context?: { event?, order? } }
 */
export const chat = async (data) => {
  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: getHeaders(false), // Public endpoint - không cần auth
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

/**
 * Kiểm tra trạng thái AI service
 * @returns {Promise<Object>} { available: boolean, model: string }
 */
export const checkStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/ai/status`, {
    method: 'GET',
    headers: getHeaders(false),
  });

  return handleResponse(response);
};
