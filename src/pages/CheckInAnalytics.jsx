import { ArrowLeft, BarChart3, Download, QrCode, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DashboardLayout } from '../layouts/DashboardLayout';

import CheckInStatsCard from '../components/CheckInStatsCard';
import GateStatsChart from '../components/GateStatsChart';
import HourlyStatsChart from '../components/HourlyStatsChart';
import ScanLogsTable from '../components/ScanLogsTable';
import StaffPerformanceTable from '../components/StaffPerformanceTable';

import { exportCheckInReport, getCheckInStats } from '../api/checkIn';
import { getEventById } from '../api/events';

/**
 * Trang phân tích chi tiết check-in
 */
export default function CheckInAnalytics() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { eventId } = useParams();

    // Event info
    const [event, setEvent] = useState(null);
    const [eventLoading, setEventLoading] = useState(true);

    // Stats
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // Export
    const [exportFormat, setExportFormat] = useState('csv');
    const [exporting, setExporting] = useState(false);

    // Fetch event info
    useEffect(() => {
        const fetchEvent = async () => {
            setEventLoading(true);
            try {
                const eventData = await getEventById(eventId);
                setEvent(eventData);
            } catch (error) {
                console.error('Error fetching event:', error);
                toast.error(t('checkin.analytics.fetchEventError', 'Không thể tải thông tin sự kiện'));
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

    // Refresh all data
    const handleRefresh = async () => {
        await fetchStats();
        toast.success(t('checkin.analytics.refreshed', 'Đã làm mới dữ liệu'));
        // Components will refresh themselves based on eventId change or manual refresh
        window.location.reload();
    };

    // Export report
    const handleExport = async () => {
        setExporting(true);
        try {
            const result = await exportCheckInReport(eventId, exportFormat);

            if (exportFormat === 'csv') {
                // Download blob
                const url = window.URL.createObjectURL(result);
                const link = document.createElement('a');
                link.href = url;
                link.download = `checkin-report-${event?.name || eventId}-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                // Download JSON
                const jsonStr = JSON.stringify(result, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `checkin-report-${event?.name || eventId}-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }

            toast.success(t('checkin.analytics.exportSuccess', 'Đã xuất báo cáo'));
        } catch (error) {
            console.error('Export error:', error);
            toast.error(t('checkin.analytics.exportError', 'Không thể xuất báo cáo'));
        } finally {
            setExporting(false);
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
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <BarChart3 className="w-6 h-6" />
                                {t('checkin.analytics.title', 'Phân tích Check-in')}
                            </h1>
                            {event && (
                                <p className="text-gray-500 dark:text-gray-400">{event.name}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/check-in/scanner?eventId=${eventId}`)}
                        >
                            <QrCode className="w-4 h-4 mr-2" />
                            {t('checkin.analytics.goToScanner', 'Quét QR')}
                        </Button>
                        <Button variant="outline" onClick={handleRefresh}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {t('checkin.analytics.refresh', 'Làm mới')}
                        </Button>
                        <div className="flex items-center gap-1">
                            <Select value={exportFormat} onValueChange={setExportFormat}>
                                <SelectTrigger className="w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="csv">CSV</SelectItem>
                                    <SelectItem value="json">JSON</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleExport} disabled={exporting}>
                                <Download className="w-4 h-4 mr-2" />
                                {exporting
                                    ? t('checkin.analytics.exporting', 'Đang xuất...')
                                    : t('checkin.analytics.export', 'Xuất')
                                }
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <CheckInStatsCard stats={stats} loading={statsLoading} />

                {/* Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <HourlyStatsChart eventId={eventId} />
                    <GateStatsChart eventId={eventId} />
                </div>

                {/* Staff Performance */}
                <StaffPerformanceTable eventId={eventId} />

                {/* Scan Logs */}
                <ScanLogsTable eventId={eventId} />
            </div>
        </DashboardLayout>
    );
}
