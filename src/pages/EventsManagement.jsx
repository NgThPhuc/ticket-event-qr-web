import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { PlatformEventsDataTable } from '../components/PlatformEventsDataTable';
import { getEvents, deleteEvent } from '../api/events';
import { Calendar, MapPin, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EventsManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    eventId: null,
    eventTitle: '',
  });

  // Kiểm tra permission - chỉ PLATFORM_ADMIN mới có quyền truy cập
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (user?.platform_role !== 'PLATFORM_ADMIN') {
        // Redirect về dashboard nếu không phải PLATFORM_ADMIN
        navigate('/dashboard');
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      // Kiểm tra permission trước
      if (!isAuthenticated || user?.platform_role !== 'PLATFORM_ADMIN') {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await getEvents({
          page: 1,
          limit: 100,
          sort: 'start_at:desc',
        });
        setEvents(response.data || []);
      } catch (err) {
        setError(err.message || t('eventsManagement.fetchError') || 'Không thể tải danh sách sự kiện');
        if (err.status === 403) {
          // Không có quyền - redirect
          navigate('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.platform_role === 'PLATFORM_ADMIN') {
      fetchEvents();
    }
  }, [isAuthenticated, user, navigate, t]);

  // Tính toán summary statistics
  const totalEvents = events.length;
  const publishedEvents = events.filter(event => event.status === 'PUBLISHED').length;
  const upcomingEvents = events.filter(event => {
    if (!event.start_at) return false;
    const startDate = new Date(event.start_at);
    const now = new Date();
    return startDate > now && event.status !== 'CANCELLED' && event.status !== 'COMPLETED';
  }).length;

  const handleView = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const handleEdit = (eventId) => {
    navigate(`/events/${eventId}/edit`);
  };

  const handleDelete = (eventId, eventTitle) => {
    setDeleteDialog({
      open: true,
      eventId,
      eventTitle,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.eventId) return;

    try {
      await deleteEvent(deleteDialog.eventId);
      setAlert({
        type: 'success',
        message: t('eventsManagement.deleteSuccess') || 'Xóa sự kiện thành công',
      });
      // Reload danh sách
      const response = await getEvents({
        page: 1,
        limit: 100,
        sort: 'start_at:desc',
      });
      setEvents(response.data || []);
      setDeleteDialog({ open: false, eventId: null, eventTitle: '' });
      
      // Ẩn alert sau 3 giây
      setTimeout(() => {
        setAlert({ type: '', message: '' });
      }, 3000);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || t('eventsManagement.deleteError') || 'Không thể xóa sự kiện',
      });
      setDeleteDialog({ open: false, eventId: null, eventTitle: '' });
      
      // Ẩn alert sau 3 giây
      setTimeout(() => {
        setAlert({ type: '', message: '' });
      }, 3000);
    }
  };

  // Nếu không phải PLATFORM_ADMIN hoặc đang loading, không hiển thị gì
  if (authLoading || !isAuthenticated || user?.platform_role !== 'PLATFORM_ADMIN') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('eventsManagement.title') || 'Events Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('eventsManagement.subtitle') || 'Quản lý tất cả sự kiện trong hệ thống'}
          </p>
        </div>

        {/* Alert */}
        {alert.message && (
          <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="mb-6">
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Events */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('eventsManagement.stats.totalEvents') || 'Total Events'}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {totalEvents}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </div>

          {/* Published Events */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('eventsManagement.stats.publishedEvents') || 'Published Events'}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {publishedEvents}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('eventsManagement.stats.upcomingEvents') || 'Upcoming Events'}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {upcomingEvents}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('eventsManagement.eventsList') || 'Events List'}
          </h2>
          <Button onClick={() => navigate('/create-event')} className="gap-2">
            <Calendar className="h-4 w-4" />
            {t('eventsPage.createEvent') || 'Create Event'}
          </Button>
        </div>

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
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <PlatformEventsDataTable
            events={events}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog({ open: false, eventId: null, eventTitle: '' });
          }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('eventsManagement.deleteConfirmTitle') || 'Xác nhận xóa sự kiện'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('eventsManagement.deleteConfirmMessage', { title: deleteDialog.eventTitle }) || 
                  `Bạn có chắc chắn muốn xóa sự kiện "${deleteDialog.eventTitle}"? Hành động này không thể hoàn tác.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('common.cancel') || 'Hủy'}
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                {t('eventsManagement.deleteConfirm') || 'Xóa'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default EventsManagement;

