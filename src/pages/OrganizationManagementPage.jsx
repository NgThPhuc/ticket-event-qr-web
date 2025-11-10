import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OrganizationsDataTable } from '../components/OrganizationsDataTable';
import { getMyOrganizations } from '../api/organizations';

const OrganizationManagementPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchOrganizations();
  }, [isAuthenticated, navigate]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyOrganizations();
      const processedData = (data || []).map((org) => {
        const orgId = org.organization_id || org.id;
        return {
          ...org,
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('organization.management') || 'Organization Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('organization.managementSubtitle') || 'Manage your organizations'}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          ) : (
            <OrganizationsDataTable
              organizations={organizations}
              t={t}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationManagementPage;