import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle, Clock, Ticket, User, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Modal hiển thị kết quả check-in
 * @param {boolean} open - Modal open state
 * @param {Function} onClose - Callback khi đóng modal
 * @param {Object} result - Kết quả check-in từ API
 * @param {boolean} result.valid - Check-in thành công hay không
 * @param {Object} result.ticket - Thông tin vé
 * @param {string} result.message - Message từ server
 * @param {string} result.reason - Lý do lỗi (nếu có)
 * @param {number} autoCloseMs - Thời gian tự động đóng (ms), 0 = không tự đóng
 */
export function CheckInResultModal({ open, onClose, result, autoCloseMs = 3000 }) {
  const { t } = useTranslation();

  // Auto close after timeout
  useEffect(() => {
    if (open && autoCloseMs > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [open, autoCloseMs, onClose]);

  // Play sound effect
  useEffect(() => {
    if (open && result) {
      try {
        const audio = new Audio(
          result.valid
            ? '/sounds/success.mp3'
            : '/sounds/error.mp3'
        );
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Ignore audio play errors (autoplay policy)
        });
      } catch (e) {
        // Ignore audio errors
      }
    }
  }, [open, result]);

  if (!result) return null;

  const { valid, ticket, message, reason } = result;

  // Determine colors and icons based on result
  const getResultConfig = () => {
    if (valid) {
      return {
        bgColor: 'bg-green-500',
        borderColor: 'border-green-500',
        textColor: 'text-green-600 dark:text-green-400',
        icon: CheckCircle,
        iconColor: 'text-green-500',
        title: t('checkin.result.success', 'Check-in thành công!'),
      };
    }

    // Error states
    switch (reason) {
      case 'ALREADY_USED':
        return {
          bgColor: 'bg-yellow-500',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          icon: AlertTriangle,
          iconColor: 'text-yellow-500',
          title: t('checkin.result.alreadyUsed', 'Vé đã được sử dụng'),
        };
      case 'NOT_FOUND':
        return {
          bgColor: 'bg-red-500',
          borderColor: 'border-red-500',
          textColor: 'text-red-600 dark:text-red-400',
          icon: XCircle,
          iconColor: 'text-red-500',
          title: t('checkin.result.notFound', 'Không tìm thấy vé'),
        };
      case 'REVOKED':
        return {
          bgColor: 'bg-red-500',
          borderColor: 'border-red-500',
          textColor: 'text-red-600 dark:text-red-400',
          icon: XCircle,
          iconColor: 'text-red-500',
          title: t('checkin.result.revoked', 'Vé đã bị thu hồi'),
        };
      case 'REFUNDED':
        return {
          bgColor: 'bg-red-500',
          borderColor: 'border-red-500',
          textColor: 'text-red-600 dark:text-red-400',
          icon: XCircle,
          iconColor: 'text-red-500',
          title: t('checkin.result.refunded', 'Vé đã hoàn tiền'),
        };
      case 'EVENT_NOT_PUBLISHED':
        return {
          bgColor: 'bg-yellow-500',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          icon: AlertTriangle,
          iconColor: 'text-yellow-500',
          title: t('checkin.result.eventNotPublished', 'Sự kiện chưa mở cửa'),
        };
      default:
        return {
          bgColor: 'bg-red-500',
          borderColor: 'border-red-500',
          textColor: 'text-red-600 dark:text-red-400',
          icon: XCircle,
          iconColor: 'text-red-500',
          title: t('checkin.result.error', 'Lỗi check-in'),
        };
    }
  };

  const config = getResultConfig();
  const Icon = config.icon;

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-md border-t-4 ${config.borderColor}`}>
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${config.bgColor}/10`}>
              <Icon className={`w-16 h-16 ${config.iconColor}`} />
            </div>
          </div>
          <DialogTitle className={`text-2xl font-bold ${config.textColor}`}>
            {config.title}
          </DialogTitle>
        </DialogHeader>

        {/* Ticket info */}
        {ticket && (
          <div className="space-y-4 mt-4">
            {/* Attendee name */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('checkin.result.attendee', 'Người tham dự')}
                </p>
                <p className="font-semibold text-lg">
                  {ticket.attendee_name}
                </p>
              </div>
            </div>

            {/* Ticket type */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Ticket className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('checkin.result.ticketType', 'Loại vé')}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{ticket.ticket_type_name}</Badge>
                  <span className="text-sm text-gray-500">
                    {ticket.ticket_serial}
                  </span>
                </div>
              </div>
            </div>

            {/* Check-in time (for already used tickets) */}
            {ticket.checked_in_at && !valid && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    {t('checkin.result.previousCheckIn', 'Đã check-in lúc')}
                  </p>
                  <p className="font-medium text-yellow-700 dark:text-yellow-300">
                    {formatTime(ticket.checked_in_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message */}
        {message && (
          <p className={`text-center mt-4 font-medium ${config.textColor}`}>
            {valid ? '🎉 ' : ''}{message}
          </p>
        )}

        {/* Auto close indicator */}
        {autoCloseMs > 0 && (
          <div className="mt-4">
            <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${config.bgColor} animate-shrink`}
                style={{
                  animation: `shrink ${autoCloseMs}ms linear forwards`,
                }}
              />
            </div>
          </div>
        )}

        <style>{`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}

export default CheckInResultModal;
