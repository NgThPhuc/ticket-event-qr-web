import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    Loader2,
    MapPin,
    QrCode,
    Search,
    Ticket,
    XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getMyTickets } from "../api/myTickets";
import Header from "../components/Header";

const MyTickets = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [checkinFilter, setCheckinFilter] = useState("all");

    useEffect(() => {
        fetchTickets();
    }, [statusFilter, checkinFilter]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {};
            if (statusFilter !== "all") params.status = statusFilter;
            if (checkinFilter !== "all") params.checkin_status = checkinFilter;

            const response = await getMyTickets(params);
            setTickets(response.data || []);
        } catch (err) {
            console.error("Error fetching tickets:", err);
            setError(err.message || t("myTickets.fetchError"));
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "ACTIVE":
                return (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {t("myTickets.status.active")}
                    </Badge>
                );
            case "REVOKED":
                return (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        <XCircle className="w-3 h-3 mr-1" />
                        {t("myTickets.status.revoked")}
                    </Badge>
                );
            case "REFUNDED":
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        <AlertCircle className="w-3 h-3 mr-1" />
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
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {t("myTickets.checkinStatus.checkedIn")}
                    </Badge>
                );
            case "NOT_CHECKED_IN":
                return (
                    <Badge variant="outline" className="border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        {t("myTickets.checkinStatus.notCheckedIn")}
                    </Badge>
                );
            default:
                return <Badge variant="outline">{checkinStatus}</Badge>;
        }
    };

    const handleViewDetail = (ticketId) => {
        navigate(`/my-tickets/${ticketId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Ticket className="w-8 h-8 text-blue-600" />
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                            {t("myTickets.title")}
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        {t("myTickets.subtitle")}
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder={t("myTickets.filterByStatus")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("myTickets.allStatuses")}</SelectItem>
                            <SelectItem value="ACTIVE">{t("myTickets.status.active")}</SelectItem>
                            <SelectItem value="REVOKED">{t("myTickets.status.revoked")}</SelectItem>
                            <SelectItem value="REFUNDED">{t("myTickets.status.refunded")}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={checkinFilter} onValueChange={setCheckinFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder={t("myTickets.filterByCheckin")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("myTickets.allCheckinStatuses")}</SelectItem>
                            <SelectItem value="NOT_CHECKED_IN">{t("myTickets.checkinStatus.notCheckedIn")}</SelectItem>
                            <SelectItem value="CHECKED_IN">{t("myTickets.checkinStatus.checkedIn")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Empty State */}
                {!loading && !error && tickets.length === 0 && (
                    <div className="text-center py-12">
                        <Ticket className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {t("myTickets.noTickets")}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {t("myTickets.noTicketsDescription")}
                        </p>
                        <Button onClick={() => navigate("/events")}>
                            <Search className="w-4 h-4 mr-2" />
                            {t("myTickets.exploreEvents")}
                        </Button>
                    </div>
                )}

                {/* Tickets List */}
                {!loading && !error && tickets.length > 0 && (
                    <div className="grid gap-4">
                        {tickets.map((ticket) => (
                            <Card
                                key={ticket.id}
                                className="hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => handleViewDetail(ticket.id)}
                            >
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        {/* Event Image */}
                                        <div className="flex-shrink-0 w-full md:w-32 h-32 md:h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
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

                                        {/* Ticket Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {getStatusBadge(ticket.status)}
                                                {getCheckinBadge(ticket.checkin_status)}
                                                <Badge variant="outline" className="font-mono">
                                                    {ticket.ticket_serial}
                                                </Badge>
                                            </div>

                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                                                {ticket.event?.title || t("myTickets.unknownEvent")}
                                            </h3>

                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{formatDate(ticket.event?.start_at)}</span>
                                                </div>
                                                {ticket.event?.venue_name && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        <span className="truncate">{ticket.event.venue_name}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-2 flex items-center gap-2">
                                                <Badge variant="secondary">
                                                    {ticket.ticket_type?.name || t("myTickets.unknownType")}
                                                </Badge>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {ticket.attendee_name}
                                                </span>
                                            </div>
                                        </div>

                                        {/* QR Code Preview */}
                                        <div className="flex-shrink-0 flex items-center justify-center md:justify-end">
                                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                                <QrCode className="w-10 h-10 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyTickets;
