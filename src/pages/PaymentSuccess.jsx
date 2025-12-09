import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Header from "../components/Header";

/**
 * PaymentSuccess Page
 * Hiển thị khi thanh toán thành công (redirect từ Backend after VNPAY callback)
 * 
 * Query params từ Backend:
 * - order_number: Order number
 * - amount: Số tiền (VND, đã nhân 100)
 * - transaction_no: VNPAY transaction number
 */
const PaymentSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const orderNumber = searchParams.get('order_number');
  const amount = searchParams.get('amount');
  const transactionNo = searchParams.get('transaction_no');

  // Format amount: VNPAY amount * 100
  const formatAmount = (amountStr) => {
    if (!amountStr) return '0';
    const amountVND = parseInt(amountStr) / 100;
    return amountVND.toLocaleString('vi-VN');
  };

  useEffect(() => {
    if (!orderNumber) {
      toast.error(t('payment.missingOrderInfo'));
      navigate('/orders');
      return;
    }

    // Show success toast
    toast.success(t('payment.successMessage'));
  }, [orderNumber, navigate, t]);

  const handleViewMyTickets = () => {
    navigate('/orders');
  };

  const handleViewOrderDetail = () => {
    // Need to get orderId from orderNumber
    // Option 1: Call API to get order by order_number
    // Option 2: Navigate to /orders and let user find it
    navigate('/orders');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="border-2 border-green-200 dark:border-green-900">
          <CardContent className="pt-12 pb-12">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
                <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-center mb-4">
              {t('payment.success.title', 'Thanh toán thành công!')}
            </h1>

            {/* Description */}
            <p className="text-center text-muted-foreground mb-8">
              {t('payment.success.description', 'Đơn hàng của bạn đã được thanh toán thành công. Vé điện tử đã được tạo và sẵn sàng sử dụng.')}
            </p>

            {/* Transaction Details */}
            <div className="bg-muted/50 rounded-lg p-6 mb-8 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t('order.orderNumber', 'Mã đơn hàng')}:
                </span>
                <span className="font-mono font-semibold">{orderNumber}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t('payment.amount', 'Số tiền')}:
                </span>
                <span className="font-semibold text-lg">
                  {formatAmount(amount)} VND
                </span>
              </div>

              {transactionNo && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {t('payment.transactionNo', 'Mã giao dịch')}:
                  </span>
                  <span className="font-mono text-sm">{transactionNo}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleViewMyTickets}
                className="flex-1"
                size="lg"
              >
                {t('payment.success.viewMyTickets', 'Xem vé của tôi')}
              </Button>

              <Button
                onClick={handleViewOrderDetail}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                {t('payment.success.viewOrderDetail', 'Chi tiết đơn hàng')}
              </Button>
            </div>

            {/* Info Notice */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('payment.success.emailNotice', 'Chúng tôi đã gửi xác nhận đến email của bạn.')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t('payment.success.supportNotice', 'Nếu có thắc mắc, vui lòng liên hệ hỗ trợ.')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

