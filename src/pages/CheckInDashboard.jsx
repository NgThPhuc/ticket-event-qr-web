import { ArrowRight, Calendar, QrCode, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '../layouts/DashboardLayout';

import { getCheckInStats } from '../api/checkIn';
import { getEvents } from '../api/events';
import { useAuth } from '../contexts/AuthContext';

/**
 * Dashboard tổng quan check-in
 * Hiển thị danh sách sự kiện với thống kê check-in
 */
export default function CheckInDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [eventsWithStats, setEventsWithStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      const response = await getEvents({ status: 'PUBLISHED', limit: 50 });
      const eventsList = response.data || response;
      setEvents(Array.isArray(eventsList) ? eventsList : []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error(t('checkin.dashboard.fetchError', 'Không thể tải danh sách sự kiện'));
    }
  }, [t]);

  // Fetch stats for each event
  const fetchStatsForEvents = useCallback(async (eventsList) => {
    const eventsWithStatsData = await Promise.all(
      eventsList.map(async (event) => {
        try {
          const stats = await getCheckInStats(event.id);
          return { ...event, stats };
        } catch (error) {
          // If error, return event without stats (might not have permission)
          return { ...event, stats: null };
        }
      })
    );
    setEventsWithStats(eventsWithStatsData);
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchEvents();
      setLoading(false);
    };
    loadData();
  }, [fetchEvents]);

  // Fetch stats when events change
  useEffect(() => {
    if (events.length > 0) {
      fetchStatsForEvents(events);
    }
  }, [events, fetchStatsForEvents]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    if (events.length > 0) {
      await fetchStatsForEvents(events);
    }
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getEventStatusBadge = (event) => {
    const now = new Date();
    const startDate = new Date(event.start_at);
    const endDate = new Date(event.end_at);

    if (now < startDate) {
      return <Badge variant="secondary">{t('checkin.dashboard.upcoming', 'Sắp diễn ra')}</Badge>;
    } else if (now >= startDate && now <= endDate) {
      return <Badge className="bg-green-500">{t('checkin.dashboard.ongoing', 'Đang diễn ra')}</Badge>;
    } else {
      return <Badge variant="outline">{t('checkin.dashboard.ended', 'Đã kết thúc')}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {t('checkin.dashboard.title', 'Check-in QR')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {t('checkin.dashboard.subtitle', 'Quản lý check-in cho các sự kiện của bạn')}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('checkin.dashboard.refresh', 'Làm mới')}
          </Button>
        </div>

        {/* Events list */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : eventsWithStats.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                {t('checkin.dashboard.noEvents', 'Chưa có sự kiện nào')}
              </h3>
              <p className="text-gray-500 mt-2">
                {t('checkin.dashboard.noEventsDesc', 'Tạo sự kiện mới để bắt đầu check-in')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {eventsWithStats.map((event) => {
              const stats = event.stats;
              const checkedInPercent = stats?.total_issued > 0
                ? Math.round((stats.checked_in / stats.total_issued) * 100)
                : 0;

              return (
                <Card 
                  key={event.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/check-in/scanner?eventId=${event.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {event.name}
                      </CardTitle>
                      {getEventStatusBadge(event)}
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(event.start_at)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {stats ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {t('checkin.dashboard.checkInProgress', 'Tiến độ check-in')}
                          </span>
                          <span className="font-bold text-green-600">
                            {stats.checked_in} / {stats.total_issued}
                          </span>
                        </div>
                        <Progress value={checkedInPercent} className="h-2" />
                        <p className="text-xs text-gray-500 text-right">
                          {checkedInPercent}%
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        {t('checkin.dashboard.noStatsAccess', 'Không có quyền xem thống kê')}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/check-in/scanner?eventId=${event.id}`);
                        }}
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        {t('checkin.dashboard.scan', 'Quét QR')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/check-in/history/${event.id}`);
                        }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
