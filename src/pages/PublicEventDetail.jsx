import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    AlertCircle,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    ExternalLink,
    Globe,
    MapPin,
    Share2,
    Tag,
    Ticket,
    Users
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { getEventBySlug } from "../api/events";
import { getTicketTypes } from "../api/ticketTypes";
import Header from "../components/Header";

const PublicEventDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const hasFetched = useRef(false);
  const ticketSectionRef = useRef(null);

  const locale = i18n.language === "vn" ? "vi-VN" : "en-US";

  useEffect(() => {
    if (hasFetched.current) return;

    const fetchEvent = async () => {
      if (!slug) return;
      hasFetched.current = true;

      try {
        setLoading(true);
        setError("");
        const data = await getEventBySlug(slug, "organization");
        setEvent(data);

        if (data && data.id) {
          setLoadingTickets(true);
          try {
            const tickets = await getTicketTypes(data.id, { only_on_sale_now: false });
            const now = new Date();
            const ticketsWithSaleStatus = Array.isArray(tickets)
              ? tickets.map((ticket) => {
                  const saleStart = ticket.sale_start_at ? new Date(ticket.sale_start_at) : null;
                  const saleEnd = ticket.sale_end_at ? new Date(ticket.sale_end_at) : null;
                  const is_on_sale =
                    ticket.is_active && (!saleStart || now >= saleStart) && (!saleEnd || now <= saleEnd);
                  return { ...ticket, is_on_sale };
                })
              : [];
            setTicketTypes(ticketsWithSaleStatus);
            const available = ticketsWithSaleStatus.find((t) => t.is_on_sale && !t.is_sold_out);
            if (available) setSelectedTicket(available);
          } catch (ticketErr) {
            console.error("Error fetching ticket types:", ticketErr);
            setTicketTypes([]);
          } finally {
            setLoadingTickets(false);
          }
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        setError(err.message || t("event.fetchDetailError"));
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug, t]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return t("ticket.free");
    return new Intl.NumberFormat(locale, { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(price);
  };

  const handleBuyTicket = () => {
    if (!selectedTicket) return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate(`/login?redirect=/e/${slug}`);
      return;
    }
    navigate(`/checkout/${event.id}`, { state: { event, selectedTicket } });
  };

  const scrollToTickets = () => {
    ticketSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, url });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert(t("common.linkCopied"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || t("event.notFound")}</AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Button onClick={() => navigate("/events")}>{t("common.backToList")}</Button>
          </div>
        </div>
      </div>
    );
  }

  const hasTickets = ticketTypes && ticketTypes.length > 0;
  const availableTickets = ticketTypes.filter((t) => t.is_on_sale && !t.is_sold_out);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />

      {/* Cover Image */}
      <div className="relative h-[300px] md:h-[400px] bg-gradient-to-br from-violet-600 to-indigo-700">
        {event.cover_image_url && (
          <img src={event.cover_image_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Share Button */}
        <div className="absolute top-4 right-4">
          <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" />
            {t("common.share")}
          </Button>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="container mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              {event.category && (
                <Badge className="bg-white/20 text-white backdrop-blur-sm border-0">
                  <Tag className="h-3 w-3 mr-1" />
                  {event.category}
                </Badge>
              )}
              <Badge className="bg-white/20 text-white backdrop-blur-sm border-0">
                {event.attendance_mode === "ONLINE" ? (
                  <><Globe className="h-3 w-3 mr-1" />{t("event.online")}</>
                ) : event.attendance_mode === "HYBRID" ? (
                  <><Globe className="h-3 w-3 mr-1" />{t("event.hybrid")}</>
                ) : (
                  <><MapPin className="h-3 w-3 mr-1" />{t("event.offline")}</>
                )}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{event.title}</h1>
            {event.subtitle && <p className="text-white/80 text-lg">{event.subtitle}</p>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Info Bar */}
            <div className="flex flex-wrap gap-6 p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("event.date")}</p>
                  <p className="font-semibold text-sm">{formatDate(event.start_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("event.time")}</p>
                  <p className="font-semibold text-sm">
                    {formatTime(event.start_at)}
                    {event.end_at && ` - ${formatTime(event.end_at)}`}
                  </p>
                </div>
              </div>
              {event.venue_name && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("event.venue")}</p>
                    <p className="font-semibold text-sm">{event.venue_name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* About */}
            {event.description && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">{t("event.aboutEvent")}</h2>
                <div className="relative">
                  <p 
                    className={`text-muted-foreground whitespace-pre-wrap leading-relaxed ${
                      !isDescriptionExpanded && event.description.length > 500 
                        ? 'line-clamp-6' 
                        : ''
                    }`}
                  >
                    {event.description}
                  </p>
                  {event.description.length > 500 && (
                    <div className="flex justify-center mt-2">
                      {!isDescriptionExpanded && (
                        <div className="absolute bottom-8 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full h-10 w-10 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all border-gray-200 dark:border-gray-700"
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      >
                        {isDescriptionExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gallery */}
            {event.gallery && event.gallery.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">{t("event.gallery")}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {event.gallery.map((image, index) => (
                    <div key={index} className="relative rounded-xl overflow-hidden aspect-video">
                      <img src={image} alt={`${event.title} - ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tickets Section */}
            <div ref={ticketSectionRef} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm scroll-mt-24">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                {t("event.ticketTypes")}
              </h2>
              <p className="text-muted-foreground text-sm mb-6">{t("event.selectTicket")}</p>

              {loadingTickets ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : hasTickets ? (
                <div className="space-y-3">
                  {ticketTypes.map((ticket) => {
                    const isSelected = selectedTicket?.id === ticket.id;
                    const isAvailable = ticket.is_on_sale && !ticket.is_sold_out && ticket.is_active;

                    return (
                      <div
                        key={ticket.id}
                        onClick={() => isAvailable && setSelectedTicket(ticket)}
                        className={`
                          relative p-4 rounded-xl border-2 transition-all cursor-pointer
                          ${isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : isAvailable
                              ? "border-gray-200 dark:border-gray-800 hover:border-primary/50"
                              : "border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed"
                          }
                        `}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{ticket.name}</h3>
                              {ticket.is_sold_out && <Badge variant="destructive" className="text-xs">{t("ticket.soldOut")}</Badge>}
                              {!ticket.is_active && <Badge variant="secondary" className="text-xs">{t("ticketTypes.status.unavailable")}</Badge>}
                            </div>
                            {ticket.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">{ticket.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {ticket.quantity_sold || 0}/{ticket.quantity_total}
                              </span>
                              <span>{ticket.per_order_min}-{ticket.per_order_max} {t("ticket.tickets")}/{t("order.ticket")}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-xl font-bold ${ticket.is_free ? "text-green-600" : "text-primary"}`}>
                              {ticket.is_free ? t("ticket.free") : formatPrice(ticket.price)}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-3 right-3">
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {availableTickets.length > 0 && (
                    <Button
                      size="lg"
                      className="w-full mt-4 py-6 text-base font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                      onClick={handleBuyTicket}
                      disabled={!selectedTicket}
                    >
                      <Ticket className="h-5 w-5 mr-2" />
                      {selectedTicket
                        ? `${t("event.buyTicket")} - ${selectedTicket.is_free ? t("ticket.free") : formatPrice(selectedTicket.price)}`
                        : t("event.selectTicketFirst")}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Ticket className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>{t("event.noTickets")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {/* CTA Card */}
            {availableTickets.length > 0 && (
              <Card className="sticky top-24 bg-gradient-to-br from-violet-600 to-purple-600 text-white border-0 overflow-hidden">
                <CardContent className="p-6">
                  <p className="text-white/80 text-sm mb-1">{t("eventDetail.priceFrom")}</p>
                  <p className="text-3xl font-bold mb-4">
                    {ticketTypes.some((t) => t.is_free) ? t("ticket.free") : formatPrice(Math.min(...ticketTypes.map((t) => t.price || 0)))}
                  </p>
                  <Button size="lg" className="w-full bg-white text-purple-700 hover:bg-white/90 font-semibold" onClick={scrollToTickets}>
                    <Ticket className="h-5 w-5 mr-2" />
                    {t("event.getTickets")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Date & Time */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {t("event.dateAndTime")}
                </h3>
                <p className="font-medium">{formatDate(event.start_at)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(event.start_at)}
                  {event.end_at && ` - ${formatTime(event.end_at)}`}
                </p>
                {event.timezone && <p className="text-xs text-muted-foreground mt-1">{event.timezone}</p>}
              </CardContent>
            </Card>

            {/* Location */}
            {event.venue_name && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {t("event.location")}
                  </h3>
                  <p className="font-medium">{event.venue_name}</p>
                  {event.address_line1 && <p className="text-sm text-muted-foreground">{event.address_line1}</p>}
                  {(event.district || event.city) && (
                    <p className="text-sm text-muted-foreground">
                      {[event.district, event.city, event.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {event.geo_lat && event.geo_lng && (
                    <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                      <a href={`https://www.google.com/maps?q=${event.geo_lat},${event.geo_lng}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        {t("event.viewOnMap")}
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Online */}
            {event.meeting_url && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    {t("event.onlineMeeting")}
                  </h3>
                  {event.stream_platform && <p className="text-sm text-muted-foreground mb-2">{t("event.platform")}: {event.stream_platform}</p>}
                  <Button className="w-full" asChild>
                    <a href={event.meeting_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {t("event.joinMeeting")}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Organizer */}
            {event.organization && (
              <Card>
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">{t("event.organizedBy")}</p>
                  <div className="flex items-center gap-3">
                    {event.organization.logo_url ? (
                      <img src={event.organization.logo_url} alt={event.organization.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <p className="font-medium">{event.organization.name}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicEventDetail;
