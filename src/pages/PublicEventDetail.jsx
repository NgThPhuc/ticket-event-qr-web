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
    ExternalLink,
    Globe,
    MapPin,
    Share2,
    Ticket
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { getEventBySlug } from "../api/events";
import { getTicketTypes } from "../api/ticketTypes";
import AIChatbot from "../components/AIChatbot";
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
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950">
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
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-600 dark:from-gray-100 dark:to-gray-950">
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
  const lowestPrice = hasTickets 
    ? Math.min(...ticketTypes.filter(t => t.price > 0).map((t) => t.price || Infinity))
    : 0;
  const hasFreeTicket = ticketTypes.some((t) => t.is_free);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950">
      <Header />

      {/* Hero Section - Ticketbox style */}
      <div className="bg-transparent">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            
            {/* Left Column - Event Info - 4 parts */}
            <Card className="lg:col-span-4 border-0 shadow-xl overflow-hidden flex flex-col">
              <CardContent className="p-6 flex flex-col flex-1">
                {/* Top Content */}
                <div className="space-y-4">
                  {/* Location Badge */}
                  {event.city && (
                    <Badge variant="outline" className="text-xs">
                      [{event.city}]
                    </Badge>
                  )}
                  
                  {/* Title */}
                  <h1 className="text-2xl font-bold leading-tight">{event.title}</h1>
                  {event.subtitle && (
                    <p className="text-muted-foreground">{event.subtitle}</p>
                  )}

                  {/* Date & Time */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center justify-center w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded">
                      <Calendar className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {formatTime(event.start_at)} - {event.end_at ? formatTime(event.end_at) : "..."}, {formatDate(event.start_at)}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  {event.venue_name && (
                    <div className="flex items-start gap-3 text-sm">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded flex-shrink-0">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-600">{event.venue_name}</p>
                        <p className="text-muted-foreground text-xs">
                          {[event.address_line1, event.district, event.city].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Section - Fixed at bottom */}
                <div className="mt-auto pt-4 space-y-4">
                  {/* Price Section - Clickable */}
                  <div 
                    className="flex items-center gap-2 pt-4 border-t cursor-pointer group"
                    onClick={scrollToTickets}
                  >
                    <span className="text-muted-foreground">{t("eventDetail.priceFrom")}</span>
                    <span className="text-2xl font-bold text-primary">
                      {hasFreeTicket ? t("ticket.free") : (lowestPrice !== Infinity ? formatPrice(lowestPrice) : "-")}
                    </span>
                    <ChevronDown className="h-5 w-5 text-primary group-hover:translate-y-0.5 transition-transform" />
                  </div>

                  {/* CTA Button */}
                  <Button 
                    size="lg" 
                    className="w-full py-6 text-base font-semibold"
                    variant={availableTickets.length > 0 ? "default" : "outline"}
                    onClick={scrollToTickets}
                    disabled={!hasTickets}
                  >
                    {availableTickets.length > 0 ? t("event.getTickets") : t("event.noTicketsAvailable")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Cover Image - 6 parts */}
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden shadow-xl">
              {event.cover_image_url ? (
                <img 
                  src={event.cover_image_url} 
                  alt={event.title} 
                  className="w-full h-auto object-contain"
                />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                  <Calendar className="h-20 w-20 text-white/30" />
                </div>
              )}
              {/* Date Overlay on Cover */}
              <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-center">
                <p className="text-lg font-bold">
                  {new Date(event.start_at).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" })}
                </p>
                <p className="text-xs text-white/70">{event.venue_name}</p>
              </div>
              {/* Share Button */}
              <Button 
                variant="secondary" 
                size="icon"
                className="absolute top-4 left-4 bg-white/90 hover:bg-white rounded-full"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* About */}
            {event.description && (
              <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/20 dark:border-gray-700/50">
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
              <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/20 dark:border-gray-700/50">
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

            {/* Organizer - Moved to main content */}
            {event.organization && (
              <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/20 dark:border-gray-700/50">
                <h2 className="text-xl font-bold mb-4">{t("event.organizedBy")}</h2>
                <div className="flex items-start gap-4">
                  {event.organization.logo_url ? (
                    <img src={event.organization.logo_url} alt={event.organization.name} className="h-16 w-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-lg">{event.organization.name}</p>
                    {event.organization.description && (
                      <p className="text-sm text-muted-foreground mt-1">{event.organization.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {/* Tickets Section */}
            <Card ref={ticketSectionRef} className="sticky top-24 scroll-mt-24">
              <CardContent className="p-5">
                <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  {t("event.ticketTypes")}
                </h2>
                <p className="text-muted-foreground text-sm mb-4">{t("event.selectTicket")}</p>

                {loadingTickets ? (
                  <div className="text-center py-6">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : hasTickets ? (
                  <div className="space-y-2">
                    {ticketTypes.map((ticket) => {
                      const isSelected = selectedTicket?.id === ticket.id;
                      const isAvailable = ticket.is_on_sale && !ticket.is_sold_out && ticket.is_active;

                      return (
                        <div
                          key={ticket.id}
                          onClick={() => isAvailable && setSelectedTicket(ticket)}
                          className={`
                            relative p-3 rounded-lg border-2 transition-all cursor-pointer
                            ${isSelected
                              ? "border-primary bg-primary/5"
                              : isAvailable
                                ? "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                                : "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                            }
                          `}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <h3 className="font-medium text-sm">{ticket.name}</h3>
                                {ticket.is_sold_out && <Badge variant="destructive" className="text-xs">{t("ticket.soldOut")}</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {ticket.quantity_sold || 0}/{ticket.quantity_total} · {ticket.per_order_min}-{ticket.per_order_max} vé/đơn
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <p className={`font-bold ${ticket.is_free ? "text-green-600" : "text-primary"}`}>
                                {ticket.is_free ? t("ticket.free") : formatPrice(ticket.price)}
                              </p>
                              {isSelected && (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {availableTickets.length > 0 && (
                      <Button
                        size="lg"
                        className="w-full mt-3 py-5 text-sm font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                        onClick={handleBuyTicket}
                        disabled={!selectedTicket}
                      >
                        <Ticket className="h-4 w-4 mr-2" />
                        {selectedTicket
                          ? `${t("event.buyTicket")} - ${selectedTicket.is_free ? t("ticket.free") : formatPrice(selectedTicket.price)}`
                          : t("event.selectTicketFirst")}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Ticket className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t("event.noTickets")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

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
          </div>
        </div>
      </div>
      {/* AI Chatbot with event context */}
      {/* <AIChatbot eventId={event?.id} /> */}
    </div>
  );
};

export default PublicEventDetail;
