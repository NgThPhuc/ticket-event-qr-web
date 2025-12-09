import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
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

// VNPAY Response Codes mapping
const VNPAY_ERROR_MESSAGES = {
  '07': {
    title: 'Giao dịch nghi vấn',
    message: 'Giao dịch đã trừ tiền nhưng có vấn đề. Vui lòng liên hệ ngân hàng hoặc hỗ trợ.',
    canRetry: false,
    severity: 'warning'
  },
  '09': {
    title: 'Thẻ chưa đăng ký dịch vụ',
    message: 'Thẻ/Tài khoản chưa đăng ký dịch vụ Internet Banking tại ngân hàng.',
    canRetry: true,
    severity: 'error'
  },
  '10': {
    title: 'Thông tin không đúng',
    message: 'Thông tin thẻ/tài khoản không đúng. Vui lòng kiểm tra lại.',
    canRetry: true,
    severity: 'error'
  },
  '11': {
    title: 'Thẻ hết hạn',
    message: 'Thẻ của bạn đã hết hạn. Vui lòng sử dụng thẻ khác.',
    canRetry: true,
    severity: 'error'
  },
  '12': {
    title: 'Thẻ bị khóa',
    message: 'Thẻ của bạn đã bị khóa. Vui lòng liên hệ ngân hàng.',
    canRetry: false,
    severity: 'error'
  },
  '24': {
    title: 'Giao dịch bị hủy',
    message: 'Bạn đã hủy giao dịch thanh toán.',
    canRetry: true,
    severity: 'info'
  },
  '51': {
    title: 'Không đủ số dư',
    message: 'Tài khoản không đủ số dư để thực hiện giao dịch.',
    canRetry: true,
    severity: 'error'
  },
  '65': {
    title: 'Vượt quá số lần nhập OTP',
    message: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng thử lại sau.',
    canRetry: true,
    severity: 'error'
  },
  '75': {
    title: 'Ngân hàng đang bảo trì',
    message: 'Ngân hàng đang bảo trì. Vui lòng thử lại sau.',
    canRetry: true,
    severity: 'warning'
  },
  '79': {
    title: 'Vượt quá số lần thanh toán',
    message: 'Bạn đã vượt quá số lần thanh toán cho phép trong ngày. Vui lòng thử lại vào ngày mai.',
    canRetry: false,
    severity: 'error'
  },
  'default': {
    title: 'Thanh toán thất bại',
    message: 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.',
    canRetry: true,
    severity: 'error'
  }
};

const PaymentFailure = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const code = searchParams.get('code') || 'default';
  const [errorInfo, setErrorInfo] = useState(VNPAY_ERROR_MESSAGES['default']);

  useEffect(() => {
    // Get error message based on code
    const info = VNPAY_ERROR_MESSAGES[code] || VNPAY_ERROR_MESSAGES['default'];
    setErrorInfo(info);
  }, [code]);

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

