import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { getHourlyStats } from '../api/checkIn';

/**
 * Biểu đồ thống kê check-in theo giờ
 * @param {string} eventId - ID sự kiện
 */
export function HourlyStatsChart({ eventId }) {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchData = useCallback(async () => {
        if (!eventId) return;

        setLoading(true);
        try {
            const result = await getHourlyStats(eventId, selectedDate);
            setData(result);
        } catch (error) {
            console.error('Error fetching hourly stats:', error);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [eventId, selectedDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Transform data for chart
    const chartData = data?.hourly_data?.map((item) => ({
        hour: `${item.hour}:00`,
        success: item.success,
        failed: item.failed,
        total: item.count,
        isPeak: item.hour === data.peak_hour,
    })) || [];

    // Generate full 24 hours if needed
    const fullDayData = [];
    for (let i = 0; i < 24; i++) {
        const existing = chartData.find((d) => d.hour === `${i}:00`);
        if (existing) {
            fullDayData.push(existing);
        } else {
            fullDayData.push({
                hour: `${i}:00`,
                success: 0,
                failed: 0,
                total: 0,
                isPeak: false,
            });
        }
    }

    const handlePrevDay = () => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() - 1);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const handleNextDay = () => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + 1);
        const today = new Date().toISOString().split('T')[0];
        if (date.toISOString().split('T')[0] <= today) {
            setSelectedDate(date.toISOString().split('T')[0]);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {t('checkin.analytics.hourlyStats', 'Thống kê theo giờ')}
                </CardTitle>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevDay}>
                        ←
                    </Button>
                    <span className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedDate)}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextDay}
                        disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                    >
                        →
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {data && (
                    <div className="mb-4 flex items-center gap-4 text-sm">
                        <span className="text-gray-500">
                            {t('checkin.analytics.totalScans', 'Tổng quét')}: <strong>{data.total_scans || 0}</strong>
                        </span>
                        <span className="text-green-600">
                            {t('checkin.analytics.successful', 'Thành công')}: <strong>{data.total_success || 0}</strong>
                        </span>
                        {data.peak_hour !== undefined && (
                            <span className="text-blue-600">
                                {t('checkin.analytics.peakHour', 'Cao điểm')}: <strong>{data.peak_hour}:00</strong> ({data.peak_count} {t('checkin.analytics.scans', 'quét')})
                            </span>
                        )}
                    </div>
                )}

                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fullDayData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                            <XAxis
                                dataKey="hour"
                                tick={{ fontSize: 10 }}
                                interval={1}
                                className="text-gray-500"
                            />
                            <YAxis tick={{ fontSize: 10 }} className="text-gray-500" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--background)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                }}
                                formatter={(value, name) => [
                                    value,
                                    name === 'success'
                                        ? t('checkin.analytics.successful', 'Thành công')
                                        : t('checkin.analytics.failed', 'Thất bại'),
                                ]}
                                labelFormatter={(label) => `${t('checkin.analytics.time', 'Thời gian')}: ${label}`}
                            />
                            <Bar dataKey="success" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]}>
                                {fullDayData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.isPeak ? '#16a34a' : '#22c55e'}
                                        stroke={entry.isPeak ? '#15803d' : 'none'}
                                        strokeWidth={entry.isPeak ? 2 : 0}
                                    />
                                ))}
                            </Bar>
                            <Bar dataKey="failed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-green-500" />
                        <span>{t('checkin.analytics.successful', 'Thành công')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-red-500" />
                        <span>{t('checkin.analytics.failed', 'Thất bại')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-green-600 ring-2 ring-green-700" />
                        <span>{t('checkin.analytics.peakHour', 'Cao điểm')}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default HourlyStatsChart;
