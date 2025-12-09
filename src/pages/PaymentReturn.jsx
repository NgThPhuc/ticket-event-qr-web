import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { checkPaymentStatus } from "../api/payment";
import Header from "../components/Header";

const PaymentReturn = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  
  const [status, setStatus] = useState('checking'); // 'checking' | 'success' | 'failed' | 'timeout'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    let pollCount = 0;
    const maxPolls = 20; // 20 polls × 3 seconds = 60 seconds timeout (theo Backend doc)
    
    const checkStatus = async () => {
      try {
        const paymentStatus = await checkPaymentStatus(orderId);
        
        if (paymentStatus.payment_status === 'PAID') {
          setStatus('success');
          // Redirect to order detail sau 2 giây
          setTimeout(() => {
            navigate(`/orders/${orderId}`);
          }, 2000);
          return true; // Stop polling
        } else if (paymentStatus.payment_status === 'FAILED') {
          setStatus('failed');
          setErrorMessage(t('payment.failedMessage'));
          return true; // Stop polling
        }
        
        // Vẫn đang UNPAID, tiếp tục poll
        pollCount++;
        if (pollCount >= maxPolls) {
          setStatus('timeout');
          setErrorMessage(t('payment.timeout'));
          return true; // Stop polling
        }
        
        return false; // Continue polling
      } catch (error) {
        console.error('Error checking payment status:', error);
        
        // Nếu lỗi 404 (order không tồn tại), dừng ngay
        if (error.status === 404) {
          setStatus('failed');
          setErrorMessage(t('order.errors.orderNotFound'));
          return true;
        }
        
        // Các lỗi khác, vẫn retry
        pollCount++;
        if (pollCount >= maxPolls) {
          setStatus('failed');
          setErrorMessage(error.message || t('common.error'));
          return true;
        }
        
        return false; // Continue polling
      }
    };

    // Initial check
    checkStatus().then(shouldStop => {
      if (shouldStop) return;
      
      // Setup polling interval
      const interval = setInterval(async () => {
        const shouldStop = await checkStatus();
        if (shouldStop) {
          clearInterval(interval);
        }
      }, 3000); // Poll every 3 seconds (theo Backend recommendations)

      // Cleanup
      return () => clearInterval(interval);
    });
  }, [orderId, navigate, t]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Checking Status */}
          {status === 'checking' && (
            <Card className="border-2 border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                  <div>
                    <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                      {t('payment.verifying')}
                    </h2>
                    <p className="text-blue-700 dark:text-blue-300">
                      {t('payment.pleaseWait')}
                    </p>
                  </div>
                  
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {t('payment.doNotClose')}
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Status */}
          {status === 'success' && (
            <Card className="border-2 border-green-500/50 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
                      {t('payment.success')}
                    </h2>
                    <p className="text-green-700 dark:text-green-300">
                      {t('payment.redirectingToTickets')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Failed Status */}
          {status === 'failed' && (
            <Card className="border-2 border-red-500/50 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <XCircle className="h-16 w-16 text-red-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">
                      {t('payment.failed')}
                    </h2>
                    <p className="text-red-700 dark:text-red-300">
                      {errorMessage}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
                    <Button
                      onClick={() => navigate(`/orders/${orderId}`)}
                      variant="outline"
                      className="flex-1"
                    >
                      {t('payment.viewOrder')}
                    </Button>
                    <Button
                      onClick={() => navigate('/events')}
                      className="flex-1"
                    >
                      {t('order.exploreEvents')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeout Status */}
          {status === 'timeout' && (
            <Card className="border-2 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <AlertCircle className="h-16 w-16 text-yellow-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                      {t('payment.timeout')}
                    </h2>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      {errorMessage}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      className="flex-1"
                    >
                      {t('payment.retry')}
                    </Button>
                    <Button
                      onClick={() => navigate(`/orders/${orderId}`)}
                      className="flex-1"
                    >
                      {t('payment.viewOrder')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentReturn;
