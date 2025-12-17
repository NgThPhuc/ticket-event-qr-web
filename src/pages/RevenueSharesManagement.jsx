import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { getRevenueShares } from '../api/revenueShares';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Banknote, Clock, CheckCircle2, XCircle } from 'lucide-react';

const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  AVAILABLE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  PAID_OUT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

const formatCurrency = (value) => {
  if (value == null) return '-';
  return value.toLocaleString('vi-VN');
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const RevenueSharesManagement = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isPlatformAdmin = user?.platform_role === 'PLATFORM_ADMIN';

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !isPlatformAdmin) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await getRevenueShares(
          statusFilter === 'ALL' ? {} : { status: statusFilter }
        );
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err.message ||
            t('revenueShares.fetchError') ||
            'Không thể tải danh sách revenue shares'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isPlatformAdmin, statusFilter, t]);

  if (authLoading || !isAuthenticated || !isPlatformAdmin) {
    return null;
  }

  const totalNetAmount = items.reduce(
    (sum, rs) => sum + (rs.net_amount || 0),
    0
  );
  const totalCount = items.length;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('revenueShares.title') || 'Revenue Shares'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('revenueShares.subtitle') ||
              'Theo dõi các khoản chia doanh thu cho tổ chức theo từng trạng thái payout.'}
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {t('revenueShares.stats.totalShares') || 'Tổng RevenueShares'}
                </p>
                <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                  {totalCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {t('revenueShares.stats.totalNetAmount') || 'Tổng net amount'}
                </p>
                <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                  {formatCurrency(totalNetAmount)} đ
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {t('revenueShares.stats.currentFilter') || 'Bộ lọc hiện tại'}
                </p>
                <p className="text-base font-semibold mt-1 text-gray-900 dark:text-white">
                  {statusFilter === 'ALL'
                    ? t('revenueShares.filters.all') || 'Tất cả trạng thái'
                    : t(`revenueShares.status.${statusFilter}`) || statusFilter}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert error */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs filter status */}
        <Tabs
          value={statusFilter}
          onValueChange={setStatusFilter}
          className="w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="ALL">
                {t('revenueShares.filters.all') || 'Tất cả'}
              </TabsTrigger>
              <TabsTrigger value="PENDING">
                {t('revenueShares.status.PENDING') || 'PENDING'}
              </TabsTrigger>
              <TabsTrigger value="AVAILABLE">
                {t('revenueShares.status.AVAILABLE') || 'AVAILABLE'}
              </TabsTrigger>
              <TabsTrigger value="PAID_OUT">
                {t('revenueShares.status.PAID_OUT') || 'PAID_OUT'}
              </TabsTrigger>
              <TabsTrigger value="CANCELLED">
                {t('revenueShares.status.CANCELLED') || 'CANCELLED'}
              </TabsTrigger>
            </TabsList>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setStatusFilter((prev) => (prev === 'ALL' ? 'PENDING' : 'ALL'))
              }
            >
              {statusFilter === 'ALL'
                ? t('revenueShares.actions.showPendingOnly') ||
                  'Chỉ xem PENDING'
                : t('revenueShares.actions.showAll') || 'Xem tất cả'}
            </Button>
          </div>

          <TabsContent value={statusFilter} className="mt-0">
            <div className="rounded-lg border bg-white dark:bg-gray-900 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                      {t('common.loading') || 'Đang tải...'}
                    </p>
                  </div>
                </div>
              ) : items.length === 0 ? (
                <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                  <XCircle className="h-8 w-8 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                  <p className="font-medium">
                    {t('revenueShares.empty.title') ||
                      'Chưa có revenue share nào.'}
                  </p>
                  <p className="text-sm mt-1">
                    {t('revenueShares.empty.description') ||
                      'Khi có đơn hàng hoàn tất, hệ thống sẽ tạo các RevenueShare tương ứng theo tổ chức.'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t('revenueShares.table.id') || 'ID'}
                      </TableHead>
                      <TableHead>
                        {t('revenueShares.table.organization') ||
                          'Tổ chức'}
                      </TableHead>
                      <TableHead>
                        {t('revenueShares.table.event') || 'Sự kiện'}
                      </TableHead>
                      <TableHead>
                        {t('revenueShares.table.netAmount') || 'Net amount'}
                      </TableHead>
                      <TableHead>
                        {t('revenueShares.table.status') || 'Trạng thái'}
                      </TableHead>
                      <TableHead>
                        {t('revenueShares.table.availableAt') ||
                          'Available at'}
                      </TableHead>
                      <TableHead>
                        {t('revenueShares.table.createdAt') || 'Tạo lúc'}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs text-gray-700 dark:text-gray-200 max-w-[160px] truncate">
                          {item.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {item.organization?.name ||
                                item.organization_name ||
                                '-'}
                            </span>
                            {item.organization && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                @{item.organization.slug}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {item.event?.title || item.event_title || '-'}
                            </span>
                            {item.event && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                #{item.event.id?.slice(0, 8)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(item.net_amount)} đ
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              STATUS_COLORS[item.status] ||
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }
                          >
                            {t(`revenueShares.status.${item.status}`) ||
                              item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(item.available_at)}</TableCell>
                        <TableCell>{formatDateTime(item.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RevenueSharesManagement;


