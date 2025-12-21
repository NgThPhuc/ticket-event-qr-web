import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import EventsList from './EventsList';
import EventsManagement from './EventsManagement';

/**
 * Component wrapper cho route /events-management
 * - PLATFORM_ADMIN: Hiển thị EventsManagement (quản lý tất cả)
 * - ORGANIZER_ADMIN, EVENT_MANAGER: Hiển thị EventsList (events của organizations họ thuộc về)
 * - CHECKIN_STAFF, CUSTOMER: Hiển thị EventsList (read-only)
 */
const EventsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  // Kiểm tra PLATFORM_ADMIN trực tiếp từ user object thay vì gọi API
  const isPlatformAdmin = user?.platform_role === 'PLATFORM_ADMIN';

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    // Không cần gọi API nữa, chỉ cần set loading = false
    setLoading(false);
  }, [authLoading, isAuthenticated]);

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

  // Nếu là PLATFORM_ADMIN, hiển thị EventsManagement
  if (isPlatformAdmin) {
    return <EventsManagement />;
  }

  // Các role khác hiển thị EventsList
  return <EventsList />;
};

export default EventsPage;

