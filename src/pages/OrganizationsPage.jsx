import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMyOrganizations, getAllOrganizations } from '../api/organizations';
import OrganizationsManagement from './OrganizationsManagement';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useTranslation } from 'react-i18next';

/**
 * Component wrapper cho route /organizations
 * - PLATFORM_ADMIN: Hiển thị OrganizationsManagement (quản lý tất cả)
 * - Các role khác: Redirect đến organization đầu tiên của họ
 */
const OrganizationsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      if (authLoading || !isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        // Kiểm tra xem có phải PLATFORM_ADMIN không
        try {
          await getAllOrganizations();
          // Nếu thành công, đây là PLATFORM_ADMIN
          setIsPlatformAdmin(true);
          setLoading(false);
          return;
        } catch (error) {
          // Không phải PLATFORM_ADMIN
          setIsPlatformAdmin(false);
        }

        // Lấy organizations của user
        const myOrgs = await getMyOrganizations();
        
        if (myOrgs && myOrgs.length > 0) {
          // Lấy organization đầu tiên
          // Response structure: [{ id: "member-id", role: "...", organization: { id: "org-id", ... } }]
          const firstOrg = myOrgs[0];
          const orgId = firstOrg.organization?.id || firstOrg.organization_id || firstOrg.id;
          
          if (orgId) {
            // Redirect đến trang detail của organization
            navigate(`/organizations/${orgId}`, { replace: true });
            return;
          }
        }

        // Nếu không có organization nào, redirect về dashboard
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Error checking organizations:', error);
        navigate('/dashboard', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkRoleAndRedirect();
  }, [authLoading, isAuthenticated, user, navigate]);

  // Nếu đang loading, hiển thị loading state
  if (loading || authLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {t('common.loading') || 'Đang tải...'}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Nếu là PLATFORM_ADMIN, hiển thị OrganizationsManagement
  if (isPlatformAdmin) {
    return <OrganizationsManagement />;
  }

  // Nếu không phải PLATFORM_ADMIN, sẽ được redirect (nhưng vẫn render loading để tránh flash)
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {t('common.loading') || 'Đang tải...'}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationsPage;

