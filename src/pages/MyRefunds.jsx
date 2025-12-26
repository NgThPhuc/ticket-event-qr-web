import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Calendar, DollarSign, FileText, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getMyRefunds } from '../api/refunds';
import { RefundStatusBadge } from '../components/RefundStatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

const MyRefunds = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, total_pages: 1 });
    const hasFetched = useRef(false);

    useEffect(() => {
        if (!authLoading && isAuthenticated && !hasFetched.current) {
            hasFetched.current = true;
            fetchRefunds();
        }
    }, [authLoading, isAuthenticated]);

    const fetchRefunds = async (page = 1, status = statusFilter) => {
        if (!isAuthenticated) return;

        setLoading(true);
        setError('');
        try {
            const params = { page, limit: 20 };
            if (status !== 'ALL') {
                params.status = status;
            }
            const response = await getMyRefunds(params);
            setRefunds(response.data || []);
            setMeta(response.meta || { total: 0, page: 1, limit: 20, total_pages: 1 });
        } catch (err) {
            setError(err.message || t('refunds.fetchError') || 'Không thể tải danh sách hoàn tiền');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (status) => {
        setStatusFilter(status);
        hasFetched.current = false;
        fetchRefunds(1, status);
    };

    const formatCurrency = (amount) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(numAmount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (authLoading || loading) {
        return (
            <DashboardLayout>
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {t('refunds.myRefunds.title') || 'Hoàn tiền của tôi'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {t('refunds.myRefunds.subtitle') || 'Xem lịch sử hoàn tiền của bạn'}
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('refunds.myRefunds.totalRefunds') || 'Tổng số hoàn tiền'}
                            </CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{meta.total || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('refunds.myRefunds.completed') || 'Đã hoàn tiền'}
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {refunds.filter(r => r.status === 'COMPLETED').length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('refunds.myRefunds.pending') || 'Đang xử lý'}
                            </CardTitle>
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {refunds.filter(r => r.status === 'PENDING' || r.status === 'PROCESSING').length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Refunds List */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('refunds.myRefunds.refundsList') || 'Danh sách hoàn tiền'}</CardTitle>
                        <CardDescription>
                            {t('refunds.myRefunds.refundsListDesc') || 'Xem chi tiết các yêu cầu hoàn tiền của bạn'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={statusFilter} onValueChange={handleStatusChange}>
                            <TabsList className="mb-6">
                                <TabsTrigger value="ALL">{t('refunds.filters.all') || 'Tất cả'}</TabsTrigger>
                                <TabsTrigger value="PENDING">{t('refunds.filters.pending') || 'Chờ xử lý'}</TabsTrigger>
                                <TabsTrigger value="PROCESSING">{t('refunds.filters.processing') || 'Đang xử lý'}</TabsTrigger>
                                <TabsTrigger value="COMPLETED">{t('refunds.filters.completed') || 'Đã hoàn tiền'}</TabsTrigger>
                                <TabsTrigger value="FAILED">{t('refunds.filters.failed') || 'Thất bại'}</TabsTrigger>
                            </TabsList>

                            {/* Thông báo thời gian xử lý cho VNPAY */}
                            {refunds.some(r => r.status === 'PROCESSING' || r.status === 'PENDING') && (
                                <Alert className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                                    <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                                        ⏱️ {t('refunds.myRefunds.processingNote') || 'Lưu ý: Tiền sẽ được hoàn về tài khoản của bạn trong vòng 1-3 ngày làm việc sau khi được ngân hàng xử lý.'}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <TabsContent value={statusFilter} className="space-y-4">
                                {refunds.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">
                                            {t('refunds.myRefunds.noRefunds') || 'Bạn chưa có yêu cầu hoàn tiền nào'}
                                        </p>
                                    </div>
                                ) : (
                                    refunds.map((refund) => (
                                        <Card key={refund.id} className="hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={() => navigate(`/refunds/${refund.id}`)}>
                                            <CardContent className="p-6">
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-lg font-semibold">
                                                                {refund.order?.event?.title || t('refunds.unknownEvent')}
                                                            </h3>
                                                            <RefundStatusBadge status={refund.status} />
                                                        </div>
                                                        <div className="space-y-1 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>{formatDate(refund.created_at)}</span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">{t('refunds.orderNumber') || 'Mã đơn hàng'}: </span>
                                                                {refund.order?.order_number || '-'}
                                                            </div>
                                                            {refund.reason && (
                                                                <div className="mt-2">
                                                                    <span className="font-medium">{t('refunds.reason') || 'Lý do'}: </span>
                                                                    {refund.reason}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="text-2xl font-bold text-green-600">
                                                            {formatCurrency(refund.refund_amount)}
                                                        </div>
                                                        <Button variant="outline" size="sm" className="gap-2">
                                                            {t('refunds.viewDetail') || 'Xem chi tiết'}
                                                            <ArrowRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </TabsContent>
                        </Tabs>

                        {/* Pagination */}
                        {meta.total_pages > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                <Button
                                    variant="outline"
                                    disabled={meta.page === 1}
                                    onClick={() => fetchRefunds(meta.page - 1, statusFilter)}
                                >
                                    {t('common.previous') || 'Trước'}
                                </Button>
                                <span className="flex items-center px-4">
                                    {t('common.page') || 'Trang'} {meta.page} / {meta.total_pages}
                                </span>
                                <Button
                                    variant="outline"
                                    disabled={meta.page >= meta.total_pages}
                                    onClick={() => fetchRefunds(meta.page + 1, statusFilter)}
                                >
                                    {t('common.next') || 'Sau'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default MyRefunds;

