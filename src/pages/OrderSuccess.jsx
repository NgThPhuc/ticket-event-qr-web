import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight, CheckCircle2, CreditCard, Eye, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { getOrderById } from "../api/orders";
import { initiatePayment } from "../api/payment";
import Header from "../components/Header";

const OrderSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orderId } = useParams();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await getOrderById(orderId);
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
  }, [orderId, t]);

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
      
      const returnUrl = `${window.location.origin}/payment/return?order_id=${orderId}`;
      
      const { payment_url } = await initiatePayment(orderId, returnUrl);
      
      // Redirect to VNPAY
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
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">{t('order.paymentNote')}</p>
                </AlertDescription>
              </Alert>
              
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
