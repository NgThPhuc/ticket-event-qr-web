import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowLeft, Calendar, MapPin, Timer, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { cancelOrder, getOrderById } from "../api/orders";
import Header from "../components/Header";
import QRCodeDisplay from "../components/QRCodeDisplay";

// OrderCountdown Component
const OrderCountdown = ({ expiresAt, onExpired }) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(0);

  const calculateTimeLeft = useCallback(() => {
    if (!expiresAt) return 0;
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = Math.floor((expiry - now) / 1000);
    return diff > 0 ? diff : 0;
  }, [expiresAt]);

  useEffect(() => {
    if (!expiresAt) return;

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        onExpired?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpired, calculateTimeLeft]);

  if (!expiresAt || timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft < 60;

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
      isWarning 
        ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 animate-pulse border border-red-300 dark:border-red-500/30' 
        : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30'
    }`}>
      <Timer size={18} />
      <span className="text-sm">
        {t('order.expiresIn')}:{' '}
        <strong className="font-mono text-lg">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </strong>
      </span>
    </div>
  );
};

const OrderDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orderId } = useParams();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
 const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getOrderById(orderId);
      
      // Kiểm tra nếu order đã expired khi load
      if (data.expires_at && data.payment_status === 'UNPAID') {
        const isExpired = new Date(data.expires_at) < new Date();
        if (isExpired && data.status !== 'CANCELLED') {
          toast.error(t('order.checkoutExpired'));
          navigate('/orders');
          return;
        }
      }
      
      setOrder(data);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message || t('order.errors.orderNotFound'));
    } finally {
      setLoading(false);
    }
  };

  // Handle khi order hết hạn
  const handleExpired = useCallback(() => {
    toast.error(t('order.checkoutExpired'));
    navigate('/orders', { replace: true });
  }, [navigate, t]);

  const handleCancel = async () => {
    try {
      setCanceling(true);
      await cancelOrder(orderId);
      toast.success(t('order.cancelSuccess'));
      setShowCancelDialog(false);
      // Refresh order data
      await fetchOrder();
    } catch (err) {
      console.error('Error canceling order:', err);
      toast.error(err.message || t('order.cancelError'));
    } finally {
      setCanceling(false);
    }
  };

  const formatPrice = (price) => {
    return parseInt(price).toLocaleString('vi-VN') + ' VND';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const canCancel = order && order.status === 'PENDING' && order.payment_status === 'UNPAID';

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || t('order.errors.orderNotFound')}</AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button onClick={() => navigate('/orders')}>
              {t('order.backToOrders')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/orders')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('order.backToOrders')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{t('order.orderDetail')}</CardTitle>
                    <p className="text-muted-foreground font-mono mt-1">{order.order_number}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {getStatusBadge(order.status)}
                    {getPaymentStatusBadge(order.payment_status)}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Countdown Timer - Hiển thị khi chưa thanh toán */}
            {order.payment_status === 'UNPAID' && order.expires_at && order.status === 'PENDING' && (
              <OrderCountdown 
                expiresAt={order.expires_at} 
                onExpired={handleExpired}
              />
            )}

            {/* Event Information */}
            {order.event && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('order.eventInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-xl mb-2">{order.event.title}</h3>
                    {order.event.subtitle && (
                      <p className="text-muted-foreground">{order.event.subtitle}</p>
                    )}
                  </div>

                  {order.event.start_at && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('event.startAt')}</p>
                        <p className="font-medium">{formatDate(order.event.start_at)}</p>
                      </div>
                    </div>
                  )}

                  {order.event.venue_name && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('event.location')}</p>
                        <p className="font-medium">{order.event.venue_name}</p>
                        {order.event.address_line1 && (
                          <p className="text-sm text-muted-foreground">
                            {order.event.address_line1}
                            {order.event.city && `, ${order.event.city}`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tickets */}
            {order.tickets && order.tickets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('order.tickets')} ({order.tickets.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.tickets.map((ticket, index) => (
                      <QRCodeDisplay
                        key={ticket.id}
                        qrPayload={ticket.qr_payload}
                        ticketSerial={ticket.ticket_serial}
                        attendeeName={ticket.attendee_name}
                        ticketType={ticket.ticket_type}
                        checkinStatus={ticket.checkin_status}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cancel Button */}
            {canCancel && (
              <Button 
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
                className="w-full"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {t('order.cancelOrder')}
              </Button>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{t('order.orderSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('order.createdAt')}</span>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                  {order.updated_at && order.updated_at !== order.created_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('order.updatedAt')}</span>
                      <span>{formatDate(order.updated_at)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('order.quantity')}</span>
                    <span>{order.quantity} {t('order.tickets')}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{t('order.totalAmount')}</span>
                    <span className="text-xl font-bold text-primary">{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            {order.payment_method && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('order.paymentInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('order.paymentMethod')}</span>
                    <span>{order.payment_method}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('order.paymentInfo')}</span>
                    {getPaymentStatusBadge(order.payment_status)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('order.cancelOrder')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('order.cancelConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={canceling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {canceling ? t('common.loading') : t('order.cancelOrder')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderDetail;
