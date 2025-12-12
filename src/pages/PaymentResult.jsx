import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { confirmPayOSPayment } from "../api/payment";
import { getOrderById } from "../api/orders";
import Header from "../components/Header";

/**
 * PaymentResult Page
 * Handle return URL từ PayOS payment gateway
 * 
 * Query params từ PayOS:
 * - code: "00" (success) hoặc error codes
 * - status: "PAID" | "CANCELLED" | "FAILED"
 * - orderCode: Transaction ID
 * - cancel: "true" | "false"
 */
const PaymentResult = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [status, setStatus] = useState('checking'); // 'checking' | 'success' | 'cancelled' | 'error'
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const processPaymentResult = async () => {
      try {
        // Parse query params
        const code = searchParams.get('code');
        const paymentStatus = searchParams.get('status');
        const orderCode = searchParams.get('orderCode');
        const cancel = searchParams.get('cancel');

        console.log('[PayOS Return] Query params:', {
          code,
          paymentStatus,
          orderCode,
          cancel
        });

        // Check if payment was cancelled
        if (cancel === 'true' || paymentStatus === 'CANCELLED') {
          setStatus('cancelled');
          setMessage(t('payment.cancelled', 'Bạn đã hủy thanh toán'));
          toast.error(t('payment.cancelled'));
          return;
        }

        // Check if missing orderCode
        if (!orderCode) {
          setStatus('error');
          setMessage(t('payment.missingOrderCode', 'Không tìm thấy thông tin đơn hàng'));
          toast.error(t('payment.missingOrderCode'));
          return;
        }

        // Check if payment failed
        if (code !== '00' || paymentStatus !== 'PAID') {
          setStatus('error');
          setMessage(
            t('payment.paymentFailed', 'Thanh toán thất bại. Vui lòng thử lại.') +
            (code ? ` (Mã: ${code})` : '')
          );
          toast.error(t('payment.paymentFailed'));
          return;
        }

        // Confirm payment with backend
        console.log('[PayOS] Confirming payment with orderCode:', orderCode);
        const confirmResult = await confirmPayOSPayment(parseInt(orderCode));

        if (confirmResult.success) {
          console.log('[PayOS] Payment confirmed successfully');
          
          // Get order_id from confirmation result or fetch order
          if (confirmResult.order_id) {
            setOrderId(confirmResult.order_id);
          } else {
            // Fallback: Try to find order by transaction
            // For now, redirect to orders list
            console.warn('[PayOS] No order_id in confirmation result');
          }

          setStatus('success');
          setMessage(confirmResult.message || t('payment.successMessage', 'Thanh toán thành công!'));
          toast.success(t('payment.successMessage'));

          // Redirect to orders page after 2 seconds
          setTimeout(() => {
            if (confirmResult.order_id) {
              navigate(`/orders/${confirmResult.order_id}`);
            } else {
              navigate('/orders');
            }
          }, 2000);
        } else {
          setStatus('error');
          setMessage(confirmResult.message || t('payment.confirmFailed', 'Không thể xác nhận thanh toán'));
          toast.error(confirmResult.message);
        }
      } catch (error) {
        console.error('[PayOS] Error processing payment result:', error);
        setStatus('error');
        setMessage(
          error.message || 
          t('payment.processingError', 'Không thể xác nhận thanh toán. Vui lòng liên hệ hỗ trợ.')
        );
        toast.error(t('payment.processingError'));
      }
    };

    processPaymentResult();
  }, [searchParams, navigate, t]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="border-2">
          <CardContent className="pt-12 pb-12">
            {/* Loading State */}
            {status === 'checking' && (
              <>
                <div className="flex justify-center mb-6">
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-center mb-4">
                  {t('payment.processing', 'Đang xác nhận thanh toán...')}
                </h1>
                <p className="text-center text-muted-foreground">
                  {t('payment.pleaseWait', 'Vui lòng đợi trong giây lát')}
                </p>
              </>
            )}

            {/* Success State */}
            {status === 'success' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
                    <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-center mb-4 text-green-600 dark:text-green-400">
                  {t('payment.success.title', 'Thanh toán thành công!')}
                </h1>
                <p className="text-center text-muted-foreground mb-6">
                  {message}
                </p>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('payment.redirecting', 'Đang chuyển đến trang vé của bạn...')}
                  </p>
                </div>
              </>
            )}

            {/* Cancelled State */}
            {status === 'cancelled' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-4">
                    <AlertCircle className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-center mb-4">
                  {t('payment.cancelled', 'Đã hủy thanh toán')}
                </h1>
                <p className="text-center text-muted-foreground mb-8">
                  {message}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => navigate('/orders')}
                    size="lg"
                  >
                    {t('payment.viewOrders', 'Xem đơn hàng')}
                  </Button>
                  <Button
                    onClick={() => navigate('/events')}
                    variant="outline"
                    size="lg"
                  >
                    {t('payment.backToEvents', 'Về danh sách sự kiện')}
                  </Button>
                </div>
              </>
            )}

            {/* Error State */}
            {status === 'error' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="rounded-full bg-red-100 dark:bg-red-900 p-4">
                    <XCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-center mb-4 text-red-600 dark:text-red-400">
                  {t('payment.failed', 'Thanh toán thất bại')}
                </h1>
                <p className="text-center text-muted-foreground mb-8">
                  {message}
                </p>

                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('payment.errorHelpText', 'Nếu tiền đã bị trừ nhưng chưa nhận được vé, vui lòng liên hệ hỗ trợ với thông tin đơn hàng của bạn.')}
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => navigate('/orders')}
                    size="lg"
                  >
                    {t('payment.viewOrders', 'Xem đơn hàng')}
                  </Button>
                  <Button
                    onClick={() => navigate('/contact')}
                    variant="outline"
                    size="lg"
                  >
                    {t('payment.contactSupport', 'Liên hệ hỗ trợ')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentResult;

