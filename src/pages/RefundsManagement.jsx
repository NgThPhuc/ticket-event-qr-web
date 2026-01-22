import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowRight,
    CheckCircle,
    Clock,
    DollarSign,
    FileText,
    Search
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getRefunds } from '../api/refunds';
import { RefundStatusBadge } from '../components/RefundStatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

// ============== MOCK DATA FOR SCREENSHOT ==============
const USE_MOCK_DATA = false; // Đặt thành false để dùng API thật

const MOCK_REFUNDS = [
    {
        id: '1',
        order: {
            order_number: 'ORD-2025-001234',
            user: { full_name: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com' },
            event: { title: 'Countdown Party 2026 - Đà Nẵng' },
        },
        refund_amount: 1500000,
        status: 'PENDING',
        payment_method: 'VNPAY',
        created_at: '2025-12-30T09:30:00.000Z',
        reason: 'Không thể tham dự do lý do cá nhân',
    },
    {
        id: '2',
        order: {
            order_number: 'ORD-2025-001198',
            user: { full_name: 'Trần Thị Bình', email: 'binh.tran@gmail.com' },
            event: { title: 'Rock Festival Vietnam 2026' },
        },
        refund_amount: 2400000,
        status: 'COMPLETED',
        payment_method: 'VNPAY',
        created_at: '2025-12-28T15:45:00.000Z',
        reason: 'Sự kiện bị hủy',
    },
];

const MOCK_META = { total: 2, page: 1, limit: 20, total_pages: 1 };
// ============== END MOCK DATA ==============

const RefundsManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, total_pages: 1 });
  const hasFetched = useRef(false);

  // Kiểm tra permission - chỉ PLATFORM_ADMIN và ORGANIZER_ADMIN mới có quyền truy cập
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (user?.platform_role !== 'PLATFORM_ADMIN' && user?.platform_role !== 'ORGANIZER_ADMIN') {
        navigate('/dashboard');
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !hasFetched.current) {
      if (user?.platform_role === 'PLATFORM_ADMIN' || user?.platform_role === 'ORGANIZER_ADMIN') {
        hasFetched.current = true;
        fetchRefunds();
      }
    }
  }, [authLoading, isAuthenticated, user]);

  const fetchRefunds = async (page = 1, status = statusFilter) => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError('');
    
    if (USE_MOCK_DATA) {
      const filtered = status === 'ALL' 
        ? MOCK_REFUNDS 
        : MOCK_REFUNDS.filter(r => r.status === status);
      setRefunds(filtered);
      setMeta({ ...MOCK_META, total: filtered.length });
      setLoading(false);
      return;
    }
    
    try {
      const params = { page, limit: 20 };
      if (status !== 'ALL') {
        params.status = status;
      }
      if (searchQuery) {
        params.q = searchQuery;
      }
      const response = await getRefunds(params);
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

  const handleSearch = () => {
    hasFetched.current = false;
    fetchRefunds(1, statusFilter);
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

  // Nếu không phải admin hoặc đang loading, không hiển thị gì
  if (authLoading || !isAuthenticated || (user?.platform_role !== 'PLATFORM_ADMIN' && user?.platform_role !== 'ORGANIZER_ADMIN')) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('refunds.management.title') || 'Quản lý hoàn tiền'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('refunds.management.subtitle') || 'Quản lý tất cả yêu cầu hoàn tiền trong hệ thống'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('refunds.management.totalRefunds') || 'Tổng số'}
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
                {t('refunds.management.pending') || 'Chờ xử lý'}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {refunds.filter(r => r.status === 'PENDING').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('refunds.management.completed') || 'Đã hoàn tiền'}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
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
                {t('refunds.management.totalAmount') || 'Tổng tiền'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  refunds.reduce((sum, r) => sum + parseFloat(r.refund_amount || 0), 0)
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Refunds Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>{t('refunds.management.refundsList') || 'Danh sách hoàn tiền'}</CardTitle>
                <CardDescription>
                  {t('refunds.management.refundsListDesc') || 'Xem và quản lý các yêu cầu hoàn tiền'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={t('refunds.management.searchPlaceholder') || 'Tìm kiếm...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-64"
                />
                <Button onClick={handleSearch} variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
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

              <TabsContent value={statusFilter}>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
                    </div>
                  </div>
                ) : refunds.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {t('refunds.management.noRefunds') || 'Không có yêu cầu hoàn tiền nào'}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('refunds.table.orderNumber') || 'Mã đơn hàng'}</TableHead>
                          <TableHead>{t('refunds.table.customer') || 'Khách hàng'}</TableHead>
                          <TableHead>{t('refunds.table.event') || 'Sự kiện'}</TableHead>
                          <TableHead>{t('refunds.table.amount') || 'Số tiền'}</TableHead>
                          <TableHead>{t('refunds.table.status') || 'Trạng thái'}</TableHead>
                          <TableHead>{t('refunds.table.paymentMethod') || 'Phương thức'}</TableHead>
                          <TableHead>{t('refunds.table.createdAt') || 'Ngày tạo'}</TableHead>
                          <TableHead>{t('refunds.table.actions') || 'Thao tác'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {refunds.map((refund) => (
                          <TableRow key={refund.id}>
                            <TableCell className="font-medium">
                              {refund.order?.order_number || '-'}
                            </TableCell>
                            <TableCell>
                              {refund.order?.user?.full_name || refund.order?.user?.email || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate">
                                {refund.order?.event?.title || '-'}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-green-600">
                              {formatCurrency(refund.refund_amount)}
                            </TableCell>
                            <TableCell>
                              <RefundStatusBadge status={refund.status} />
                            </TableCell>
                            <TableCell>
                              {refund.payment_method ? (
                                <Badge variant="outline">{refund.payment_method}</Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(refund.created_at)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/refunds/${refund.id}`)}
                                className="gap-2"
                              >
                                {t('refunds.viewDetail') || 'Xem chi tiết'}
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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

export default RefundsManagement;

