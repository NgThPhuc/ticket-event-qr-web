import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * AttendeeForm Component
 * Form để nhập thông tin chi tiết cho một người tham dự
 * 
 * @param {number} index - Thứ tự vé (1, 2, 3...)
 * @param {Object} value - {name, email, phone, donationAmount}
 * @param {Function} onChange - Callback khi thay đổi thông tin
 * @param {boolean} isDonation - Có phải vé donation không
 * @param {Object} errors - Object chứa các lỗi validation
 */
const AttendeeForm = ({ index, value = {}, onChange, isDonation = false, errors = {} }) => {
  const { t } = useTranslation();

  const handleFieldChange = (field, fieldValue) => {
    onChange({
      ...value,
      [field]: fieldValue
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg">
          {t('order.ticketNumber', { number: index })}
        </h4>
      </div>

      {/* Tên người tham dự */}
      <div className="space-y-2">
        <Label htmlFor={`attendee-name-${index}`}>
          {t('order.attendeeName')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`attendee-name-${index}`}
          value={value.name || ''}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          placeholder={t('order.attendeeName')}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor={`attendee-email-${index}`}>
          {t('order.attendeeEmail')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`attendee-email-${index}`}
          type="email"
          value={value.email || ''}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          placeholder="email@example.com"
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      {/* Số điện thoại (optional) */}
      <div className="space-y-2">
        <Label htmlFor={`attendee-phone-${index}`}>
          {t('order.attendeePhone')} <span className="text-muted-foreground text-xs">(Optional)</span>
        </Label>
        <Input
          id={`attendee-phone-${index}`}
          type="tel"
          value={value.phone || ''}
          onChange={(e) => handleFieldChange('phone', e.target.value)}
          placeholder="0987654321"
          className={errors.phone ? 'border-destructive' : ''}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone}</p>
        )}
      </div>

      {/* Donation amount (nếu là vé donation) */}
      {isDonation && (
        <div className="space-y-2">
          <Label htmlFor={`donation-amount-${index}`}>
            {t('order.donationPerTicket')} (VND) <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`donation-amount-${index}`}
            type="number"
            min="1"
            step="1000"
            value={value.donationAmount || ''}
            onChange={(e) => handleFieldChange('donationAmount', e.target.value)}
            placeholder="50000"
            className={errors.donationAmount ? 'border-destructive' : ''}
          />
          {errors.donationAmount && (
            <p className="text-sm text-destructive">{errors.donationAmount}</p>
          )}
          <Alert className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t('ticket.donationNote')}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default AttendeeForm;
