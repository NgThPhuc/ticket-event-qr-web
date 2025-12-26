// ==========================================
// PAYOUT API - COMMENTED OUT (Manual Payout)
// Payout sẽ được thực hiện thủ công nên tạm thời comment code này
// ==========================================

// import { API_BASE_URL, getHeaders, handleResponse } from './config';

// /**
//  * Bật/tắt payout cho organization (PLATFORM_ADMIN)
//  * @param {string} organizationId
//  * @param {boolean} payoutEnabled
//  * @returns {Promise<Object>}
//  */
// export const updateOrganizationPayoutStatus = async (organizationId, payoutEnabled) => {
//   const response = await fetch(
//     `${API_BASE_URL}/payouts/organizations/${organizationId}/status`,
//     {
//       method: 'POST',
//       headers: getHeaders(true),
//       body: JSON.stringify({ payout_enabled: payoutEnabled }),
//     }
//   );

//   return handleResponse(response);
// };

// /**
//  * Chạy payout cycle thủ công (PLATFORM_ADMIN)
//  * @returns {Promise<{ matured: number; paid_out: number; skipped: Array<any> }>}
//  */
// export const runPayoutCycle = async () => {
//   const response = await fetch(`${API_BASE_URL}/payouts/run`, {
//     method: 'POST',
//     headers: getHeaders(true),
//   });

//   return handleResponse(response);
// };


