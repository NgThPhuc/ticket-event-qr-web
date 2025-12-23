import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    CheckCircle2,
    ChevronDown,
    Clock,
    Loader2,
    Lock,
    MapPin,
    Minus,
    Plus,
    Ticket,
    User,
    Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createOrder } from "../api/orders";

// --- Sub-Components ---

const Counter = ({ value, onChange, min = 1, max = 10 }) => (
    <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-lg p-1 border border-gray-200 dark:border-white/10">
        <button
            onClick={() => onChange(Math.max(min, value - 1))}
            className="w-8 h-8 rounded-md bg-white dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors disabled:opacity-50"
            disabled={value <= min}
        >
            <Minus size={14} strokeWidth={2} />
        </button>
        <span className="w-10 text-center font-medium text-gray-900 dark:text-white">{value}</span>
        <button
            onClick={() => onChange(Math.min(max, value + 1))}
            className="w-8 h-8 rounded-md bg-gray-900 dark:bg-white text-white dark:text-black flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-50"
            disabled={value >= max}
        >
            <Plus size={14} strokeWidth={2} />
        </button>
    </div>
);

const InputField = ({ label, placeholder, type = "text", id, value, onChange, error, required }) => (
    <div className="relative group">
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder=" "
            className={`peer w-full h-12 px-4 bg-white dark:bg-white/5 border ${error ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} focus:border-gray-500 focus:ring-0 rounded-lg text-base text-gray-900 dark:text-white outline-none transition-all placeholder-transparent`}
        />
        <label
            htmlFor={id}
            className={`absolute left-4 top-3 text-xs font-medium ${error ? 'text-red-500' : 'text-gray-400'} uppercase tracking-wide transition-all 
      -translate-y-3 scale-90 bg-white dark:bg-[#1a1a1a] px-1
      peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:bg-transparent
      peer-focus:-translate-y-5 peer-focus:scale-90 peer-focus:text-gray-900 dark:peer-focus:text-white peer-focus:bg-white dark:peer-focus:bg-[#1a1a1a] pointer-events-none`}
        >
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

const AccordionItem = ({ step, title, isOpen, onToggle, children, isCompleted }) => (
    <div className={`group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl transition-all duration-300 overflow-hidden ${isOpen ? 'ring-1 ring-gray-900/5 dark:ring-white/10' : ''}`}>
        <button
            onClick={onToggle}
            className="w-full flex cursor-pointer items-center justify-between gap-6 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
            <div className="flex items-center gap-4">
                <div className={`size-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${isCompleted ? 'bg-green-600 text-white' : (isOpen ? 'bg-gray-900 dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400')}`}>
                    {isCompleted ? <CheckCircle2 size={16} /> : step}
                </div>
                <p className={`text-lg font-semibold text-gray-900 dark:text-white ${!isOpen && isCompleted ? 'opacity-60' : ''}`}>{title}</p>
            </div>
            <ChevronDown className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={20} />
        </button>

        <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-6 pb-8 pt-0 border-t border-transparent dark:border-white/5">
                <div className="mt-4">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

// Checkout Mode Toggle
const CheckoutModeToggle = ({ mode, onChange }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('order.checkoutMode')}
            </p>
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => onChange('buyer')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${mode === 'buyer'
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-md'
                            : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/20'
                        }`}
                >
                    <User size={16} />
                    <span>{t('order.buyerMode')}</span>
                </button>
                <button
                    type="button"
                    onClick={() => onChange('attendee')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${mode === 'attendee'
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-md'
                            : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/20'
                        }`}
                >
                    <Users size={16} />
                    <span>{t('order.attendeeMode')}</span>
                </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {mode === 'buyer'
                    ? t('order.buyerModeDesc')
                    : t('order.attendeeModeDesc')
                }
            </p>
        </div>
    );
};

// --- Main Component ---

const CheckoutPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const locale = i18n.language === "vn" ? "vi-VN" : "en-US";

    const { event, selectedTicket } = location.state || {};

    const [activeStep, setActiveStep] = useState(1);
    const [quantity, setQuantity] = useState(selectedTicket?.per_order_min || 1);
    const [checkoutMode, setCheckoutMode] = useState('buyer'); // 'buyer' or 'attendee'
    const [buyerInfo, setBuyerInfo] = useState({ name: '', email: '', phone: '' });
    const [attendees, setAttendees] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const minQuantity = selectedTicket?.per_order_min || 1;
    const maxQuantity = selectedTicket?.per_order_max || 10;

    useEffect(() => {
        if (checkoutMode === 'attendee') {
            const newAttendees = Array.from({ length: quantity }, (_, i) => attendees[i] || {
                name: '',
                email: '',
                phone: '',
                donationAmount: selectedTicket?.is_donation ? '' : undefined
            });
            setAttendees(newAttendees);
        }
    }, [quantity, checkoutMode]);

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
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0
        }).format(price);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString(locale, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const calculateTotalAmount = () => {
        if (selectedTicket.is_free) return 0;
        if (selectedTicket.is_donation) {
            if (checkoutMode === 'attendee') {
                return attendees.reduce((sum, attendee) => {
                    return sum + (parseFloat(attendee.donationAmount) || 0);
                }, 0);
            }
            return parseFloat(buyerInfo.donationAmount) || 0;
        }
        return parseFloat(selectedTicket.price) * quantity;
    };

    const totalAmount = calculateTotalAmount();

    const validateBuyerInfo = () => {
        const buyerErrors = {};
        if (!buyerInfo.name?.trim()) buyerErrors.name = t('order.errors.nameRequired');
        if (!buyerInfo.email?.trim()) {
            buyerErrors.email = t('order.errors.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerInfo.email)) {
            buyerErrors.email = t('order.errors.emailInvalid');
        }
        if (buyerInfo.phone && !/^[0-9]{10,11}$/.test(buyerInfo.phone.replace(/\s/g, ''))) {
            buyerErrors.phone = t('order.errors.phoneInvalid');
        }
        if (selectedTicket.is_donation) {
            const amount = parseFloat(buyerInfo.donationAmount);
            if (!buyerInfo.donationAmount || isNaN(amount) || amount <= 0) {
                buyerErrors.donationAmount = t('order.errors.donationPositive');
            }
        }
        return buyerErrors;
    };

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

        if (checkoutMode === 'buyer') {
            const buyerErrors = validateBuyerInfo();
            if (Object.keys(buyerErrors).length > 0) {
                newErrors.buyer = buyerErrors;
                hasErrors = true;
            }
        } else {
            attendees.forEach((attendee, index) => {
                const attendeeErrors = validateAttendee(attendee);
                if (Object.keys(attendeeErrors).length > 0) {
                    newErrors[`attendee_${index}`] = attendeeErrors;
                    hasErrors = true;
                }
            });
        }

        setErrors(newErrors);
        return !hasErrors;
    };

    const handleBuyerChange = (field, value) => {
        setBuyerInfo(prev => ({ ...prev, [field]: value }));
        if (errors.buyer?.[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                if (newErrors.buyer) {
                    delete newErrors.buyer[field];
                    if (Object.keys(newErrors.buyer).length === 0) {
                        delete newErrors.buyer;
                    }
                }
                return newErrors;
            });
        }
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
            toast.error(checkoutMode === 'buyer'
                ? t('order.errors.buyerInfoRequired')
                : t('order.errors.attendeesRequired', { count: quantity })
            );
            return;
        }

        setLoading(true);
        try {
            // Build payload based on checkout mode
            const orderData = {
                event_id: event.id,
                items: [{
                    ticket_type_id: selectedTicket.id,
                    quantity: quantity,
                    ...(checkoutMode === 'attendee' && {
                        attendees: attendees.map(a => ({
                            name: a.name,
                            email: a.email,
                            phone: a.phone || undefined
                        }))
                    }),
                    donation_amount: selectedTicket.is_donation
                        ? (checkoutMode === 'buyer'
                            ? parseFloat(buyerInfo.donationAmount)
                            : parseFloat(attendees[0]?.donationAmount)
                        )
                        : undefined
                }]
            };

            // Add buyer info if buyer-centric mode
            if (checkoutMode === 'buyer') {
                orderData.buyer = {
                    name: buyerInfo.name,
                    email: buyerInfo.email,
                    phone: buyerInfo.phone || undefined
                };
            }

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
        <div className="min-h-screen p-4 md:p-8 lg:p-12 font-sans transition-colors duration-300 flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-950">

            {/* Main Card Container */}
            <div className="w-full max-w-6xl bg-white dark:bg-[#121212] rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-white/20 dark:border-white/5 relative z-10">

                {/* Left Panel: Event Info */}
                <aside className="w-full lg:w-[40%] bg-gray-50 dark:bg-[#1a1a1a] border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-white/5 p-8 flex flex-col gap-8">

                    {/* Header/Brand */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span className="text-sm font-medium">{t('common.back')}</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gray-900 dark:bg-white rounded-lg">
                                <Ticket className="text-white dark:text-black" size={20} />
                            </div>
                            <span className="font-bold tracking-tight text-lg text-gray-900 dark:text-white">Ticket Crate</span>
                        </div>
                    </div>

                    {/* Hero Image */}
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-md group">
                        {event.cover_image_url ? (
                            <img
                                src={event.cover_image_url}
                                alt={event.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                                <Calendar className="h-20 w-20 text-white/30" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-6 left-6 text-white right-6">
                            {event.category && (
                                <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-wider mb-2">
                                    {event.category}
                                </span>
                            )}
                            <h1 className="text-2xl font-bold leading-tight mb-1">{event.title}</h1>
                            {event.subtitle && <p className="text-white/80 text-sm">{event.subtitle}</p>}
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid gap-6">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 text-gray-400">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">{t('event.date')}</p>
                                <p className="font-medium text-lg text-gray-900 dark:text-white">{formatDate(event.start_at)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="mt-1 text-gray-400">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">{t('event.time')}</p>
                                <p className="font-medium text-lg text-gray-900 dark:text-white">{formatTime(event.start_at)} - {event.end_at ? formatTime(event.end_at) : '...'}</p>
                            </div>
                        </div>
                        {event.venue_name && (
                            <div className="flex items-start gap-4">
                                <div className="mt-1 text-gray-400">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">{t('event.location')}</p>
                                    <p className="font-medium text-lg text-gray-900 dark:text-white">{event.venue_name}</p>
                                    {event.address_line1 && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{event.address_line1}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Total Display - Bottom */}
                    <div className="mt-auto pt-6 border-t border-gray-200 dark:border-white/10">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{t('order.totalAmount')}</span>
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">{formatPrice(totalAmount)}</span>
                        </div>
                    </div>
                </aside>

                {/* Right Panel: Checkout Form */}
                <section className="flex-1 p-8 lg:p-12 overflow-y-auto bg-white dark:bg-[#121212]">

                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('order.checkout')}</h2>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <Lock size={14} className="text-green-500" />
                            <span>{t('order.secureCheckout')}</span>
                        </div>
                    </div>

                    <div className="space-y-4">

                        {/* Step 1: Tickets */}
                        <AccordionItem
                            step="1"
                            title={t('order.selectTickets')}
                            isOpen={activeStep === 1}
                            onToggle={() => setActiveStep(activeStep === 1 ? 0 : 1)}
                            isCompleted={activeStep > 1}
                        >
                            <div className="space-y-4">
                                {/* Selected Ticket */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{selectedTicket.name}</h4>
                                            {selectedTicket.is_donation && (
                                                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border-0">
                                                    {t('ticket.donation')}
                                                </Badge>
                                            )}
                                        </div>
                                        {selectedTicket.description && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedTicket.description}</p>
                                        )}
                                        <p className="text-xl font-semibold mt-2 text-gray-900 dark:text-white">
                                            {selectedTicket.is_free ? t('ticket.free') : formatPrice(selectedTicket.price)}
                                        </p>
                                    </div>
                                    <Counter
                                        value={quantity}
                                        onChange={setQuantity}
                                        min={minQuantity}
                                        max={maxQuantity}
                                    />
                                </div>

                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                    {minQuantity} - {maxQuantity} {t('order.ticketsPerOrder')}
                                </p>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={() => setActiveStep(2)}
                                        className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
                                    >
                                        {t('common.continue')}
                                    </button>
                                </div>
                            </div>
                        </AccordionItem>

                        {/* Step 2: Guest/Buyer Details */}
                        <AccordionItem
                            step="2"
                            title={t('order.guestDetails')}
                            isOpen={activeStep === 2}
                            onToggle={() => setActiveStep(activeStep === 2 ? 0 : 2)}
                            isCompleted={false}
                        >
                            <div className="space-y-6">
                                {/* Checkout Mode Toggle */}
                                <CheckoutModeToggle mode={checkoutMode} onChange={setCheckoutMode} />

                                {/* Buyer-centric Mode */}
                                {checkoutMode === 'buyer' && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                {t('order.buyerModeInfo', { count: quantity })}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <InputField
                                                id="buyer-name"
                                                label={t('order.buyerName')}
                                                value={buyerInfo.name}
                                                onChange={(e) => handleBuyerChange('name', e.target.value)}
                                                error={errors.buyer?.name}
                                                required
                                            />
                                            <InputField
                                                id="buyer-email"
                                                label={t('order.buyerEmail')}
                                                type="email"
                                                value={buyerInfo.email}
                                                onChange={(e) => handleBuyerChange('email', e.target.value)}
                                                error={errors.buyer?.email}
                                                required
                                            />
                                        </div>
                                        <InputField
                                            id="buyer-phone"
                                            label={t('order.buyerPhone')}
                                            type="tel"
                                            value={buyerInfo.phone}
                                            onChange={(e) => handleBuyerChange('phone', e.target.value)}
                                            error={errors.buyer?.phone}
                                        />

                                        {selectedTicket.is_donation && (
                                            <InputField
                                                id="buyer-donation"
                                                label={t('order.donationAmount')}
                                                type="number"
                                                value={buyerInfo.donationAmount || ''}
                                                onChange={(e) => handleBuyerChange('donationAmount', e.target.value)}
                                                error={errors.buyer?.donationAmount}
                                                required
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Per-attendee Mode */}
                                {checkoutMode === 'attendee' && (
                                    <div className="space-y-4">
                                        {attendees.map((attendee, index) => (
                                            <div key={index} className="space-y-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-full bg-gray-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-sm font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-white">{t('order.ticketNumber', { number: index + 1 })}</span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <InputField
                                                        id={`name-${index}`}
                                                        label={t('order.attendeeName')}
                                                        value={attendee.name || ''}
                                                        onChange={(e) => handleAttendeeChange(index, 'name', e.target.value)}
                                                        error={errors[`attendee_${index}`]?.name}
                                                        required
                                                    />
                                                    <InputField
                                                        id={`email-${index}`}
                                                        label={t('order.attendeeEmail')}
                                                        type="email"
                                                        value={attendee.email || ''}
                                                        onChange={(e) => handleAttendeeChange(index, 'email', e.target.value)}
                                                        error={errors[`attendee_${index}`]?.email}
                                                        required
                                                    />
                                                </div>
                                                <InputField
                                                    id={`phone-${index}`}
                                                    label={t('order.attendeePhone')}
                                                    type="tel"
                                                    value={attendee.phone || ''}
                                                    onChange={(e) => handleAttendeeChange(index, 'phone', e.target.value)}
                                                    error={errors[`attendee_${index}`]?.phone}
                                                />

                                                {selectedTicket.is_donation && (
                                                    <InputField
                                                        id={`donation-${index}`}
                                                        label={t('order.donationPerTicket')}
                                                        type="number"
                                                        value={attendee.donationAmount || ''}
                                                        onChange={(e) => handleAttendeeChange(index, 'donationAmount', e.target.value)}
                                                        error={errors[`attendee_${index}`]?.donationAmount}
                                                        required
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex justify-between gap-3">
                                        <button
                                            onClick={() => setActiveStep(1)}
                                            className="px-6 py-3 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        >
                                            {t('common.back')}
                                        </button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="bg-gray-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 h-auto"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    {t('common.loading')}
                                                </>
                                            ) : (
                                                <>
                                                    <Lock size={14} />
                                                    <span>{t('order.payNow')}</span>
                                                    <span className="bg-white/20 dark:bg-black/20 px-2 py-0.5 rounded text-xs ml-1">{formatPrice(totalAmount)}</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {/* Security Badges */}
                                    <div className="flex items-center justify-center gap-4 pt-4 mt-4 border-t border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <Lock size={12} className="text-green-500" />
                                            <span>SSL Secure</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <CheckCircle size={12} className="text-green-500" />
                                            <span>Verified</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AccordionItem>

                    </div>
                </section>
            </div>
        </div>
    );
};

export default CheckoutPage;
