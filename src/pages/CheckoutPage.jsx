import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Globe,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  Sparkles,
  Ticket,
  User
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createOrder } from "../api/orders";

const CheckoutPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const { event, selectedTicket } = location.state || {};

  const [quantity, setQuantity] = useState(selectedTicket?.per_order_min || 1);
  const [attendees, setAttendees] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const minQuantity = selectedTicket?.per_order_min || 1;
  const maxQuantity = selectedTicket?.per_order_max || 10;

  useEffect(() => {
    const newAttendees = Array.from({ length: quantity }, (_, i) => attendees[i] || {
      name: '',
      email: '',
      phone: '',
      donationAmount: selectedTicket?.is_donation ? '' : undefined
    });
    setAttendees(newAttendees);
  }, [quantity]);

  useEffect(() => {
    if (!event || !selectedTicket) {
      toast.error(t('order.errors.orderNotFound'));
      navigate('/events');
    }
  }, [event, selectedTicket, navigate, t]);

  if (!event || !selectedTicket) {
    return null;
  }

  const formatPrice = (price) => {
    if (!price || price === 0) return t("ticket.free");
    return new Intl.NumberFormat(t("common.locale"), {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(t("common.locale"), {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString(t("common.locale"), {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const calculateTotalAmount = () => {
    if (selectedTicket.is_free) return 0;
    if (selectedTicket.is_donation) {
      return attendees.reduce((sum, attendee) => {
        return sum + (parseFloat(attendee.donationAmount) || 0);
      }, 0);
    }
    return parseFloat(selectedTicket.price) * quantity;
  };

  const totalAmount = calculateTotalAmount();

  const validateAttendee = (attendee) => {
    const attendeeErrors = {};
    if (!attendee.name?.trim()) attendeeErrors.name = t('order.errors.nameRequired');
    if (!attendee.email?.trim()) {
      attendeeErrors.email = t('order.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendee.email)) {
      attendeeErrors.email = t('order.errors.emailInvalid');
    }
    if (attendee.phone && !/^[0-9]{10,11}$/.test(attendee.phone.replace(/\s/g, ''))) {
      attendeeErrors.phone = t('order.errors.phoneInvalid');
    }
    if (selectedTicket.is_donation) {
      const amount = parseFloat(attendee.donationAmount);
      if (!attendee.donationAmount || isNaN(amount) || amount <= 0) {
        attendeeErrors.donationAmount = t('order.errors.donationPositive');
      }
    }
    return attendeeErrors;
  };

  const validateForm = () => {
    const newErrors = {};
    let hasErrors = false;

    attendees.forEach((attendee, index) => {
      const attendeeErrors = validateAttendee(attendee);
      if (Object.keys(attendeeErrors).length > 0) {
        newErrors[`attendee_${index}`] = attendeeErrors;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleAttendeeChange = (index, field, value) => {
    const newAttendees = [...attendees];
    newAttendees[index] = { ...newAttendees[index], [field]: value };
    setAttendees(newAttendees);

    if (errors[`attendee_${index}`]?.[field]) {
      const newErrors = { ...errors };
      delete newErrors[`attendee_${index}`][field];
      if (Object.keys(newErrors[`attendee_${index}`]).length === 0) {
        delete newErrors[`attendee_${index}`];
      }
      setErrors(newErrors);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error(t('order.errors.attendeesRequired', { count: quantity }));
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        event_id: event.id,
        payment_method: 'VNPAY',
        items: [{
          ticket_type_id: selectedTicket.id,
          quantity: quantity,
          attendees: attendees.map(a => ({
            name: a.name,
            email: a.email,
            phone: a.phone || undefined
          })),
          donation_amount: selectedTicket.is_donation ? parseFloat(attendees[0].donationAmount) : undefined
        }]
      };

      const order = await createOrder(orderData);
      toast.success(t('order.orderSuccess'));
      navigate(`/order-success/${order.id}`, { state: { order, event } });
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.message || t('order.errors.createOrderFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f23] text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">{t('common.back')}</span>
          </button>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-green-400" />
            <span className="text-sm text-white/60">{t('order.secureCheckout')}</span>
          </div>
        </div>
      </header>

      <div className="relative z-10 container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Event Card */}
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
              <div className="p-5">
                <div className="flex gap-4">
                  {event.cover_image_url ? (
                    <img
                      src={event.cover_image_url}
                      alt={event.title}
                      className="w-20 h-20 rounded-xl object-cover ring-2 ring-white/20"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg line-clamp-2 mb-2">{event.title}</h2>
                    <div className="flex flex-wrap gap-3 text-sm text-white/60">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-purple-400" />
                        {formatDate(event.start_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-purple-400" />
                        {formatTime(event.start_at)}
                      </span>
                    </div>
                    {event.venue_name && (
                      <p className="flex items-center gap-1.5 text-sm text-white/60 mt-1">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        <span className="truncate">{event.venue_name}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Selection */}
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
              <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                {t('order.ticketType')}
              </h3>
              
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{selectedTicket.name}</p>
                    {selectedTicket.description && (
                      <p className="text-sm text-white/50 mt-0.5">{selectedTicket.description}</p>
                    )}
                    {selectedTicket.is_donation && (
                      <Badge className="mt-2 bg-orange-500/20 text-orange-300 border-orange-500/30">
                        {t('ticket.donation')}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {selectedTicket.is_free ? t('ticket.free') : formatPrice(selectedTicket.price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-5">
                <Label className="text-sm text-white/60 mb-2 block">{t('order.quantity')}</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-xl bg-white/5 border border-white/10">
                    <button
                      onClick={() => quantity > minQuantity && setQuantity(q => q - 1)}
                      disabled={quantity <= minQuantity}
                      className="w-12 h-12 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-l-xl"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-16 text-center text-xl font-bold">{quantity}</span>
                    <button
                      onClick={() => quantity < maxQuantity && setQuantity(q => q + 1)}
                      disabled={quantity >= maxQuantity}
                      className="w-12 h-12 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-r-xl"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  <span className="text-sm text-white/40">
                    {minQuantity} - {maxQuantity} {t('order.tickets')}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendee Forms */}
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('order.attendeeInfo')}
                </h3>
                <Badge className="bg-white/10 text-white/60 border-white/20">
                  {quantity} {t('order.tickets')}
                </Badge>
              </div>

              <div className="space-y-4">
                {attendees.map((attendee, index) => (
                  <div
                    key={index}
                    className={`rounded-xl border p-5 transition-all ${
                      errors[`attendee_${index}`]
                        ? 'border-red-500/50 bg-red-500/5'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{t('order.ticketNumber', { number: index + 1 })}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-white/60 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {t('order.attendeeName')} <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          value={attendee.name || ''}
                          onChange={(e) => handleAttendeeChange(index, 'name', e.target.value)}
                          placeholder={t('order.attendeeName')}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500 focus:ring-purple-500/20"
                        />
                        {errors[`attendee_${index}`]?.name && (
                          <p className="text-xs text-red-400">{errors[`attendee_${index}`].name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm text-white/60 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          {t('order.attendeeEmail')} <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          type="email"
                          value={attendee.email || ''}
                          onChange={(e) => handleAttendeeChange(index, 'email', e.target.value)}
                          placeholder="email@example.com"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500 focus:ring-purple-500/20"
                        />
                        {errors[`attendee_${index}`]?.email && (
                          <p className="text-xs text-red-400">{errors[`attendee_${index}`].email}</p>
                        )}
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-sm text-white/40 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {t('order.attendeePhone')}
                          <span className="text-xs">({t('common.optional')})</span>
                        </Label>
                        <Input
                          type="tel"
                          value={attendee.phone || ''}
                          onChange={(e) => handleAttendeeChange(index, 'phone', e.target.value)}
                          placeholder="0987654321"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500 focus:ring-purple-500/20"
                        />
                        {errors[`attendee_${index}`]?.phone && (
                          <p className="text-xs text-red-400">{errors[`attendee_${index}`].phone}</p>
                        )}
                      </div>

                      {selectedTicket.is_donation && (
                        <div className="space-y-2 sm:col-span-2">
                          <Label className="text-sm text-white/60 flex items-center gap-1.5">
                            💰 {t('order.donationPerTicket')} <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            type="number"
                            min="1000"
                            step="1000"
                            value={attendee.donationAmount || ''}
                            onChange={(e) => handleAttendeeChange(index, 'donationAmount', e.target.value)}
                            placeholder="50,000 VND"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500 focus:ring-purple-500/20"
                          />
                          {errors[`attendee_${index}`]?.donationAmount && (
                            <p className="text-xs text-red-400">{errors[`attendee_${index}`].donationAmount}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-white/10">
                <h3 className="font-semibold text-lg">{t('order.orderSummary')}</h3>
              </div>

              {/* Content */}
              <div className="p-5 space-y-5">
                {/* Event Thumbnail */}
                <div className="flex items-center gap-3">
                  {event.cover_image_url ? (
                    <img src={event.cover_image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{event.title}</p>
                    <p className="text-sm text-white/50">{formatDate(event.start_at)}</p>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {/* Ticket Details */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">{selectedTicket.name}</span>
                    <span>{selectedTicket.is_free ? t('ticket.free') : formatPrice(selectedTicket.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">{t('order.quantity')}</span>
                    <span>× {quantity}</span>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t('order.totalAmount')}</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    {formatPrice(totalAmount)}
                  </span>
                </div>

                {/* CTA Button */}
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 rounded-xl shadow-lg shadow-purple-500/25"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      {t('order.payNow')}
                    </>
                  )}
                </Button>

                {/* Security Badges */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <Lock className="h-3.5 w-3.5 text-green-400" />
                    <span>SSL Secure</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="p-5 bg-white/5 border-t border-white/10">
                <p className="text-xs text-white/40 mb-3 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  {t('order.paymentMethods')}
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 py-2.5 px-4 bg-blue-500/10 rounded-lg border border-blue-500/20 text-center">
                    <span className="text-xs font-semibold text-blue-400">VNPAY</span>
                  </div>
                  <div className="flex-1 py-2.5 px-4 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
                    <span className="text-xs font-semibold text-green-400">PayOS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Help */}
            <p className="text-center text-sm text-white/40 mt-4">
              {t('order.needHelp')}{' '}
              <a href="/contact" className="text-purple-400 hover:text-purple-300 transition-colors">
                {t('order.contactSupport')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
