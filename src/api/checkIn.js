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

/**
 * Lấy thống kê check-in theo giờ
 * @param {string} eventId - ID của sự kiện
 * @param {string} date - Ngày cần xem (ISO format), mặc định là hôm nay
 * @returns {Promise} - { date, hourly_data, peak_hour, peak_count, total_scans, total_success }
 */
export const getHourlyStats = async (eventId, date = null) => {
    const queryString = new URLSearchParams();
    if (date) {
        queryString.append('date', date);
    }

    const url = `${API_BASE_URL}/check-in/events/${eventId}/stats/hourly${queryString.toString() ? `?${queryString.toString()}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(true),
    });

    return handleResponse(response);
};

/**
 * Lấy thống kê check-in theo cổng
 * @param {string} eventId - ID của sự kiện
 * @returns {Promise} - { gates: [...], total }
 */
export const getGateStats = async (eventId) => {
    const response = await fetch(`${API_BASE_URL}/check-in/events/${eventId}/stats/gates`, {
        method: 'GET',
        headers: getHeaders(true),
    });

    return handleResponse(response);
};

/**
 * Lấy hiệu suất nhân viên check-in
 * @param {string} eventId - ID của sự kiện
 * @returns {Promise} - { staff: [...] }
 */
export const getStaffStats = async (eventId) => {
    const response = await fetch(`${API_BASE_URL}/check-in/events/${eventId}/stats/staff`, {
        method: 'GET',
        headers: getHeaders(true),
    });

    return handleResponse(response);
};

/**
 * Lấy chi tiết scan logs
 * @param {string} eventId - ID của sự kiện
 * @param {Object} params - Query parameters
 * @param {number} params.page - Trang hiện tại
 * @param {number} params.limit - Số record mỗi trang
 * @param {string} params.result - Filter theo kết quả (SUCCESS, ALREADY_USED, NOT_FOUND...)
 * @param {string} params.gate - Filter theo cổng
 * @param {string} params.staff_id - Filter theo nhân viên
 * @param {string} params.from_date - Từ ngày
 * @param {string} params.to_date - Đến ngày
 * @param {string} params.search - Tìm theo qr_payload hoặc ticket_serial
 * @returns {Promise} - { data, meta }
 */
export const getScanLogs = async (eventId, params = {}) => {
    const queryString = new URLSearchParams();

    Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            queryString.append(key, params[key]);
        }
    });

    const url = `${API_BASE_URL}/check-in/events/${eventId}/logs${queryString.toString() ? `?${queryString.toString()}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(true),
    });

    return handleResponse(response);
};

/**
 * Export báo cáo check-in
 * @param {string} eventId - ID của sự kiện
 * @param {string} format - Định dạng: 'csv' hoặc 'json'
 * @param {Object} params - Query parameters (from_date, to_date)
 * @returns {Promise} - Blob (csv) hoặc JSON data
 */
export const exportCheckInReport = async (eventId, format = 'csv', params = {}) => {
    const queryString = new URLSearchParams();
    queryString.append('format', format);

    Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            queryString.append(key, params[key]);
        }
    });

    const url = `${API_BASE_URL}/check-in/events/${eventId}/export?${queryString.toString()}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(true),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Export failed');
    }

    if (format === 'csv') {
        return response.blob();
    }

    return response.json();
};
