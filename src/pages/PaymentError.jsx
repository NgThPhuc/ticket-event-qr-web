import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";

/**
 * PaymentError Page
 * Hiển thị khi có lỗi xử lý thanh toán (redirect từ Backend)
 * 
 * Query params:
 * - reason: Lý do lỗi (invalid_signature, etc.)
 */
const PaymentError = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const reason = searchParams.get('reason') || 'unknown';

    const getErrorMessage = () => {
        switch (reason) {
            case 'invalid_signature':
                return {
                    title: t('payment.error.invalidSignature.title', 'Lỗi xác thực'),
                    message: t('payment.error.invalidSignature.message', 'Không thể xác thực giao dịch từ cổng thanh toán. Đây có thể là vấn đề bảo mật.'),
                    detail: 'Invalid signature from payment gateway'
                };
            case 'invalid_response':
                return {
                    title: t('payment.error.invalidResponse.title', 'Phản hồi không hợp lệ'),
                    message: t('payment.error.invalidResponse.message', 'Nhận được phản hồi không hợp lệ từ cổng thanh toán.'),
                    detail: 'Invalid response format'
                };
            case 'timeout':
                return {
                    title: t('payment.error.timeout.title', 'Hết thời gian chờ'),
                    message: t('payment.error.timeout.message', 'Không nhận được phản hồi từ cổng thanh toán trong thời gian quy định.'),
                    detail: 'Gateway timeout'
                };
            default:
                return {
                    title: t('payment.error.unknown.title', 'Lỗi xử lý thanh toán'),
                    message: t('payment.error.unknown.message', 'Đã có lỗi không xác định xảy ra trong quá trình xử lý thanh toán.'),
                    detail: `Error reason: ${reason}`
                };
        }
    };

    const errorInfo = getErrorMessage();

    const handleGoHome = () => {
        navigate('/');
    };

    const handleViewOrders = () => {
        navigate('/orders');
    };

    const handleContactSupport = () => {
        navigate('/contact');
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-12 max-w-2xl">
                <Card className="border-2 border-orange-200 dark:border-orange-900">
                    <CardContent className="pt-12 pb-12">
                        {/* Warning Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="rounded-full bg-orange-100 dark:bg-orange-900 p-4">
                                <AlertTriangle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
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

                        {/* Warning Alert */}
                        <Alert className="mb-8 border-orange-200 dark:border-orange-900">
                            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            <AlertDescription>
                                <strong className="block mb-1">
                                    {t('payment.error.importantNotice', 'Lưu ý quan trọng:')}
                                </strong>
                                <p className="text-sm">
                                    {t('payment.error.checkAccountNotice', 'Nếu tiền đã bị trừ khỏi tài khoản của bạn, vui lòng KHÔNG thực hiện lại giao dịch. Hãy liên hệ bộ phận hỗ trợ với thông tin bên dưới.')}
                                </p>
                            </AlertDescription>
                        </Alert>

                        {/* Error Details (for support) */}
                        <div className="bg-muted/50 rounded-lg p-4 mb-8">
                            <p className="text-xs text-muted-foreground mb-2">
                                {t('payment.error.technicalDetails', 'Chi tiết kỹ thuật (cho bộ phận hỗ trợ):')}
                            </p>
                            <code className="text-xs font-mono block bg-background p-2 rounded">
                                {errorInfo.detail}
                            </code>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleContactSupport}
                                className="gap-2"
                                size="lg"
                                variant="default"
                            >
                                <Mail className="h-4 w-4" />
                                {t('payment.error.contactSupport', 'Liên hệ hỗ trợ')}
                            </Button>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={handleViewOrders}
                                    variant="outline"
                                    className="flex-1"
                                    size="lg"
                                >
                                    {t('payment.error.viewOrders', 'Xem đơn hàng')}
                                </Button>

                                <Button
                                    onClick={handleGoHome}
                                    variant="outline"
                                    className="flex-1 gap-2"
                                    size="lg"
                                >
                                    <Home className="h-4 w-4" />
                                    {t('payment.error.goHome', 'Về trang chủ')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Support Information */}
                <div className="mt-6">
                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-3">
                                {t('payment.error.supportInfo.title', 'Thông tin hỗ trợ:')}
                            </h3>
                            <div className="space-y-2 text-sm">
                                <p>
                                    <strong>{t('payment.error.supportInfo.email', 'Email')}:</strong>{' '}
                                    <a href="mailto:support@ticketcrate.vn" className="text-primary hover:underline">
                                        support@ticketcrate.vn
                                    </a>
                                </p>
                                <p>
                                    <strong>{t('payment.error.supportInfo.phone', 'Hotline')}:</strong>{' '}
                                    <a href="tel:1900xxxx" className="text-primary hover:underline">
                                        1900 xxxx
                                    </a>
                                </p>
                                <p className="text-muted-foreground text-xs mt-4">
                                    {t('payment.error.supportInfo.hours', 'Thời gian hỗ trợ: 8:00 - 22:00 hàng ngày')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PaymentError;

