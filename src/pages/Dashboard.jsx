import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Alert from '../components/ui/Alert';
import { getMyOrganizations } from '../api/organizations';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState(null);

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const data = await getMyOrganizations();
        // Log để debug - xem cấu trúc response
        console.log('Organizations response:', data);
        // Đảm bảo mỗi org có organization_id đúng
        // API có thể trả về id là member.id, nên cần dùng organization_id
        const processedData = (data || []).map((org) => {
          // Luôn ưu tiên dùng organization_id nếu có
          // Nếu không có organization_id, có thể id là organization.id (cần kiểm tra)
          const orgId = org.organization_id || org.id;
          console.log('Processing org:', {
            id: org.id,
            organization_id: org.organization_id,
            using: orgId,
            name: org.name
          });
          return {
            ...org,
            // Lưu organization_id thực tế để dùng sau
            _organizationId: orgId,
          };
        });
        setOrganizations(processedData);
      } catch (err) {
        setError(err.message || t('organization.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrganizations();
    }
  }, [isAuthenticated, t]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {t('dashboard.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('dashboard.subtitle')}
            </p>
          </div>

          {error && (
            <Alert type="error" className="mb-6">
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          ) : organizations.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('dashboard.noOrganizations')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('dashboard.noOrganizationsDescription')}
              </p>
              <button
                onClick={() => navigate('/create-organization')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                {t('dashboard.createOrganization')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizations.map((org) => {
                // Đảm bảo dùng đúng organization ID
                // Ưu tiên dùng organization_id (nếu có), nếu không thì dùng _organizationId đã xử lý
                const orgId = org.organization_id || org._organizationId || org.id;
                console.log('Using orgId:', orgId, 'from org:', org);
                return (
                <div
                  key={orgId}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-200"
                >
                  {org.logo_url && (
                    <img
                      src={org.logo_url}
                      alt={org.name}
                      className="w-16 h-16 rounded-lg mb-4 object-cover"
                    />
                  )}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {org.name}
                  </h3>
                  {org.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {org.description}
                    </p>
                  )}
                  <div className="space-y-2 mb-4">
                    {org.contact_email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{org.contact_email}</span>
                      </div>
                    )}
                    {org.role && (
                      <div className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                        {org.role}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/organizations/${orgId}`)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      {t('dashboard.viewDetails')}
                    </button>
                    <button
                      onClick={() => navigate(`/organizations/${orgId}/members`)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      {t('dashboard.manageMembers')}
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

