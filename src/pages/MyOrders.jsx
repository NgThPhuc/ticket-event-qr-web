import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AlertCircle, CheckCircle, Clock, CreditCard, Package, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getMyOrders } from "../api/orders";
import { DashboardLayout } from "../layouts/DashboardLayout";

const MyOrders = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    payment_status: 'all',
    page: 1,
    limit: 50
  });
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyOrders(filters);
      setOrders(data.data || []);
      setMeta(data.meta || null);
    } catch (err) {
      console.error('[MyOrders] Error fetching orders:', err);
      setError(err.message || t('order.errors.orderNotFound'));
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return parseInt(price).toLocaleString('vi-VN') + ' VND';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: 'secondary',
      CONFIRMED: 'default',
      CANCELLED: 'destructive',
      COMPLETED: 'success'
    };
    return <Badge variant={variants[status] || 'secondary'}>{t(`order.status.${status}`)}</Badge>;
  };

  const getPaymentStatusBadge = (status) => {
    const variants = {
      UNPAID: 'destructive',
      PAID: 'success',
      REFUNDED: 'secondary'
    };
    return <Badge variant={variants[status] || 'secondary'}>{t(`order.paymentStatus.${status}`)}</Badge>;
  };

  // Calculate stats
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.payment_status === 'PAID').length;
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const totalRevenue = orders
    .filter(o => o.payment_status === 'PAID')
    .reduce((sum, o) => sum + (parseInt(o.total_amount) || 0), 0);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('order.myOrders') || 'Quản Lý Đơn Hàng'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('order.ordersSubtitle') || 'Quản lý tất cả đơn hàng của bạn'}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('order.stats.totalOrders') || 'Tổng Đơn Hàng'}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {totalOrders}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </div>

          {/* Paid Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('order.stats.paidOrders') || 'Đã Thanh Toán'}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {paidOrders}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('order.stats.pendingOrders') || 'Đang Chờ'}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {pendingOrders}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-300" />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('order.stats.totalRevenue') || 'Tổng Chi Tiêu'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatPrice(totalRevenue)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[200px]">
              <label className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300">
                {t('order.filterByStatus') || 'Lọc theo trạng thái'}
              </label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value, page: 1 })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('order.allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('order.allStatuses') || 'Tất cả trạng thái'}</SelectItem>
                  <SelectItem value="PENDING">{t('order.status.PENDING') || 'Đang chờ'}</SelectItem>
                  <SelectItem value="CONFIRMED">{t('order.status.CONFIRMED') || 'Đã xác nhận'}</SelectItem>
                  <SelectItem value="CANCELLED">{t('order.status.CANCELLED') || 'Đã hủy'}</SelectItem>
                  <SelectItem value="COMPLETED">{t('order.status.COMPLETED') || 'Hoàn thành'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="min-w-[200px]">
              <label className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300">
                {t('order.filterByPayment') || 'Lọc theo thanh toán'}
              </label>
              <Select value={filters.payment_status} onValueChange={(value) => setFilters({ ...filters, payment_status: value, page: 1 })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('order.allPaymentStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('order.allPaymentStatuses') || 'Tất cả'}</SelectItem>
                  <SelectItem value="UNPAID">{t('order.paymentStatus.UNPAID') || 'Chưa thanh toán'}</SelectItem>
                  <SelectItem value="PAID">{t('order.paymentStatus.PAID') || 'Đã thanh toán'}</SelectItem>
                  <SelectItem value="REFUNDED">{t('order.paymentStatus.REFUNDED') || 'Đã hoàn tiền'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('order.ordersList') || 'Danh sách đơn hàng'}
          </h2>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {t('common.loading') || 'Đang tải...'}
              </p>
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-md border bg-white dark:bg-gray-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('order.table.orderNumber') || 'MÃ ĐƠN HÀNG'}</TableHead>
                  <TableHead>{t('order.table.event') || 'SỰ KIỆN'}</TableHead>
                  <TableHead>{t('order.table.status') || 'TRẠNG THÁI'}</TableHead>
                  <TableHead>{t('order.table.payment') || 'THANH TOÁN'}</TableHead>
                  <TableHead>{t('order.table.date') || 'NGÀY ĐẶT'}</TableHead>
                  <TableHead className="text-right">{t('order.table.amount') || 'TỔNG TIỀN'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center py-8">
                        <Package className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-semibold">{t('order.noOrders') || 'Không có đơn hàng'}</p>
                        <p className="text-muted-foreground mb-4">{t('order.noOrdersDescription') || 'Hãy khám phá các sự kiện'}</p>
                        <Button onClick={() => navigate('/events')}>
                          {t('order.exploreEvents') || 'Khám phá sự kiện'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <TableCell>
                        <span className="font-mono text-sm">{order.order_number}</span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.event?.title || '-'}</div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(order.payment_status)}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{formatDate(order.created_at)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-primary">{formatPrice(order.total_amount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.tickets_count || order.quantity} {t('order.tickets') || 'vé'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page <= 1}
            >
              {t('eventsPage.prev') || 'Trước'}
            </Button>
            <span className="flex items-center px-4">
              {t('eventsPage.page') || 'Trang'} {filters.page} / {meta.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={filters.page >= meta.totalPages}
            >
              {t('eventsPage.next') || 'Sau'}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyOrders;
