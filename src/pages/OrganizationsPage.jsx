import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import OrganizationsManagement from './OrganizationsManagement';

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

  // Kiểm tra PLATFORM_ADMIN trực tiếp từ user object
  const isPlatformAdmin = user?.platform_role === 'PLATFORM_ADMIN';

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      setLoading(false);
      return;
    }

    // Nếu là PLATFORM_ADMIN, hiển thị OrganizationsManagement
    if (isPlatformAdmin) {
      setLoading(false);
      return;
    }

    // Sử dụng user.organizations từ profile thay vì gọi API
    const userOrgs = user?.organizations || [];
    
    if (userOrgs.length > 0) {
      // Lấy organization đầu tiên từ profile
      const firstOrg = userOrgs[0];
      const orgId = firstOrg.id;
      
      if (orgId) {
        // Redirect đến trang detail của organization
        navigate(`/organizations/${orgId}`, { replace: true });
        return;
      }
    }

    // Nếu không có organization nào, redirect về dashboard
    navigate('/dashboard', { replace: true });
    setLoading(false);
  }, [authLoading, isAuthenticated, user, navigate, isPlatformAdmin]);

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

