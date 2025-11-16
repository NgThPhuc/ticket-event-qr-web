import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { getEvents } from '../api/events';
import { getMyOrganizations } from '../api/organizations';
import { PlatformEventsDataTable } from '../components/PlatformEventsDataTable';
import { Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EventsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch organizations và events
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || authLoading) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        // Lấy organizations của user
        const myOrgs = await getMyOrganizations();
        setOrganizations(myOrgs || []);

        // Lấy organization IDs
        const orgIds = myOrgs?.map(org => {
          return org.organization?.id || org.organization_id || org.id;
        }).filter(Boolean) || [];

        if (orgIds.length === 0) {
          setEvents([]);
          setLoading(false);
          return;
        }

        // Lấy events của tất cả organizations
        // Có thể lấy từng organization hoặc gọi API với multiple organization_ids
        // Tạm thời lấy events của organization đầu tiên, sau có thể cải thiện
        const allEvents = [];
        for (const orgId of orgIds) {
          try {
            const response = await getEvents({
              organization_id: orgId,
              page: 1,
              limit: 100,
              sort: 'start_at:desc',
            });
            if (response.data && response.data.length > 0) {
              allEvents.push(...response.data);
            }
          } catch (err) {
            console.error(`Error fetching events for org ${orgId}:`, err);
          }
        }

        // Remove duplicates và sort
        const uniqueEvents = Array.from(
          new Map(allEvents.map(event => [event.id, event])).values()
        ).sort((a, b) => {
          const dateA = new Date(a.start_at || 0);
          const dateB = new Date(b.start_at || 0);
          return dateB - dateA;
        });

        setEvents(uniqueEvents);
      } catch (err) {
        setError(err.message || t('event.fetchError') || 'Không thể tải danh sách sự kiện');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, user, t]);

  // Check permissions
  const isPlatformAdmin = user?.platform_role === 'PLATFORM_ADMIN';
  const isOrganizerAdmin = organizations.some(org => {
    const role = org.role;
    return role === 'ORGANIZER_ADMIN';
  });
  const isEventManager = organizations.some(org => {
    const role = org.role;
    return role === 'EVENT_MANAGER';
  });
  const isCheckinStaff = organizations.some(org => {
    const role = org.role;
    return role === 'CHECKIN_STAFF';
  });

  const canCreate = isOrganizerAdmin || isEventManager || isPlatformAdmin;
  const canEdit = (event) => {
    if (isPlatformAdmin) return true;
    if (isOrganizerAdmin || isEventManager) {
      // Check xem event có thuộc về organization mà user có quyền không
      const eventOrgId = event.organization_id || event.organization?.id;
      return organizations.some(org => {
        const orgId = org.organization?.id || org.organization_id || org.id;
        const role = org.role;
        return orgId === eventOrgId && (role === 'ORGANIZER_ADMIN' || role === 'EVENT_MANAGER');
      });
    }
    return false;
  };
  const canDelete = (event) => {
    if (isPlatformAdmin) return true;
    if (isOrganizerAdmin) {
      // Chỉ ORGANIZER_ADMIN mới có quyền delete, không phải EVENT_MANAGER
      const eventOrgId = event.organization_id || event.organization?.id;
      return organizations.some(org => {
        const orgId = org.organization?.id || org.organization_id || org.id;
        const role = org.role;
        return orgId === eventOrgId && role === 'ORGANIZER_ADMIN';
      });
    }
    return false;
  };

  const handleView = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const handleEdit = (eventId) => {
    navigate(`/events/${eventId}/edit`);
  };

  const handleDelete = (eventId, eventTitle) => {
    // Delete sẽ được xử lý trong EventsManagement hoặc có thể tạo dialog riêng
    // Tạm thời chỉ navigate
    navigate(`/events/${eventId}`);
  };

  // Filter actions based on permissions
  const filteredOnView = canEdit || canDelete ? handleView : handleView;
  const filteredOnEdit = canEdit ? handleEdit : undefined;
  const filteredOnDelete = canDelete ? handleDelete : undefined;

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('eventsPage.title') || 'Events'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('eventsPage.subtitle') || 'Manage your events'}
              </p>
            </div>
            {canCreate && (
              <Button onClick={() => navigate('/create-event')} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('eventsPage.createEvent') || 'Create Event'}
              </Button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {t('common.loading') || 'Đang tải...'}
              </p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('eventsPage.noEvents') || 'You don\'t have any events yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('eventsPage.noEventsDescription') || 'Create your first event to get started'}
            </p>
            {canCreate && (
              <Button onClick={() => navigate('/create-event')} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('eventsPage.createEvent') || 'Create Event'}
              </Button>
            )}
          </div>
        ) : (
          <PlatformEventsDataTable
            events={events}
            onView={filteredOnView}
            onEdit={filteredOnEdit}
            onDelete={filteredOnDelete}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default EventsList;

