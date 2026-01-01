import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";

/**
 * PaymentFailure Page
 * Hiển thị khi thanh toán thất bại (redirect từ Backend)
 * 
 * Query params:
 * - code: VNPAY response code
 */

// VNPAY Response Codes với metadata (không chứa hardcoded text)
const VNPAY_ERROR_CONFIG = {
  '07': { canRetry: false, severity: 'warning' },
  '09': { canRetry: true, severity: 'error' },
  '10': { canRetry: true, severity: 'error' },
  '11': { canRetry: true, severity: 'error' },
  '12': { canRetry: false, severity: 'error' },
  '24': { canRetry: true, severity: 'info' },
  '51': { canRetry: true, severity: 'error' },
  '65': { canRetry: true, severity: 'error' },
  '75': { canRetry: true, severity: 'warning' },
  '79': { canRetry: false, severity: 'error' },
  'default': { canRetry: true, severity: 'error' }
};

const PaymentFailure = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const code = searchParams.get('code') || 'default';
  
  // Lấy config cho error code
  const getErrorConfig = (errorCode) => {
    return VNPAY_ERROR_CONFIG[errorCode] || VNPAY_ERROR_CONFIG['default'];
  };

  // Lấy title và message từ i18n
  const getErrorInfo = (errorCode) => {
    const config = getErrorConfig(errorCode);
    const translationCode = VNPAY_ERROR_CONFIG[errorCode] ? errorCode : 'default';
    
    return {
      title: t(`payment.vnpayErrors.${translationCode}.title`),
      message: t(`payment.vnpayErrors.${translationCode}.message`),
      ...config
    };
  };

  const errorInfo = getErrorInfo(code);

  const handleRetry = () => {
    // Go back to orders page where user can retry payment
    navigate('/orders');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleContactSupport = () => {
    navigate('/contact');
  };

  const getSeverityColor = () => {
    switch (errorInfo.severity) {
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-900';
      case 'info':
        return 'border-blue-200 dark:border-blue-900';
      case 'error':
      default:
        return 'border-red-200 dark:border-red-900';
    }
  };

  const getIconColor = () => {
    switch (errorInfo.severity) {
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900';
      case 'info':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900';
      case 'error':
      default:
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className={`border-2 ${getSeverityColor()}`}>
          <CardContent className="pt-12 pb-12">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className={`rounded-full p-4 ${getIconColor()}`}>
                <AlertCircle className="h-16 w-16" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-center mb-4">
              {errorInfo.title}
            </h1>

            {/* Description */}
            <p className="text-center text-muted-foreground mb-8">
              {errorInfo.message}
            </p>

            {/* Error Code */}
            {code !== 'default' && (
              <div className="text-center mb-8">
                <span className="text-sm text-muted-foreground">
                  {t('payment.errorCode', 'Mã lỗi')}: <code className="font-mono">{code}</code>
                </span>
              </div>
            )}

            {/* Info Alert */}
            {errorInfo.severity === 'warning' && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('payment.failure.contactBankNotice', 'Nếu tiền đã bị trừ nhưng chưa nhận được vé, vui lòng liên hệ ngân hàng hoặc bộ phận hỗ trợ của chúng tôi trong vòng 24 giờ.')}
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {errorInfo.canRetry && (
                <Button
                  onClick={handleRetry}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t('payment.failure.tryAgain', 'Thử lại')}
                </Button>
              )}

              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex-1 gap-2"
                size="lg"
              >
                <Home className="h-4 w-4" />
                {t('payment.failure.goHome', 'Về trang chủ')}
              </Button>
            </div>

            {/* Support Link */}
            {!errorInfo.canRetry && (
              <div className="mt-6 text-center">
                <Button
                  onClick={handleContactSupport}
                  variant="link"
                  className="text-sm"
                >
                  {t('payment.failure.contactSupport', 'Liên hệ hỗ trợ')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Help */}
        <div className="mt-6">
          <Alert>
            <AlertDescription>
              <strong>{t('payment.failure.helpTitle', 'Cần trợ giúp?')}</strong>
              <p className="mt-1 text-sm">
                {t('payment.failure.helpMessage', 'Vui lòng kiểm tra thông tin thẻ, số dư tài khoản hoặc liên hệ ngân hàng của bạn để được hỗ trợ.')}
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;

