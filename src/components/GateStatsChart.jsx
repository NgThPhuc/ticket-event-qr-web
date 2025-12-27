import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { DoorOpen } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

import { getGateStats } from '../api/checkIn';

// Colors for gates
const GATE_COLORS = [
    '#3b82f6', // blue
    '#22c55e', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
];

/**
 * Biểu đồ thống kê check-in theo cổng
 * @param {string} eventId - ID sự kiện
 */
export function GateStatsChart({ eventId }) {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!eventId) return;

        setLoading(true);
        try {
            const result = await getGateStats(eventId);
            setData(result);
        } catch (error) {
            console.error('Error fetching gate stats:', error);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Transform data for chart
    const chartData = data?.gates?.map((gate, index) => ({
        name: gate.gate || t('checkin.analytics.unknownGate', 'Không xác định'),
        value: gate.success,
        total: gate.total,
        failed: gate.failed,
        percentage: gate.percentage,
        color: GATE_COLORS[index % GATE_COLORS.length],
    })) || [];

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-full w-48 mx-auto" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data?.gates?.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <DoorOpen className="w-5 h-5" />
                        {t('checkin.analytics.gateStats', 'Thống kê theo cổng')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-gray-500 py-8">
                    {t('checkin.analytics.noGateData', 'Chưa có dữ liệu theo cổng')}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <DoorOpen className="w-5 h-5" />
                    {t('checkin.analytics.gateStats', 'Thống kê theo cổng')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                                    labelLine={{ stroke: '#888', strokeWidth: 1 }}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name, props) => [
                                        `${value} ${t('checkin.analytics.checkins', 'check-in')}`,
                                        props.payload.name,
                                    ]}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Table */}
                    <div className="overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('checkin.analytics.gate', 'Cổng')}</TableHead>
                                    <TableHead className="text-right">{t('checkin.analytics.success', 'Thành công')}</TableHead>
                                    <TableHead className="text-right">{t('checkin.analytics.failed', 'Thất bại')}</TableHead>
                                    <TableHead className="text-right">{t('checkin.analytics.total', 'Tổng')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {chartData.map((gate, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: gate.color }}
                                                />
                                                {gate.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">
                                            {gate.value}
                                        </TableCell>
                                        <TableCell className="text-right text-red-500">
                                            {gate.failed}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {gate.total}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {/* Total row */}
                                <TableRow className="bg-gray-50 dark:bg-gray-800/50 font-bold">
                                    <TableCell>{t('checkin.analytics.total', 'Tổng')}</TableCell>
                                    <TableCell className="text-right text-green-600">
                                        {chartData.reduce((acc, g) => acc + g.value, 0)}
                                    </TableCell>
                                    <TableCell className="text-right text-red-500">
                                        {chartData.reduce((acc, g) => acc + g.failed, 0)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {data.total}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default GateStatsChart;
