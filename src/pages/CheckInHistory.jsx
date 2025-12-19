import { ArrowLeft, Download, QrCode, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '../layouts/DashboardLayout';

import CheckInHistoryTable from '../components/CheckInHistoryTable';
import CheckInStatsCard from '../components/CheckInStatsCard';

import { getCheckInHistory, getCheckInStats } from '../api/checkIn';
import { getEventById } from '../api/events';

/**
 * Trang lịch sử check-in
 */
export default function CheckInHistory() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { eventId } = useParams();

  // Event info
  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // History
  const [history, setHistory] = useState([]);
  const [historyMeta, setHistoryMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 1,
  });
  const [historyFilters, setHistoryFilters] = useState({
    available_gates: [],
  });
  const [historyLoading, setHistoryLoading] = useState(true);

  // Query params
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 20,
    gate: null,
    search: null,
    sort_by: 'checked_in_at',
    sort_order: 'desc',
  });

  // Fetch event info
  useEffect(() => {
    const fetchEvent = async () => {
      setEventLoading(true);
      try {
        const eventData = await getEventById(eventId);
        setEvent(eventData);
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error(t('checkin.history.fetchEventError', 'Không thể tải thông tin sự kiện'));
      } finally {
        setEventLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId, t]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!eventId) return;
    
    setStatsLoading(true);
    try {
      const statsData = await getCheckInStats(eventId);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    if (!eventId) return;

    setHistoryLoading(true);
    try {
      const response = await getCheckInHistory(eventId, queryParams);
      setHistory(response.data || []);
      setHistoryMeta(response.meta || historyMeta);
      setHistoryFilters(response.filters || { available_gates: [] });
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error(t('checkin.history.fetchHistoryError', 'Không thể tải lịch sử check-in'));
    } finally {
      setHistoryLoading(false);
    }
  }, [eventId, queryParams, t]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setQueryParams((prev) => ({ ...prev, page: newPage }));
  };

  // Handle search
  const handleSearch = (searchValue) => {
    setQueryParams((prev) => ({
      ...prev,
      search: searchValue || null,
      page: 1,
    }));
  };

  // Handle filter change
  const handleFilterChange = (filters) => {
    setQueryParams((prev) => ({
      ...prev,
      ...filters,
      page: 1,
    }));
  };

  // Refresh all data
  const handleRefresh = async () => {
    await Promise.all([fetchStats(), fetchHistory()]);
    toast.success(t('checkin.history.refreshed', 'Đã làm mới dữ liệu'));
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      // Fetch all data without pagination for export
      const response = await getCheckInHistory(eventId, {
        ...queryParams,
        page: 1,
        limit: 10000,
      });
      
      const data = response.data || [];
      
      if (data.length === 0) {
        toast.error(t('checkin.history.noDataExport', 'Không có dữ liệu để xuất'));
        return;
      }

      // Create CSV content
      const headers = ['Tên', 'Email', 'Loại vé', 'Mã vé', 'Cổng', 'Thời gian', 'Nhân viên'];
      const rows = data.map((item) => [
        item.attendee_name,
        item.attendee_email,
        item.ticket_type,
        item.ticket_serial,
        item.checked_in_gate || '',
        new Date(item.checked_in_at).toLocaleString('vi-VN'),
        item.checked_in_by || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      // Download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `checkin-history-${event?.name || eventId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t('checkin.history.exportSuccess', 'Đã xuất file CSV'));
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('checkin.history.exportError', 'Không thể xuất dữ liệu'));
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/check-in')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {t('checkin.history.title', 'Lịch sử Check-in')}
              </h1>
              {event && (
                <p className="text-gray-500">{event.name}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/check-in/scanner?eventId=${eventId}`)}
            >
              <QrCode className="w-4 h-4 mr-2" />
              {t('checkin.history.goToScanner', 'Quét QR')}
            </Button>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('checkin.history.refresh', 'Làm mới')}
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              {t('checkin.history.export', 'Xuất CSV')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <CheckInStatsCard stats={stats} loading={statsLoading} />

        {/* History Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('checkin.history.tableTitle', 'Danh sách đã check-in')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CheckInHistoryTable
              data={history}
              meta={historyMeta}
              filters={historyFilters}
              loading={historyLoading}
              onPageChange={handlePageChange}
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
