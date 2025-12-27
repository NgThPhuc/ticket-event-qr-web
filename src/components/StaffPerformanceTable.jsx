import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Medal, Trophy, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getStaffStats } from '../api/checkIn';

/**
 * Bảng hiệu suất nhân viên check-in (Leaderboard)
 * @param {string} eventId - ID sự kiện
 */
export function StaffPerformanceTable({ eventId }) {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!eventId) return;

        setLoading(true);
        try {
            const result = await getStaffStats(eventId);
            setData(result);
        } catch (error) {
            console.error('Error fetching staff stats:', error);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Sort by total scans
    const sortedStaff = data?.staff?.sort((a, b) => b.total_scans - a.total_scans) || [];

    const getRankIcon = (index) => {
        switch (index) {
            case 0:
                return <Trophy className="w-5 h-5 text-yellow-500" />;
            case 1:
                return <Medal className="w-5 h-5 text-gray-400" />;
            case 2:
                return <Medal className="w-5 h-5 text-amber-600" />;
            default:
                return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-400">#{index + 1}</span>;
        }
    };

    const getSuccessRateBadge = (rate) => {
        if (rate >= 98) {
            return <Badge className="bg-green-500">{rate.toFixed(1)}%</Badge>;
        } else if (rate >= 95) {
            return <Badge className="bg-blue-500">{rate.toFixed(1)}%</Badge>;
        } else if (rate >= 90) {
            return <Badge variant="secondary">{rate.toFixed(1)}%</Badge>;
        }
        return <Badge variant="outline">{rate.toFixed(1)}%</Badge>;
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!sortedStaff.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        {t('checkin.analytics.staffPerformance', 'Hiệu suất nhân viên')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-gray-500 py-8">
                    {t('checkin.analytics.noStaffData', 'Chưa có dữ liệu nhân viên')}
                </CardContent>
            </Card>
        );
    }

    const maxScans = sortedStaff[0]?.total_scans || 1;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {t('checkin.analytics.staffPerformance', 'Hiệu suất nhân viên')}
                    <Badge variant="outline" className="ml-2">
                        {sortedStaff.length} {t('checkin.analytics.staff', 'nhân viên')}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>{t('checkin.analytics.staffName', 'Nhân viên')}</TableHead>
                            <TableHead className="text-right">{t('checkin.analytics.totalScans', 'Tổng quét')}</TableHead>
                            <TableHead className="w-32">{t('checkin.analytics.progress', 'Tiến độ')}</TableHead>
                            <TableHead className="text-right">{t('checkin.analytics.successRate', 'Tỷ lệ')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedStaff.map((staff, index) => {
                            const progressPercent = (staff.total_scans / maxScans) * 100;
                            return (
                                <TableRow
                                    key={staff.staff_id}
                                    className={index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}
                                >
                                    <TableCell>{getRankIcon(index)}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{staff.staff_name}</p>
                                            <p className="text-sm text-gray-500">{staff.staff_email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="text-right">
                                            <span className="font-bold text-lg">{staff.total_scans}</span>
                                            <p className="text-xs text-gray-500">
                                                <span className="text-green-600">{staff.success_count}</span>
                                                {' / '}
                                                <span className="text-red-500">{staff.failed_count}</span>
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Progress value={progressPercent} className="h-2" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {getSuccessRateBadge(staff.success_rate)}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default StaffPerformanceTable;
