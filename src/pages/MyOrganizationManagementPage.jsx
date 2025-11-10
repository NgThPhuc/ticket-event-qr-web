import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { getMyOrganizations } from '../api/organizations';
import { Users, Eye, Calendar, Mail, Phone, MapPin, Building2 } from 'lucide-react';

const MyOrganizationManagementPage = () => {
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
      setOrganizations(data || []);
    } catch (err) {
      setError(err.message || t('organization.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      'ORGANIZER_ADMIN': 'ORGANIZER_ADMIN',
      'EVENT_MANAGER': 'Event Manager',
      'CHECKIN_STAFF': 'Check-in Staff',
    };
    return roleMap[role] || role;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            {t('organization.overview') || 'Organization Overview'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('organization.overviewSubtitle') ||
              'Xem tổng quan các tổ chức bạn đang tham gia và quản lý.'}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {t('common.loading')}
            </p>
          </div>
        ) : organizations.length === 0 ? (
          <div className="bg-white dark:bg-gray-900/70 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-950 mb-4">
              <Building2 className="h-7 w-7 text-blue-600 dark:text-blue-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('organization.noOrganizations') || 'Chưa có tổ chức nào'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {t('organization.noOrganizationsDescription') ||
                'Bạn chưa tham gia tổ chức nào. Hãy tạo hoặc tham gia một tổ chức để bắt đầu quản lý sự kiện.'}
            </p>
            <Button onClick={() => navigate('/create-organization')}>
              {t('organization.create') || 'Tạo tổ chức'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {organizations.map((item) => {
              const org = item.organization || {};
              const orgId = org.id || item.organization_id;
              const memberCount = org._count?.members || 0;

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-900/70 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
                >
                  {/* Top gradient strip */}
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                  <div className="p-6 md:p-8">
                    {/* Header: logo + name + badges */}
                    <div className="flex flex-col md:flex-row md:items-start gap-4 mb-6">
                      {org.logo_url ? (
                        <img
                          src={org.logo_url}
                          alt={org.name}
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950 flex-shrink-0">
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                            {org.name?.charAt(0)?.toUpperCase() || 'O'}
                          </span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                              {org.name || '-'}
                            </h3>
                            {org.slug && (
                              <p className="text-xs font-mono text-gray-500 dark:text-gray-500 mt-1">
                                slug: <span className="font-semibold">{org.slug}</span>
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-200">
                              {getRoleLabel(item.role)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                              <Users className="h-3 w-3" />
                              {memberCount} {memberCount === 1 ? 'member' : 'members'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {org.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-5 leading-relaxed">
                        {org.description}
                      </p>
                    )}

                    {/* Info blocks */}
                    <div className="grid gap-4 md:grid-cols-2 mb-6">
                      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        {org.contact_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{org.contact_email}</span>
                          </div>
                        )}
                        {org.contact_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{org.contact_phone}</span>
                          </div>
                        )}
                        {org.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{org.address}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        {org.owner && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {t('organization.owner') || 'Owner'}:
                            </span>
                            <span>{org.owner.full_name || org.owner.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            {t('organization.joinedAt') || 'Tham gia'}:{' '}
                            {formatDate(item.joined_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            ID: {orgId}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col md:flex-row gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 justify-center"
                        onClick={() => navigate(`/organizations/${orgId}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {t('dashboard.viewDetails') || 'View Details'}
                      </Button>
                      <Button
                        className="flex-1 justify-center"
                        onClick={() => navigate(`/organizations/${orgId}/members`)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {t('dashboard.manageMembers') || 'Manage Members'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );

};

export default MyOrganizationManagementPage;
