import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { createOrder } from "../api/orders";
import AttendeeForm from "../components/AttendeeForm";
import Header from "../components/Header";
import OrderSummary from "../components/OrderSummary";

const CheckoutPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { eventId } = useParams();
  const location = useLocation();
  
  // Get event and ticket info from navigation state
  const { event, selectedTicket } = location.state || {};
  
  const [quantity, setQuantity] = useState(selectedTicket?.per_order_min || 1);
  const [attendees, setAttendees] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize attendees array when quantity changes
  useEffect(() => {
    const newAttendees = Array.from({ length: quantity }, (_, i) => attendees[i] || {
      name: '',
      email: '',
      phone: '',
      donationAmount: selectedTicket?.is_donation ? '' : undefined
    });
    setAttendees(newAttendees);
  }, [quantity]);

  // Redirect if no event/ticket data
  useEffect(() => {
    if (!event || !selectedTicket) {
      toast.error(t('order.errors.orderNotFound'));
      navigate('/events');
    }
  }, [event, selectedTicket, navigate, t]);

  if (!event || !selectedTicket) {
    return null;
  }

  // Calculate total amount
  const calculateTotalAmount = () => {
    if (selectedTicket.is_free) return 0;
    
    if (selectedTicket.is_donation) {
      // Sum all donation amounts
      return attendees.reduce((sum, attendee) => {
        const amount = parseFloat(attendee.donationAmount) || 0;
        return sum + amount;
      }, 0);
    }
    
    // Regular paid ticket
    return parseFloat(selectedTicket.price) * quantity;
  };

  const totalAmount = calculateTotalAmount();

  // Validate single attendee
  const validateAttendee = (attendee, index) => {
    const attendeeErrors = {};
    
    if (!attendee.name || attendee.name.trim() === '') {
      attendeeErrors.name = t('order.errors.nameRequired');
    }
    
    if (!attendee.email || attendee.email.trim() === '') {
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

  // Validate all attendees
  const validateForm = () => {
    const newErrors = {};
    let hasErrors = false;
    
    // Validate quantity
    if (quantity < (selectedTicket.per_order_min || 1)) {
      newErrors.quantity = t('order.errors.quantityMin', { min: selectedTicket.per_order_min });
      hasErrors = true;
    }
    if (selectedTicket.per_order_max && quantity > selectedTicket.per_order_max) {
      newErrors.quantity = t('order.errors.quantityMax', { max: selectedTicket.per_order_max });
      hasErrors = true;
    }
    
    // Validate each attendee
    attendees.forEach((attendee, index) => {
      const attendeeErrors = validateAttendee(attendee, index);
      if (Object.keys(attendeeErrors).length > 0) {
        newErrors[`attendee_${index}`] = attendeeErrors;
        hasErrors = true;
      }
    });
    
    setErrors(newErrors);
    return !hasErrors;
  };

  // Handle attendee change
  const handleAttendeeChange = (index, value) => {
    const newAttendees = [...attendees];
    newAttendees[index] = value;
    setAttendees(newAttendees);
    
    // Clear errors for this attendee
    if (errors[`attendee_${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`attendee_${index}`];
      setErrors(newErrors);
    }
  };

 // Handle order submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error(t('order.errors.attendeesRequired', { count: quantity }));
      return;
    }

    setLoading(true);

    try {
      // Prepare order data
      const orderData = {
        event_id: event.id,
        payment_method: 'VNPAY', // Default payment method
        items: [
          {
            ticket_type_id: selectedTicket.id,
            quantity: quantity,
            attendees: attendees.map(a => ({
              name: a.name,
              email: a.email,
              phone: a.phone || undefined
            })),
            donation_amount: selectedTicket.is_donation ? parseFloat(attendees[0].donationAmount) : undefined
          }
        ]
      };

      // Create order
      const order = await createOrder(orderData);
      
      toast.success(t('order.orderSuccess'));
      
      // Redirect to success page
      navigate(`/order-success/${order.id}`, {
        state: { order, event }
      });
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.message || t('order.errors.createOrderFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Page Header */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6" />
                  {t('order.checkout')}
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Quantity Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('order.quantity')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    {t('order.quantity')} ({selectedTicket.per_order_min || 1} - {selectedTicket.per_order_max || 10})
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={selectedTicket.per_order_min || 1}
                    max={selectedTicket.per_order_max || 10}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className={errors.quantity ? 'border-destructive' : ''}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-destructive">{errors.quantity}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Attendee Forms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('order.attendeeInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {attendees.map((attendee, index) => (
                  <AttendeeForm
                    key={index}
                    index={index + 1}
                    value={attendee}
                    onChange={(value) => handleAttendeeChange(index, value)}
                    isDonation={selectedTicket.is_donation}
                    errors={errors[`attendee_${index}`] || {}}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? t('common.loading') : t('order.confirmOrder')}
            </Button>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary
              event={event}
              ticketType={selectedTicket}
              quantity={quantity}
              donationAmount={selectedTicket.is_donation ? parseFloat(attendees[0]?.donationAmount) || 0 : 0}
              totalAmount={totalAmount}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
