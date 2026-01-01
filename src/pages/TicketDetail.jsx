import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    ExternalLink,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Ticket,
    User,
    XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import { useNavigate, useParams } from "react-router-dom";
import { getMyTicketById } from "../api/myTickets";
import Header from "../components/Header";

const TicketDetail = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { ticketId } = useParams();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (ticketId) {
            fetchTicket();
        }
    }, [ticketId]);

    const fetchTicket = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getMyTicketById(ticketId);
            setTicket(response);
        } catch (err) {
            console.error("Error fetching ticket:", err);
            setError(err.message || t("ticketDetail.fetchError"));
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " VND";
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "ACTIVE":
                return (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-base px-4 py-2">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {t("myTickets.status.active")}
                    </Badge>
                );
            case "REVOKED":
                return (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-base px-4 py-2">
                        <XCircle className="w-4 h-4 mr-2" />
                        {t("myTickets.status.revoked")}
                    </Badge>
                );
            case "REFUNDED":
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-base px-4 py-2">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {t("myTickets.status.refunded")}
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getCheckinBadge = (checkinStatus) => {
        switch (checkinStatus) {
            case "CHECKED_IN":
                return (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-base px-4 py-2">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {t("myTickets.checkinStatus.checkedIn")}
                    </Badge>
                );
            case "NOT_CHECKED_IN":
                return (
                    <Badge variant="outline" className="border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400 text-base px-4 py-2">
                        <Clock className="w-4 h-4 mr-2" />
                        {t("myTickets.checkinStatus.notCheckedIn")}
                    </Badge>
                );
            default:
                return <Badge variant="outline">{checkinStatus}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => navigate("/my-tickets")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {t("ticketDetail.backToList")}
                    </Button>
                </main>
            </div>
        );
    }

    if (!ticket) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="container mx-auto px-4 py-8">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    className="mb-6"
                    onClick={() => navigate("/my-tickets")}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t("ticketDetail.backToList")}
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* QR Code Section */}
                    <Card className="lg:col-span-1">
                        <CardHeader className="text-center">
                            <CardTitle className="flex items-center justify-center gap-2">
                                <Ticket className="w-5 h-5" />
                                {t("ticketDetail.qrCode")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                            {/* QR Code */}
                            <div className="bg-white p-6 rounded-xl shadow-inner mb-4">
                                <QRCode
                                    value={ticket.qr_payload}
                                    size={200}
                                    level="H"
                                />
                            </div>

                            {/* Ticket Serial */}
                            <div className="text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    {t("ticketDetail.ticketSerial")}
                                </p>
                                <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                                    {ticket.ticket_serial}
                                </p>
                            </div>

                            {/* Status Badges */}
                            <div className="flex flex-wrap gap-2 mt-4 justify-center">
                                {getStatusBadge(ticket.status)}
                                {getCheckinBadge(ticket.checkin_status)}
                            </div>

                            {/* Check-in info */}
                            {ticket.checkin_status === "CHECKED_IN" && ticket.checked_in_at && (
                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center w-full">
                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                        {t("ticketDetail.checkedInAt")}
                                    </p>
                                    <p className="font-medium text-blue-800 dark:text-blue-300">
                                        {formatDate(ticket.checked_in_at)}
                                    </p>
                                    {ticket.checked_in_gate && (
                                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                            {t("ticketDetail.gate")}: {ticket.checked_in_gate}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Event & Ticket Info Section */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>{t("ticketDetail.eventInfo")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Event Info */}
                            <div className="flex gap-4">
                                {/* Event Image */}
                                <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    {ticket.event?.cover_image_url ? (
                                        <img
                                            src={ticket.event.cover_image_url}
                                            alt={ticket.event.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Calendar className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {ticket.event?.title}
                                    </h2>
                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{formatDate(ticket.event?.start_at)}</span>
                                        </div>
                                        {ticket.event?.venue_name && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span>
                                                    {ticket.event.venue_name}
                                                    {ticket.event.city && `, ${ticket.event.city}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="link"
                                        className="p-0 h-auto mt-2"
                                        onClick={() => navigate(`/e/${ticket.event?.slug}`)}
                                    >
                                        {t("ticketDetail.viewEvent")}
                                        <ExternalLink className="w-3 h-3 ml-1" />
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            {/* Ticket Type Info */}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                                    {t("ticketDetail.ticketType")}
                                </h3>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {ticket.ticket_type?.name}
                                            </p>
                                            {ticket.ticket_type?.description && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {ticket.ticket_type.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                {formatPrice(ticket.ticket_type?.price || 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Attendee Info */}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                                    {t("ticketDetail.attendeeInfo")}
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-900 dark:text-white">
                                            {ticket.attendee_name}
                                        </span>
                                    </div>
                                    {ticket.attendee_email && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {ticket.attendee_email}
                                            </span>
                                        </div>
                                    )}
                                    {ticket.attendee_phone && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {ticket.attendee_phone}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Order Info */}
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                                    {t("ticketDetail.orderInfo")}
                                </h3>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {t("ticketDetail.orderNumber")}
                                        </p>
                                        <p className="font-mono text-gray-900 dark:text-white">
                                            {ticket.order?.order_number}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate(`/orders/${ticket.order?.id}`)}
                                    >
                                        {t("ticketDetail.viewOrder")}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default TicketDetail;
