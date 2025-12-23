import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight, CheckCircle2, CreditCard, Eye, Loader2, Timer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { getOrderById } from "../api/orders";
import { initiatePayment } from "../api/payment";
import Header from "../components/Header";
import PaymentMethodSelector from "../components/PaymentMethodSelector";

// OrderCountdown Component - hiển thị countdown dựa trên expires_at từ API
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
  const isWarning = timeLeft < 60; // Dưới 1 phút

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

const OrderSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();
  
  // Lấy order từ location.state nếu được truyền từ CheckoutPage (có expires_at)
  const stateOrder = location.state?.order;
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('PAYOS'); // Default: PayOS (recommended)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await getOrderById(orderId);
        
        // Nếu API không trả về expires_at, lấy từ stateOrder (từ POST /orders response)
        if (!data.expires_at && stateOrder?.expires_at) {
          data.expires_at = stateOrder.expires_at;
          console.log('[OrderSuccess] Using expires_at from navigation state:', data.expires_at);
        }
        
        // Debug: Log expires_at từ API
        console.log('[OrderSuccess] Order data:', data);
        console.log('[OrderSuccess] expires_at:', data.expires_at);
        console.log('[OrderSuccess] payment_status:', data.payment_status);
        
        // Kiểm tra nếu order đã expired khi load
        if (data.expires_at && data.payment_status === 'UNPAID') {
          const isExpired = new Date(data.expires_at) < new Date();
          if (isExpired) {
            toast.error(t('order.checkoutExpired'));
            navigate('/events');
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

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, t, navigate]);

  // Handle khi order hết hạn
  const handleExpired = useCallback(() => {
    toast.error(t('order.checkoutExpired'));
    navigate(`/events/${order?.event?.id || ''}`, { replace: true });
  }, [navigate, order?.event?.id, t]);

  const formatPrice = (price) => {
    return parseInt(price).toLocaleString('vi-VN') + ' VND';
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

  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      
      // Determine return URL based on payment method
      const returnUrl = paymentMethod === 'PAYOS'
        ? `${window.location.origin}/payment/result`
        : `${window.location.origin}/payment/return?order_id=${orderId}`;
      
      const cancelUrl = paymentMethod === 'PAYOS'
        ? `${window.location.origin}/payment/result`
        : undefined;
      
      const { payment_url } = await initiatePayment(
        orderId, 
        returnUrl,
        cancelUrl,
        paymentMethod
      );
      
      // Redirect to payment gateway (VNPAY or PayOS)
      window.location.href = payment_url;
    } catch (error) {
      console.error('Error initiating payment:', error);
      
      // Handle specific errors
      if (error.message?.includes('đã được thanh toán')) {
        toast.error(t('payment.alreadyPaid'));
        // Refresh order
        window.location.reload();
      } else if (error.message?.includes('đã bị hủy')) {
        toast.error(t('payment.orderCancelled'));
        navigate('/orders');
      } else {
        toast.error(error.message || t('order.errors.createOrderFailed'));
      }
    } finally {
      setPaymentLoading(false);
    }
  };

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
          <div className="mt-6 text-center">
            <Button onClick={() => navigate('/events')}>
              {t('order.exploreEvents')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Success Message */}
          <Card className="border-2 border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
                <div>
                  <h1 className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {t('order.orderSuccess')}
                  </h1>
                  <p className="text-green-700 dark:text-green-300 mt-2">
                    {t('order.orderNumber')}: <span className="font-mono font-semibold">{order.order_number}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Countdown Timer - Hiển thị khi chưa thanh toán */}
          {/* Debug: Hiển thị expires_at */}
          {/* <div className="text-xs text-muted-foreground mb-2">
            Debug: expires_at = {order.expires_at || 'NULL'} | payment_status = {order.payment_status}
          </div> */}
          {order.expires_at && (
            <OrderCountdown 
              expiresAt={order.expires_at} 
              onExpired={handleExpired}
            />
          )}

          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('order.orderInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Info */}
              {order.event && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{t('order.eventInfo')}</p>
                  <p className="font-semibold text-lg">{order.event.title}</p>
                  {order.event.venue_name && (
                    <p className="text-sm text-muted-foreground">{order.event.venue_name}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('order.status.PENDING')}</p>
                  {getStatusBadge(order.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('order.paymentInfo')}</p>
                  {getPaymentStatusBadge(order.payment_status)}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold">{t('order.totalAmount')}</p>
                  <p className="text-2xl font-bold text-primary">{formatPrice(order.total_amount)}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {order.quantity} {t('order.tickets')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Notice & Button */}
          {order.payment_status === 'UNPAID' && order.total_amount > 0 && (
            <div className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">{t('order.paymentNote')}</p>
                </AlertDescription>
              </Alert>
              
              {/* Payment Method Selector */}
              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                disabled={paymentLoading}
              />
              
              <Button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="w-full"
                size="lg"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('payment.processing')}
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t('payment.payNow')}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => navigate(`/orders/${order.id}`)}
              className="flex-1"  
              size="lg"
            >
              <Eye className="mr-2 h-4 w-4" />
              {t('order.viewOrderDetail')}
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/events')}
              className="flex-1"
              size="lg"
            >
              {t('order.exploreEvents')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;

