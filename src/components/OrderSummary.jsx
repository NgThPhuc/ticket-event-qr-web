import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Tag, Ticket } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * OrderSummary Component
 * Hiển thị tóm tắt đơn hàng với thông tin event, ticket type, số lượng và tổng tiền
 * 
 * @param {Object} event - Event object
 * @param {Object} ticketType - Ticket type object
 * @param {number} quantity - Số lượng vé
 * @param {number} donationAmount - Số tiền donation (nếu có)
 * @param {number} totalAmount - Tổng tiền
 */
const OrderSummary = ({ event, ticketType, quantity, donationAmount, totalAmount }) => {
  const { t } = useTranslation();

  if (!event || !ticketType) return null;

  const formatPrice = (price) => {
    return parseInt(price).toLocaleString('vi-VN') + ' VND';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Tính giá mỗi vé
  const pricePerTicket = ticketType.is_donation && donationAmount
    ? donationAmount
    : ticketType.is_free
    ? 0
    : parseInt(ticketType.price || 0);

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          {t('order.orderSummary')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event Info */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{t('order.eventInfo')}</p>
          {event.cover_image_url && (
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-32 object-cover rounded-lg"
            />
          )}
          <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>
          
          {event.start_at && (
            <div className="flex items-start gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{formatDate(event.start_at)}</span>
            </div>
          )}
          
          {event.venue_name && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground line-clamp-2">{event.venue_name}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Ticket Type Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">{t('order.ticketType')}</p>
            {ticketType.is_free && (
              <Badge variant="secondary">{t('ticket.free')}</Badge>
            )}
            {ticketType.is_donation && (
              <Badge variant="secondary">{t('ticket.donation')}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{ticketType.name}</span>
          </div>
          {ticketType.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{ticketType.description}</p>
          )}
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {ticketType.is_free
                ? t('ticket.free')
                : ticketType.is_donation
                ? t('order.donationPerTicket')
                : t('ticket.price')}
            </span>
            <span className="font-medium">
              {ticketType.is_free ? t('ticket.free') : formatPrice(pricePerTicket)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('order.quantity')}</span>
            <span className="font-medium">× {quantity}</span>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">{t('order.totalAmount')}</span>
            <span className="text-2xl font-bold text-primary">
              {totalAmount === 0 ? t('ticket.free') : formatPrice(totalAmount)}
            </span>
          </div>

          {/* Donation Note */}
          {ticketType.is_donation && donationAmount && (
            <p className="text-xs text-muted-foreground italic">
              {formatPrice(donationAmount)} × {quantity} {t('order.tickets')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderSummary;
