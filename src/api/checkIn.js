import { API_BASE_URL, getHeaders, handleResponse } from './config';

/**
 * Quét mã QR để check-in
 * @param {string} qr_payload - Nội dung quét được từ QR code
 * @param {string} gate - Tên cổng check-in (optional)
 * @param {string} device_id - ID thiết bị quét (optional)
 * @returns {Promise} - { valid, ticket, message, reason? }
 */
export const scanQRCode = async (qr_payload, gate = null, device_id = null) => {
  const body = {
    qr_payload,
  };

  if (gate) {
    body.gate = gate;
  }

  if (device_id) {
    body.device_id = device_id;
  }

  const response = await fetch(`${API_BASE_URL}/check-in/scan`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(body),
  });

  return handleResponse(response);
};

/**
 * Lấy thống kê check-in của một sự kiện
 * @param {string} eventId - ID của sự kiện
 * @returns {Promise} - { total_issued, checked_in, not_checked_in, revoked_count, refunded_count, last_check_in_at }
 */
export const getCheckInStats = async (eventId) => {
  const response = await fetch(`${API_BASE_URL}/check-in/events/${eventId}/stats`, {
    method: 'GET',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};

/**
 * Lấy lịch sử check-in của một sự kiện
 * @param {string} eventId - ID của sự kiện
 * @param {Object} params - Query parameters
 * @param {number} params.page - Trang hiện tại (default: 1)
 * @param {number} params.limit - Số record mỗi trang (default: 20, max: 100)
 * @param {string} params.gate - Lọc theo cổng check-in
 * @param {string} params.from_date - Lọc từ ngày (ISO8601)
 * @param {string} params.to_date - Lọc đến ngày (ISO8601)
 * @param {string} params.search - Tìm theo tên hoặc ticket_serial
 * @param {string} params.sort_by - Sắp xếp theo: checked_in_at, attendee_name, ticket_serial
 * @param {string} params.sort_order - Thứ tự: asc hoặc desc
 * @returns {Promise} - { data, meta, filters }
 */
export const getCheckInHistory = async (eventId, params = {}) => {
  const queryString = new URLSearchParams();

  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryString.append(key, params[key]);
    }
  });

  const url = `${API_BASE_URL}/check-in/events/${eventId}/history${queryString.toString() ? `?${queryString.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(true),
  });

  return handleResponse(response);
};
