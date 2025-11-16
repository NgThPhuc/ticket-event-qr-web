import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import EventsManagement from './EventsManagement';
import EventsList from './EventsList';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useTranslation } from 'react-i18next';
import { getAllOrganizations } from '../api/organizations';

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
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
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

        // Các role khác (ORGANIZER_ADMIN, EVENT_MANAGER, CHECKIN_STAFF, CUSTOMER)
        // sẽ hiển thị EventsList
        setLoading(false);
      } catch (error) {
        console.error('Error checking role:', error);
        setLoading(false);
      }
    };

    checkRole();
  }, [authLoading, isAuthenticated, user]);

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

