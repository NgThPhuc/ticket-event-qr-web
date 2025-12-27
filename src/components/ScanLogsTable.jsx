import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertTriangle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileText,
    Search,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getScanLogs } from '../api/checkIn';

// Result type config
const RESULT_CONFIG = {
    SUCCESS: {
        color: 'bg-green-500',
        icon: CheckCircle,
        textColor: 'text-green-600',
    },
    ALREADY_USED: {
        color: 'bg-yellow-500',
        icon: AlertTriangle,
        textColor: 'text-yellow-600',
    },
    NOT_FOUND: {
        color: 'bg-red-500',
        icon: XCircle,
        textColor: 'text-red-600',
    },
    REVOKED: {
        color: 'bg-red-500',
        icon: XCircle,
        textColor: 'text-red-600',
    },
    REFUNDED: {
        color: 'bg-orange-500',
        icon: XCircle,
        textColor: 'text-orange-600',
    },
    EVENT_NOT_ACTIVE: {
        color: 'bg-gray-500',
        icon: AlertTriangle,
        textColor: 'text-gray-600',
    },
    INVALID_STATUS: {
        color: 'bg-gray-500',
        icon: XCircle,
        textColor: 'text-gray-600',
    },
};

const RESULT_OPTIONS = [
    'SUCCESS',
    'ALREADY_USED',
    'NOT_FOUND',
    'REVOKED',
    'REFUNDED',
];

/**
 * Bảng hiển thị chi tiết scan logs
 * @param {string} eventId - ID sự kiện
 */
export function ScanLogsTable({ eventId }) {
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState({
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 1,
    });
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchValue, setSearchValue] = useState('');
    const [resultFilter, setResultFilter] = useState('all');
    const [gateFilter, setGateFilter] = useState('all');
    const [page, setPage] = useState(1);

    const fetchData = useCallback(async () => {
        if (!eventId) return;

        setLoading(true);
        try {
            const params = {
                page,
                limit: 20,
            };

            if (searchValue) params.search = searchValue;
            if (resultFilter !== 'all') params.result = resultFilter;
            if (gateFilter !== 'all') params.gate = gateFilter;

            const result = await getScanLogs(eventId, params);
            setData(result.data || []);
            setMeta(result.meta || meta);
        } catch (error) {
            console.error('Error fetching scan logs:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [eventId, page, searchValue, resultFilter, gateFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchData();
    };

    const formatTime = (dateString) => {
        if (!dateString) return '--';
        return new Date(dateString).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
        });
    };

    const getResultBadge = (result) => {
        const config = RESULT_CONFIG[result] || RESULT_CONFIG.INVALID_STATUS;
        const Icon = config.icon;

        return (
            <Badge className={`${config.color} flex items-center gap-1 text-white`}>
                <Icon className="w-3 h-3" />
                {result}
            </Badge>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {t('checkin.analytics.scanLogs', 'Nhật ký quét')}
                    {meta.total > 0 && (
                        <Badge variant="outline" className="ml-2">
                            {meta.total} {t('checkin.analytics.records', 'bản ghi')}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={t('checkin.analytics.searchPlaceholder', 'Tìm theo QR hoặc mã vé...')}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </form>

                    <Select value={resultFilter} onValueChange={(v) => { setResultFilter(v); setPage(1); }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('checkin.analytics.allResults', 'Tất cả kết quả')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                {t('checkin.analytics.allResults', 'Tất cả kết quả')}
                            </SelectItem>
                            {RESULT_OPTIONS.map((result) => (
                                <SelectItem key={result} value={result}>
                                    {result}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('checkin.analytics.time', 'Thời gian')}</TableHead>
                                <TableHead>{t('checkin.analytics.result', 'Kết quả')}</TableHead>
                                <TableHead>{t('checkin.analytics.ticket', 'Vé')}</TableHead>
                                <TableHead>{t('checkin.analytics.gate', 'Cổng')}</TableHead>
                                <TableHead>{t('checkin.analytics.staff', 'Nhân viên')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5}>
                                            <div className="animate-pulse h-10 bg-gray-100 dark:bg-gray-800 rounded" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        {t('checkin.analytics.noLogs', 'Chưa có nhật ký quét')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm">{formatTime(log.scanned_at)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getResultBadge(log.result)}
                                        </TableCell>
                                        <TableCell>
                                            {log.ticket ? (
                                                <div>
                                                    <p className="font-medium text-sm">{log.ticket.attendee_name}</p>
                                                    <p className="text-xs text-gray-500">{log.ticket.ticket_serial}</p>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">
                                                    {log.qr_payload?.substring(0, 8)}...
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {log.gate || <span className="text-gray-400">--</span>}
                                        </TableCell>
                                        <TableCell>
                                            {log.staff?.full_name || <span className="text-gray-400">--</span>}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {meta.total_pages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            {t('checkin.analytics.showing', 'Hiển thị')} {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.total)} {t('checkin.analytics.of', 'trong')} {meta.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1 || loading}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm px-3">
                                {meta.page} / {meta.total_pages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= meta.total_pages || loading}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default ScanLogsTable;
