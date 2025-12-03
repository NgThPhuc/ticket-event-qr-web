import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Tag, Ticket, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * TicketCard Component
 * Hiển thị thông tin chi tiết của một loại vé
 * 
 * @param {Object} ticket - Thông tin ticket type
 * @param {Function} onBuyClick - Callback khi click nút Đặt vé
 * @param {boolean} disabled - Disable nút đặt vé
 */
const TicketCard = ({ ticket, onBuyClick, disabled = false }) => {
  const { t } = useTranslation();

  // Format price
  const formatPrice = (price, isFree, isDonation) => {
    if (isFree) {
      return t('ticket.free') || 'MIỄN PHÍ';
    }
    if (isDonation) {
      return t('ticket.donation') || 'QUYÊN GÓP';
    }
    return `${parseInt(price).toLocaleString('vi-VN')} VND`;
  };

  // Format sale period
  const formatSalePeriod = (startAt, endAt) => {
    if (!startAt || !endAt) return null;
    
    const start = new Date(startAt);
    const end = new Date(endAt);
    const now = new Date();

    if (now < start) {
      return {
        text: t('ticket.saleNotStarted') || 'Chưa bắt đầu bán',
        variant: 'secondary'
      };
    }

    if (now > end) {
      return {
        text: t('ticket.saleEnded') || 'Đã kết thúc bán',
        variant: 'destructive'
      };
    }

    // Calculate time remaining
    const timeLeft = end - now;
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 3) {
      return {
        text: `${t('ticket.lastDays') || 'Còn'} ${daysLeft} ${t('ticket.days') || 'ngày'}`,
        variant: 'destructive'
      };
    }

    return null;
  };

  // Calculate percentage sold
  const percentageSold = ticket.percentage_sold || 
    (ticket.quantity_total > 0 ? Math.round((ticket.quantity_sold / ticket.quantity_total) * 100) : 0);

  const salePeriodInfo = formatSalePeriod(ticket.sale_start_at, ticket.sale_end_at);
  const isAvailable = ticket.is_on_sale && !ticket.is_sold_out;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              {ticket.name}
            </CardTitle>
            {ticket.description && (
              <CardDescription className="mt-2 text-sm">
                {ticket.description}
              </CardDescription>
            )}
          </div>
          
          {/* Sale period badge */}
          {salePeriodInfo && (
            <Badge variant={salePeriodInfo.variant} className="gap-1 whitespace-nowrap">
              <Clock className="h-3 w-3" />
              {salePeriodInfo.text}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {t('ticket.price') || 'Giá vé'}:
            </span>
          </div>
          <div className="text-2xl font-bold text-primary">
            {formatPrice(ticket.price, ticket.is_free, ticket.is_donation)}
          </div>
        </div>

        {/* Donation note */}
        {ticket.is_donation && (
          <div className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded">
            {t('ticket.donationNote') || '* Bạn có thể tự chọn số tiền quyên góp khi đặt vé'}
          </div>
        )}

        {/* Quantity info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {t('ticket.availability') || 'Tình trạng'}:
            </span>
            <span className="font-medium">
              {ticket.is_sold_out ? (
                <Badge variant="destructive">{t('ticket.soldOut') || 'Hết vé'}</Badge>
              ) : (
                <span className="text-green-600 dark:text-green-400">
                  {t('ticket.available') || 'Còn'} {ticket.quantity_available} {t('ticket.tickets') || 'vé'}
                </span>
              )}
            </span>
          </div>

          {/* Progress bar */}
          {ticket.quantity_total > 0 && (
            <div className="space-y-1">
              <Progress value={percentageSold} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('ticket.sold') || 'Đã bán'}: {ticket.quantity_sold || 0}</span>
                <span>{t('ticket.total') || 'Tổng'}: {ticket.quantity_total}</span>
              </div>
            </div>
          )}
        </div>

        {/* Min/Max per order */}
        {(ticket.per_order_min > 1 || ticket.per_order_max) && (
          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
            {ticket.per_order_min > 1 && (
              <div>• {t('ticket.minPerOrder') || 'Tối thiểu'}: {ticket.per_order_min} {t('ticket.tickets') || 'vé'}</div>
            )}
            {ticket.per_order_max && (
              <div>• {t('ticket.maxPerOrder') || 'Tối đa'}: {ticket.per_order_max} {t('ticket.tickets') || 'vé'}/đơn</div>
            )}
          </div>
        )}

        {/* Buy button */}
        <Button
          onClick={() => onBuyClick && onBuyClick(ticket)}
          disabled={disabled || !isAvailable}
          className="w-full"
          size="lg"
        >
          {ticket.is_sold_out 
            ? (t('ticket.soldOut') || 'Hết vé')
            : !ticket.is_on_sale
            ? (t('ticket.notOnSale') || 'Chưa mở bán')
            : (t('ticket.buyNow') || 'Đặt vé ngay')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TicketCard;
