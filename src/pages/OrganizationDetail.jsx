import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import { getOrganization, updateOrganization, deleteOrganization } from '../api/organizations';

const OrganizationDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { organizationId } = useParams();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchOrganization = async () => {
      try {
        setLoading(true);
        const data = await getOrganization(organizationId);
        setOrganization(data);
      } catch (err) {
        setError(err.message || t('organization.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [organizationId, isAuthenticated, navigate, t]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteOrganization(organizationId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || t('organization.deleteError'));
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Alert type="error">{error}</Alert>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('common.back')}
            </button>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {organization?.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('organization.detailSubtitle')}
            </p>
          </div>

          {error && (
            <Alert type="error" className="mb-6">
              {error}
            </Alert>
          )}

          {organization && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {organization.logo_url && (
                  <div className="md:col-span-2">
                    <img
                      src={organization.logo_url}
                      alt={organization.name}
                      className="w-32 h-32 rounded-lg object-cover"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('organization.name')}
                  </label>
                  <p className="text-gray-900 dark:text-white">{organization.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('organization.slug')}
                  </label>
                  <p className="text-gray-900 dark:text-white">{organization.slug}</p>
                </div>

                {organization.description && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('organization.description')}
                    </label>
                    <p className="text-gray-900 dark:text-white">{organization.description}</p>
                  </div>
                )}

                {organization.contact_email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('organization.contactEmail')}
                    </label>
                    <p className="text-gray-900 dark:text-white">{organization.contact_email}</p>
                  </div>
                )}

                {organization.contact_phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('organization.contactPhone')}
                    </label>
                    <p className="text-gray-900 dark:text-white">{organization.contact_phone}</p>
                  </div>
                )}

                {organization.address && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('organization.address')}
                    </label>
                    <p className="text-gray-900 dark:text-white">{organization.address}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('organization.status')}
                  </label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    organization.is_active
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}>
                    {organization.is_active ? t('organization.active') : t('organization.inactive')}
                  </span>
                </div>

                {organization.owner && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('organization.owner')}
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {organization.owner.full_name} ({organization.owner.email})
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => navigate(`/organizations/${organizationId}/members`)}
                  className="flex-1"
                >
                  {t('organization.manageMembers')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/organizations/${organizationId}/edit`)}
                  className="flex-1"
                >
                  {t('organization.edit')}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1"
                >
                  {t('organization.delete')}
                </Button>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {t('organization.deleteConfirmTitle')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t('organization.deleteConfirmMessage')}
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                    disabled={deleting}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    loading={deleting}
                    className="flex-1"
                  >
                    {t('organization.deleteConfirm')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationDetail;

