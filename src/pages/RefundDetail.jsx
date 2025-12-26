import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    FileText,
    RefreshCw,
    Ticket,
    User,
    XCircle
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { getRefundDetail } from '../api/refunds';
import { RefundStatusBadge } from '../components/RefundStatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

const RefundDetail = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { refundId } = useParams();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [refund, setRefund] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const hasFetched = useRef(false);

    useEffect(() => {
        if (!authLoading && isAuthenticated && refundId && !hasFetched.current) {
            hasFetched.current = true;
            fetchRefundDetail();
        }
    }, [authLoading, isAuthenticated, refundId]);

    const fetchRefundDetail = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getRefundDetail(refundId);
            setRefund(data);
        } catch (err) {
            setError(err.message || t('refunds.detail.fetchError') || 'Không thể tải chi tiết hoàn tiền');
            if (err.status === 404) {
                setTimeout(() => {
                    navigate('/refunds');
                }, 2000);
            }
        } finally {
            setLoading(false);
        }
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

    if (error) {
        return (
            <DashboardLayout>
                <div className="container mx-auto px-4 py-8">
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            </DashboardLayout>
        );
    }

    if (!refund) {
        return null;
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Header */}
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        {t('common.back') || 'Quay lại'}
                    </Button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {t('refunds.detail.title') || 'Chi tiết hoàn tiền'}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {t('refunds.detail.subtitle') || 'Thông tin chi tiết về yêu cầu hoàn tiền'}
                            </p>
                        </div>
                        <RefundStatusBadge status={refund.status} className="text-lg px-4 py-2" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Refund Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    {t('refunds.detail.refundInfo') || 'Thông tin hoàn tiền'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {t('refunds.detail.refundAmount') || 'Số tiền hoàn lại'}
                                        </p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatCurrency(refund.refund_amount)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {t('refunds.detail.refundType') || 'Loại hoàn tiền'}
                                        </p>
                                        <Badge variant={refund.refund_type === 'AUTOMATIC' ? 'default' : 'secondary'}>
                                            {refund.refund_type === 'AUTOMATIC'
                                                ? t('refunds.automatic') || 'Tự động'
                                                : t('refunds.manual') || 'Thủ công'}
                                        </Badge>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        {t('refunds.detail.reason') || 'Lý do hoàn tiền'}
                                    </p>
                                    <p className="text-sm">{refund.reason || '-'}</p>
                                </div>
                                {refund.payment_method && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {t('refunds.detail.paymentMethod') || 'Phương thức thanh toán'}
                                        </p>
                                        <Badge>{refund.payment_method}</Badge>
                                    </div>
                                )}
                                {(refund.gateway_refund_id || refund.external_refund_id) && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {t('refunds.detail.gatewayRefundId') || 'Mã giao dịch VNPAY'}
                                        </p>
                                        <p className="text-sm font-mono">{refund.gateway_refund_id || refund.external_refund_id}</p>
                                    </div>
                                )}
                                {refund.processed_at && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {t('refunds.detail.processedAt') || 'Thời gian xử lý'}
                                        </p>
                                        <p className="text-sm">{formatDate(refund.processed_at)}</p>
                                    </div>
                                )}

                                {/* Thông báo thời gian xử lý VNPAY */}
                                {(refund.status === 'PROCESSING' || refund.status === 'PENDING') && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                                        <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            {t('refunds.detail.processingNote') || 'Lưu ý: Tiền sẽ được hoàn về tài khoản của bạn trong vòng 1-3 ngày làm việc sau khi được ngân hàng xử lý.'}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Order Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    {t('refunds.detail.orderInfo') || 'Thông tin đơn hàng'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {t('refunds.detail.orderNumber') || 'Mã đơn hàng'}
                                        </p>
                                        <p className="font-semibold">{refund.order?.order_number || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {t('refunds.detail.orderAmount') || 'Tổng tiền đơn hàng'}
                                        </p>
                                        <p className="font-semibold">{formatCurrency(refund.order?.total_amount || 0)}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        {t('refunds.detail.paymentStatus') || 'Trạng thái thanh toán'}
                                    </p>
                                    <Badge
                                        variant={
                                            refund.order?.payment_status === 'REFUNDED'
                                                ? 'default'
                                                : refund.order?.payment_status === 'PAID'
                                                    ? 'default'
                                                    : 'secondary'
                                        }
                                    >
                                        {refund.order?.payment_status === 'REFUNDED'
                                            ? t('order.paymentStatus.REFUNDED') || 'Đã hoàn tiền'
                                            : refund.order?.payment_status === 'PAID'
                                                ? t('order.paymentStatus.PAID') || 'Đã thanh toán'
                                                : refund.order?.payment_status || '-'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        {t('refunds.detail.createdAt') || 'Ngày tạo đơn hàng'}
                                    </p>
                                    <p className="text-sm">{formatDate(refund.order?.created_at)}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Event Information */}
                        {refund.order?.event && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        {t('refunds.detail.eventInfo') || 'Thông tin sự kiện'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {t('refunds.detail.eventTitle') || 'Tên sự kiện'}
                                        </p>
                                        <p className="font-semibold">{refund.order.event.title}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate(`/e/${refund.order.event.slug}`)}
                                        className="w-full"
                                    >
                                        {t('refunds.detail.viewEvent') || 'Xem sự kiện'}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Tickets Information */}
                        {refund.order?.tickets && refund.order.tickets.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Ticket className="h-5 w-5" />
                                        {t('refunds.detail.ticketsInfo') || 'Thông tin vé'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {refund.order.tickets.map((ticket) => (
                                            <div
                                                key={ticket.id}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-semibold">{ticket.ticket_serial || ticket.id}</p>
                                                    <Badge variant={ticket.status === 'REFUNDED' ? 'default' : 'secondary'} className="mt-1">
                                                        {ticket.status === 'REFUNDED'
                                                            ? t('ticket.status.REFUNDED') || 'Đã hoàn tiền'
                                                            : ticket.status || '-'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('refunds.detail.timeline') || 'Timeline'}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <p className="font-semibold text-sm">
                                            {t('refunds.detail.created') || 'Yêu cầu được tạo'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{formatDate(refund.created_at)}</p>
                                    </div>
                                </div>
                                {refund.status === 'PROCESSING' && (
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                                <RefreshCw className="h-4 w-4 text-yellow-600 dark:text-yellow-400 animate-spin" />
                                            </div>
                                            <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="font-semibold text-sm">
                                                {t('refunds.detail.processing') || 'Đang xử lý'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {(refund.status === 'COMPLETED' || refund.status === 'FAILED') && refund.processed_at && (
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={`h-8 w-8 rounded-full flex items-center justify-center ${refund.status === 'COMPLETED'
                                                    ? 'bg-green-100 dark:bg-green-900/30'
                                                    : 'bg-red-100 dark:bg-red-900/30'
                                                    }`}
                                            >
                                                {refund.status === 'COMPLETED' ? (
                                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm">
                                                {refund.status === 'COMPLETED'
                                                    ? t('refunds.detail.completed') || 'Đã hoàn tiền'
                                                    : t('refunds.detail.failed') || 'Hoàn tiền thất bại'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{formatDate(refund.processed_at)}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Customer Information */}
                        {refund.order?.user && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        {t('refunds.detail.customerInfo') || 'Thông tin khách hàng'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {t('refunds.detail.customerName') || 'Tên khách hàng'}
                                        </p>
                                        <p className="font-semibold">{refund.order.user.full_name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {t('refunds.detail.customerEmail') || 'Email'}
                                        </p>
                                        <p className="text-sm">{refund.order.user.email || '-'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default RefundDetail;

