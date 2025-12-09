import { API_BASE_URL, getHeaders, handleResponse } from "./config";

/**
 * Tạo ticket type mới cho event
 * @param {string} eventId - ID của event
 * @param {Object} data - Ticket type data
 * @param {string} data.name - Tên loại vé (Required, 3-100 chars)
 * @param {string} [data.description] - Mô tả (Optional, max 500 chars)
 * @param {boolean} [data.is_free] - Vé miễn phí (default: false)
 * @param {boolean} [data.is_donation] - Vé theo donation (default: false)
 * @param {number} [data.price] - Giá vé (Required nếu không free/donation)
 * @param {string} [data.currency] - Đơn vị tiền tệ (default: VND)
 * @param {number} data.quantity_total - Tổng số lượng vé (Required)
 * @param {number} [data.per_order_min] - Số lượng tối thiểu mỗi đơn (default: 1)
 * @param {number} [data.per_order_max] - Số lượng tối đa mỗi đơn (default: 10)
 * @param {string} data.sale_start_at - Thời gian bắt đầu bán (ISO 8601)
 * @param {string} data.sale_end_at - Thời gian kết thúc bán (ISO 8601)
 * @param {string} [data.refund_policy_deadline] - Deadline hoàn tiền (ISO 8601)
 * @returns {Promise<Object>} Ticket type object
 *
 * @example
 * const ticketType = await createTicketType('event-uuid', {
 *   name: 'VIP',
 *   description: 'VIP seats in front row',
 *   price: 500000,
 *   currency: 'VND',
 *   quantity_total: 100,
 *   per_order_max: 5,
 *   sale_start_at: '2024-01-01T00:00:00Z',
 *   sale_end_at: '2024-12-24T23:59:59Z'
 * });
 */
export const createTicketType = async (eventId, data) => {
  const response = await fetch(
    `${API_BASE_URL}/events/${eventId}/ticket-types`,
    {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    }
  );

  return handleResponse(response);
};

/**
 * Lấy danh sách ticket types của event
 * @param {string} eventId - ID của event
 * @param {Object} [params] - Query parameters
 * @param {boolean} [params.only_on_sale_now] - Chỉ lấy tickets đang bán (hiện tại) (default: false)
 * @param {boolean} [params.include_inactive] - Bao gồm ticket types inactive (default: false)
 * @returns {Promise<Array>} Danh sách ticket types
 *
 * @example
 * // Lấy tất cả ticket types
 * const allTickets = await getTicketTypes('event-uuid');
 *
 * // Chỉ lấy tickets đang bán ngay bây giờ
 * const onSaleTickets = await getTicketTypes('event-uuid', { only_on_sale_now: true });
 *
 * // Bao gồm cả tickets inactive (cho admin)
 * const allIncludingInactive = await getTicketTypes('event-uuid', { include_inactive: true });
 */
export const getTicketTypes = async (eventId, params = {}) => {
  const queryString = new URLSearchParams();

  Object.keys(params).forEach((key) => {
    if (
      params[key] !== undefined &&
      params[key] !== null &&
      params[key] !== ""
    ) {
      queryString.append(key, params[key]);
    }
  });

  const url = `${API_BASE_URL}/events/${eventId}/ticket-types${
    queryString.toString() ? `?${queryString.toString()}` : ""
  }`;

  // Gửi token nếu có, nhưng vẫn cho phép public access
  const token = localStorage.getItem('access_token');
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(!!token), // Gửi auth nếu có token
  });

  return handleResponse(response);
};

/**
 * Lấy chi tiết ticket type theo ID
 * @param {string} eventId - ID của event
 * @param {string} id - ID của ticket type
 * @returns {Promise<Object>} Ticket type object với thông tin đầy đủ
 *
 * @example
 * const ticketType = await getTicketTypeById('event-uuid', 'ticket-type-uuid');
 */
export const getTicketTypeById = async (eventId, id) => {
  const response = await fetch(
    `${API_BASE_URL}/events/${eventId}/ticket-types/${id}`,
    {
      method: "GET",
      headers: getHeaders(true),
    }
  );

  return handleResponse(response);
};

/**
 * Cập nhật ticket type (partial update)
 * @param {string} eventId - ID của event
 * @param {string} id - ID của ticket type
 * @param {Object} data - Dữ liệu cần cập nhật (tất cả fields đều optional)
 * @returns {Promise<Object>} Ticket type object đã được cập nhật
 *
 * @example
 * await updateTicketType('event-uuid', 'ticket-type-uuid', {
 *   quantity_total: 150
 * });
 */
export const updateTicketType = async (eventId, id, data) => {
  const response = await fetch(
    `${API_BASE_URL}/events/${eventId}/ticket-types/${id}`,
    {
      method: "PATCH",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    }
  );

  return handleResponse(response);
};

/**
 * Disable ticket type (ngừng bán vé)
 * @param {string} eventId - ID của event
 * @param {string} id - ID của ticket type
 * @param {string} [reason] - Lý do disable (optional)
 * @returns {Promise<Object>} Response với status
 *
 * @example
 * await disableTicketType('event-uuid', 'ticket-type-uuid', 'Sold out early');
 */
export const disableTicketType = async (eventId, id, reason = "") => {
  const response = await fetch(
    `${API_BASE_URL}/events/${eventId}/ticket-types/${id}/disable`,
    {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify({ reason }),
    }
  );

  return handleResponse(response);
};

/**
 * Xóa ticket type
 * @param {string} eventId - ID của event
 * @param {string} id - ID của ticket type
 * @returns {Promise<null>} 204 No Content
 *
 * @example
 * await deleteTicketType('event-uuid', 'ticket-type-uuid');
 */
export const deleteTicketType = async (eventId, id) => {
  const response = await fetch(
    `${API_BASE_URL}/events/${eventId}/ticket-types/${id}`,
    {
      method: "DELETE",
      headers: getHeaders(true),
    }
  );

  if (response.status === 204) {
    return null; // No content
  }

  return handleResponse(response);
};
