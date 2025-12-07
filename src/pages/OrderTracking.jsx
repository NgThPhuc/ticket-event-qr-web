import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Calendar, MapPin, Package, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trackOrder } from "../api/orders";
import Header from "../components/Header";
import QRCodeDisplay from "../components/QRCodeDisplay";

const OrderTracking = () => {
  const { t } = useTranslation();
  
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!orderNumber || orderNumber.trim() === '') {
      setError(t('order.errors.orderNumberRequired'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSearched(false);
      const data = await trackOrder(orderNumber.trim());
      setOrder(data);
      setSearched(true);
    } catch (err) {
      console.error('Error tracking order:', err);
      setError(err.message || t('order.errors.orderNotFound'));
      setOrder(null);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return parseInt(price).toLocaleString('vi-VN') + ' VND';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: 'secondary',
      CONFIRMED: 'default',
      CANCELLED: 'destructive',
      COMPLETED: 'success'
    };
    return <Badge variant={variants[status] || 'secondary'}>{t(`order.status.${status}`)}</Badge>;
  };

  const getPaymentStatusBadge = (status) => {
    const variants = {
      UNPAID: 'destructive',
      PAID: 'success',
      REFUNDED: 'secondary'
    };
    return <Badge variant={variants[status] || 'secondary'}>{t(`order.paymentStatus.${status}`)}</Badge>;
  };

  // Mask email for privacy
  const maskEmail = (email) => {
    if (!email) return '-';
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 3) return email;
    const masked = localPart.substring(0, 2) + '***' + localPart.substring(localPart.length - 1);
    return `${masked}@${domain}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <Package className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">{t('order.orderTracking')}</h1>
            <p className="text-muted-foreground">
              {t('order.enterOrderNumber')}
            </p>
          </div>

          {/* Search Form */}
          <Card>
            <CardHeader>
              <CardTitle>{t('order.trackButton')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderNumber">{t('order.orderNumber')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="orderNumber"
                    value={orderNumber}
                    onChange={(e) => {
                      setOrderNumber(e.target.value);
                      setError('');
                    }}
                    placeholder="ORD-1706150000-ABC123456"
                    className="font-mono"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                  />
                  <Button onClick={handleSearch} disabled={loading}>
                    <Search className="mr-2 h-4 w-4" />
                    {loading ? t('common.loading') : t('order.trackButton')}
                  </Button>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Results */}
          {searched && !loading && order && (
            <div className="space-y-6">
              {/* Order Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{t('order.orderInfo')}</CardTitle>
                      <p className="text-sm text-muted-foreground font-mono mt-1">{order.order_number}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(order.status)}
                      {getPaymentStatusBadge(order.payment_status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Event Info */}
                  {order.event && (
                    <div>
                      <h3 className="font-semibold text-xl mb-2">{order.event.title}</h3>
                      
                      {order.event.start_at && (
                        <div className="flex items-start gap-2 mb-2">
                          <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">{t('event.startAt')}</p>
                            <p className="font-medium">{formatDate(order.event.start_at)}</p>
                          </div>
                        </div>
                      )}

                      {order.event.venue_name && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">{t('event.location')}</p>
                            <p className="font-medium">{order.event.venue_name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator />

                  {/* Order Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('order.quantity')}</span>
                      <span>{order.quantity} {t('order.tickets')}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-semibold">{t('order.totalAmount')}</span>
                      <span className="text-xl font-bold text-primary">{formatPrice(order.total_amount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tickets */}
              {order.tickets && order.tickets.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('order.tickets')} ({order.tickets.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {order.tickets.map((ticket, index) => (
                        <QRCodeDisplay
                          key={ticket.id}
                          qrPayload={ticket.qr_payload}
                          ticketSerial={ticket.ticket_serial}
                          attendeeName={ticket.attendee_name}
                          ticketType={ticket.ticket_type}
                          checkinStatus={ticket.checkin_status}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Privacy Notice */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {t('order.paymentNote')}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* No Results */}
          {searched && !loading && !order && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
