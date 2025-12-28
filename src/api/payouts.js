import { API_BASE_URL, getHeaders, handleResponse } from './config';

// ==========================================
// PAYOUT API - Manual Payout System
// ==========================================

// =====================
// Organizer Endpoints
// =====================

/**
 * Lấy số dư của organization
 * @param {string} organizationId
 * @returns {Promise<Object>} Balance info
 */
export const getOrganizationBalance = async (organizationId) => {
    const response = await fetch(
        `${API_BASE_URL}/payouts/organizations/${organizationId}/balance`,
        {
            method: 'GET',
            headers: getHeaders(true),
        }
    );
    return handleResponse(response);
};

/**
 * Tạo yêu cầu rút tiền
 * @param {string} organizationId
 * @param {number} [amount] - Số tiền rút (optional, nếu không truyền sẽ rút hết available_balance)
 * @returns {Promise<Object>} Payout request info
 */
export const requestPayout = async (organizationId, amount) => {
    const body = amount ? { amount } : {};
    const response = await fetch(
        `${API_BASE_URL}/payouts/organizations/${organizationId}/request`,
        {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(body),
        }
    );
    return handleResponse(response);
};

/**
 * Lấy lịch sử payout của organization
 * @param {string} organizationId
 * @returns {Promise<Array>} List of payouts
 */
export const getOrganizationPayouts = async (organizationId) => {
    const response = await fetch(
        `${API_BASE_URL}/payouts/organizations/${organizationId}`,
        {
            method: 'GET',
            headers: getHeaders(true),
        }
    );
    return handleResponse(response);
};

// =====================
// Admin Endpoints (PLATFORM_ADMIN only)
// =====================

/**
 * Lấy danh sách tất cả payouts (Admin)
 * @param {Object} params - Query parameters
 * @param {string} [params.status] - Filter by status: PENDING, PROCESSING, COMPLETED, FAILED
 * @param {number} [params.page] - Trang hiện tại (default: 1)
 * @param {number} [params.limit] - Số items mỗi trang (default: 20)
 * @returns {Promise<Object>} { data: [], meta: { total, page, limit, total_pages } }
 */
export const getAllPayouts = async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/payouts${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(true),
    });
    return handleResponse(response);
};

/**
 * Lấy chi tiết một payout (Admin)
 * @param {string} payoutId
 * @returns {Promise<Object>} Payout details
 */
export const getPayoutById = async (payoutId) => {
    const response = await fetch(`${API_BASE_URL}/payouts/${payoutId}`, {
        method: 'GET',
        headers: getHeaders(true),
    });
    return handleResponse(response);
};

/**
 * Admin xử lý thanh toán (chuyển tiền cho organization)
 * ⚠️ Lưu ý: API này có delay ~2 giây do gọi Mock Bank
 * @param {string} payoutId
 * @returns {Promise<Object>} { message, payout_id, transaction_code, amount, processed_at }
 */
export const processPayout = async (payoutId) => {
    const response = await fetch(`${API_BASE_URL}/payouts/${payoutId}/process`, {
        method: 'POST',
        headers: getHeaders(true),
    });
    return handleResponse(response);
};

/**
 * Trigger mature revenue shares thủ công (dev/testing)
 * @returns {Promise<Object>} { matured: number }
 */
export const matureShares = async () => {
    const response = await fetch(`${API_BASE_URL}/payouts/mature-shares`, {
        method: 'POST',
        headers: getHeaders(true),
    });
    return handleResponse(response);
};

/**
 * Bật/tắt payout cho organization (PLATFORM_ADMIN)
 * PUT /organizations/:id/payout/status
 * @param {string} organizationId
 * @param {boolean} payoutEnabled
 * @returns {Promise<Object>}
 */
export const updateOrganizationPayoutStatus = async (organizationId, payoutEnabled) => {
    const response = await fetch(
        `${API_BASE_URL}/organizations/${organizationId}/payout/status`,
        {
            method: 'PUT',
            headers: getHeaders(true),
            body: JSON.stringify({ payout_enabled: payoutEnabled }),
        }
    );
    return handleResponse(response);
};
