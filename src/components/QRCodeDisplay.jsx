import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket } from "lucide-react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";

/**
 * QRCodeDisplay Component
 * Hiển thị QR code cho một vé cùng thông tin chi tiết
 * 
 * @param {string} qrPayload - String để encode thành QR code
 * @param {string} ticketSerial - Mã vé hiển thị
 * @param {string} attendeeName - Tên người tham dự
 * @param {Object} ticketType - Loại vé (optional)
 * @param {string} checkinStatus - Trạng thái check-in (optional)
 */
const QRCodeDisplay = ({
  qrPayload,
  ticketSerial,
  attendeeName,
  ticketType,
  checkinStatus
}) => {
  const { t } = useTranslation();

  if (!qrPayload) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>{t('order.errors.orderNotFound')}</p>
        </CardContent>
      </Card>
    );
  }

  const getCheckinBadge = (status) => {
    switch (status) {
      case 'CHECKED_IN':
        return <Badge variant="success">{t('order.checkin.CHECKED_IN')}</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">{t('order.checkin.CANCELLED')}</Badge>;
      case 'NOT_CHECKED_IN':
      default:
        return <Badge variant="secondary">{t('order.checkin.NOT_CHECKED_IN')}</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-lg">
            <QRCode
              value={qrPayload}
              size={200}
              level="H"
              fgColor="#000000"
            />
          </div>

          {/* Ticket Serial */}
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">{t('order.ticketSerial')}</p>
            <p className="font-mono font-semibold text-lg tracking-wider">{ticketSerial}</p>
          </div>

          {/* Attendee Name */}
          <div className="text-center space-y-1 w-full">
            <p className="text-xs text-muted-foreground">{t('order.attendeeName')}</p>
            <p className="font-medium text-base">{attendeeName}</p>
          </div>

          {/* Ticket Type */}
          {ticketType && (
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{ticketType.name}</span>
            </div>
          )}

          {/* Check-in Status */}
          {checkinStatus && (
            <div className="pt-2">
              {getCheckinBadge(checkinStatus)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeDisplay;
