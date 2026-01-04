import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * PaymentMethodSelector Component
 * Cho phép user chọn phương thức thanh toán: VNPAY hoặc PayOS
 * 
 * @param {string} value - Payment method hiện tại ("VNPAY" | "PAYOS")
 * @param {Function} onChange - Callback khi thay đổi method
 * @param {boolean} disabled - Disable selector
 */
const PaymentMethodSelector = ({ value = "PAYOS", onChange, disabled = false }) => {
  const { t } = useTranslation();

  const paymentMethods = [
    // {
    //   id: "PAYOS",
    //   name: "PayOS",
    //   description: t('payment.methods.payos.description', 'Banking, Momo, ZaloPay, QR Code'),
    //   icon: <Smartphone className="h-5 w-5" />,
    //   badge: {
    //     text: t('payment.methods.recommended', 'Khuyên dùng'),
    //     variant: "default"
    //   },
    //   features: [
    //     t('payment.methods.payos.feature1', 'Chuyển khoản ngân hàng'),
    //     t('payment.methods.payos.feature2', 'Ví Momo'),
    //     t('payment.methods.payos.feature3', 'Ví ZaloPay'),
    //     t('payment.methods.payos.feature4', 'QR Code (VietQR)'),
    //   ]
    // },
    {
      id: "VNPAY",
      name: "VNPAY",
      description: t('payment.methods.vnpay.description', 'Banking, Visa/MasterCard'),
      icon: <CreditCard className="h-5 w-5" />,
      badge: null,
      features: [
        t('payment.methods.vnpay.feature1', 'Thẻ ATM nội địa'),
        t('payment.methods.vnpay.feature2', 'Visa/MasterCard'),
        t('payment.methods.vnpay.feature3', 'Internet Banking'),
      ]
    },
  ];

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">
        {t('payment.selectMethod', 'Chọn phương thức thanh toán')}
      </Label>

      <div className="grid grid-cols-1 gap-4">
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            className={`cursor-pointer transition-all ${
              value === method.id
                ? 'border-primary border-2 bg-primary/5'
                : 'border-2 hover:border-primary/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onChange && onChange(method.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Radio button */}
                <input
                  type="radio"
                  id={method.id}
                  value={method.id}
                  checked={value === method.id}
                  onChange={(e) => !disabled && onChange && onChange(e.target.value)}
                  disabled={disabled}
                  className="mt-1 h-4 w-4 text-primary cursor-pointer"
                />

                {/* Icon */}
                <div className={`flex-shrink-0 rounded-lg p-2 ${
                  value === method.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {method.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Label 
                      htmlFor={method.id} 
                      className="text-base font-semibold cursor-pointer"
                    >
                      {method.name}
                    </Label>
                    {method.badge && (
                      <Badge variant={method.badge.variant} className="text-xs">
                        {method.badge.text}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {method.description}
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-2">
                    {method.features.map((feature, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-1 text-xs text-muted-foreground"
                      >
                        <Wallet className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;

