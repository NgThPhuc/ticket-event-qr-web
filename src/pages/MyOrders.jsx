import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Calendar, Eye, MapPin, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getMyOrders } from "../api/orders";
import Header from "../components/Header";

const MyOrders = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    page: 1,
    limit: 20
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
      console.error('Error fetching orders:', err);
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

  const handleViewDetail = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Package className="h-8 w-8" />
            {t('order.myOrders')}
          </h1>
          <p className="text-muted-foreground">{t('order.noOrdersDescription')}</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('order.filterByStatus')}</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value, page: 1 })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('order.allStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('order.allStatuses')}</SelectItem>
                    <SelectItem value="PENDING">{t('order.status.PENDING')}</SelectItem>
                    <SelectItem value="CONFIRMED">{t('order.status.CONFIRMED')}</SelectItem>
                    <SelectItem value="CANCELLED">{t('order.status.CANCELLED')}</SelectItem>
                    <SelectItem value="COMPLETED">{t('order.status.COMPLETED')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">{t('order.filterByPayment')}</label>
                <Select value={filters.payment_status} onValueChange={(value) => setFilters({ ...filters, payment_status: value, page: 1 })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('order.allPaymentStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('order.allPaymentStatuses')}</SelectItem>
                    <SelectItem value="UNPAID">{t('order.paymentStatus.UNPAID')}</SelectItem>
                    <SelectItem value="PAID">{t('order.paymentStatus.PAID')}</SelectItem>
                    <SelectItem value="REFUNDED">{t('order.paymentStatus.REFUNDED')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Orders List */}
        {!loading && !error && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('order.noOrders')}</h3>
                  <p className="text-muted-foreground mb-6">{t('order.noOrdersDescription')}</p>
                  <Button onClick={() => navigate('/events')}>
                    {t('order.exploreEvents')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-mono text-sm text-muted-foreground">
                              {order.order_number}
                            </p>
                            <h3 className="font-semibold text-lg mt-1">
                              {order.event?.title || 'Event'}
                            </h3>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(order.status)}
                          {getPaymentStatusBadge(order.payment_status)}
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(order.created_at)}</span>
                          </div>
                          {order.event?.venue_name && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="line-clamp-1">{order.event.venue_name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{t('order.totalAmount')}</p>
                          <p className="text-xl font-bold text-primary">{formatPrice(order.total_amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.tickets_count || order.quantity} {t('order.tickets')}
                          </p>
                        </div>
                        <Button onClick={() => handleViewDetail(order.id)} size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          {t('order.viewOrderDetail')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
              {t('eventsPage.prev')}
            </Button>
            <span className="flex items-center px-4">
              {t('eventsPage.page')} {filters.page} / {meta.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={filters.page >= meta.totalPages}
            >
              {t('eventsPage.next')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
