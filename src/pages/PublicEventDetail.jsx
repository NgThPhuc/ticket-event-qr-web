import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AlertCircle,
    Building2,
    Calendar,
    Clock,
    ExternalLink,
    Globe,
    Mail,
    MapPin,
    Phone,
    Share2,
    Tag,
    Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { getEventBySlug } from "../api/events";
import { getTicketTypes } from "../api/ticketTypes";
import Header from "../components/Header";
import TicketCard from "../components/TicketCard";

const PublicEventDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setError("");
        // Load event data (with organization)
        const data = await getEventBySlug(slug, "organization");
        setEvent(data);
        
        // Load ticket types separately
        if (data && data.id) {
          setLoadingTickets(true);
          try {
            const tickets = await getTicketTypes(data.id, { only_on_sale_now: false });
            
            // Calculate is_on_sale for each ticket based on sale period
            const now = new Date();
            const ticketsWithSaleStatus = Array.isArray(tickets) 
              ? tickets.map(ticket => {
                  const saleStart = ticket.sale_start_at ? new Date(ticket.sale_start_at) : null;
                  const saleEnd = ticket.sale_end_at ? new Date(ticket.sale_end_at) : null;
                  
                  const is_on_sale = ticket.is_active &&
                    (!saleStart || now >= saleStart) &&
                    (!saleEnd || now <= saleEnd);
                  
                  return {
                    ...ticket,
                    is_on_sale
                  };
                })
              : [];
            
            setTicketTypes(ticketsWithSaleStatus);
          } catch (ticketErr) {
            console.error("Error fetching ticket types:", ticketErr);
            // Không set error vì ticket types là optional
            setTicketTypes([]);
          } finally {
            setLoadingTickets(false);
          }
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        setError(
          err.message || t("event.fetchDetailError") || "Không thể tải thông tin sự kiện"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug, t]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleBuyTicket = (ticket) => {
    // Check if user is logged in
    const token = localStorage.getItem("access_token");
    if (!token) {
      // Redirect to login with return URL
      navigate(`/login?redirect=/e/${slug}`);
      return;
    }

    // Navigate to checkout page với event và ticket info
    navigate(`/checkout/${event.id}`, {
      state: { event, selectedTicket: ticket },
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: event.title,
          text: event.subtitle || event.description,
          url: window.location.href,
        })
        .catch((err) => console.log("Error sharing:", err));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert(t("common.linkCopied") || "Đã sao chép link!");
    }
  };

  // Get attendance mode info
  const getAttendanceModeInfo = (mode) => {
    switch (mode) {
      case "ONLINE":
        return {
          icon: <Globe className="h-5 w-5" />,
          label: t("event.online") || "Trực tuyến",
          color: "text-blue-600 dark:text-blue-400",
        };
      case "OFFLINE":
        return {
          icon: <MapPin className="h-5 w-5" />,
          label: t("event.offline") || "Tại địa điểm",
          color: "text-green-600 dark:text-green-400",
        };
      case "HYBRID":
        return {
          icon: <Globe className="h-5 w-5" />,
          label: t("event.hybrid") || "Kết hợp",
          color: "text-purple-600 dark:text-purple-400",
        };
      default:
        return {
          icon: <MapPin className="h-5 w-5" />,
          label: mode,
          color: "text-gray-600 dark:text-gray-400",
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">
              {t("common.loading") || "Đang tải..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || t("event.notFound") || "Không tìm thấy sự kiện"}
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Button onClick={() => navigate("/events")}>
              {t("common.backToList") || "Quay lại danh sách"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const attendanceMode = getAttendanceModeInfo(event.attendance_mode);
  const hasTickets = ticketTypes && ticketTypes.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section - Cover Image */}
      <div className="relative h-[400px] bg-gradient-to-br from-primary/20 to-primary/5">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="h-32 w-32 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-32 relative z-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Card */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-3xl md:text-4xl mb-3">
                      {event.title}
                    </CardTitle>
                    {event.subtitle && (
                      <CardDescription className="text-lg">
                        {event.subtitle}
                      </CardDescription>
                    )}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {event.category && (
                        <Badge variant="secondary" className="gap-1">
                          <Tag className="h-3 w-3" />
                          {event.category}
                        </Badge>
                      )}
                      <Badge variant="outline" className="gap-1">
                        {attendanceMode.icon}
                        {attendanceMode.label}
                      </Badge>
                      {event.tags && event.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShare}
                    className="flex-shrink-0"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Description */}
            {event.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    {t("event.aboutEvent") || "Về sự kiện"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {event.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Gallery */}
            {event.gallery && event.gallery.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    {t("event.gallery") || "Hình ảnh"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {event.gallery.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${event.title} - ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                        loading="lazy"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tickets Section */}
            {hasTickets && (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    {t("event.ticketTypes") || "Loại vé"}
                  </CardTitle>
                  <CardDescription>
                    {t("event.selectTicket") || "Chọn loại vé phù hợp với bạn"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTickets ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t("common.loading") || "Đang tải..."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ticketTypes.map((ticket) => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          onBuyClick={handleBuyTicket}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Details Sidebar */}
          <div className="space-y-6">
            {/* Date & Time */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t("event.dateAndTime") || "Ngày & Giờ"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("event.start") || "Bắt đầu"}
                  </p>
                  <p className="font-medium">{formatDate(event.start_at)}</p>
                </div>
                {event.end_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("event.end") || "Kết thúc"}
                    </p>
                    <p className="font-medium">{formatDate(event.end_at)}</p>
                  </div>
                )}
                {event.timezone && (
                  <p className="text-xs text-muted-foreground">
                    {event.timezone}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            {(event.attendance_mode === "OFFLINE" ||
              event.attendance_mode === "HYBRID") &&
              event.venue_name && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {t("event.location") || "Địa điểm"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{event.venue_name}</p>
                    {event.address_line1 && (
                      <p className="text-sm text-muted-foreground">
                        {event.address_line1}
                        {event.address_line2 && `, ${event.address_line2}`}
                      </p>
                    )}
                    {(event.district || event.city || event.country) && (
                      <p className="text-sm text-muted-foreground">
                        {[event.district, event.city, event.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {event.postal_code && (
                      <p className="text-sm text-muted-foreground">
                        {event.postal_code}
                      </p>
                    )}
                    {/* Map integration placeholder */}
                    {event.geo_lat && event.geo_lng && (
                      <div className="mt-4 h-48 bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">
                          {t("event.mapPlaceholder") || "Bản đồ (tích hợp sau)"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            {/* Online Meeting */}
            {(event.attendance_mode === "ONLINE" ||
              event.attendance_mode === "HYBRID") &&
              event.meeting_url && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      {t("event.onlineMeeting") || "Tham gia trực tuyến"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {event.stream_platform && (
                      <p className="text-sm text-muted-foreground">
                        {t("event.platform") || "Nền tảng"}:{" "}
                        {event.stream_platform}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      asChild
                    >
                      <a
                        href={event.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {t("event.joinMeeting") || "Tham gia"}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}

            {/* Organizer */}
            {event.organization && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {t("event.organizer") || "Ban tổ chức"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    {event.organization.logo_url && (
                      <img
                        src={event.organization.logo_url}
                        alt={event.organization.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{event.organization.name}</p>
                      {event.organization.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {event.organization.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {event.organization.website && (
                    <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                      <a
                        href={event.organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {t("common.website") || "Website"}
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            {(event.contact_email || event.contact_phone || event.website_url) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("event.contactInfo") || "Thông tin liên hệ"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {event.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${event.contact_email}`}
                        className="text-sm hover:underline"
                      >
                        {event.contact_email}
                      </a>
                    </div>
                  )}
                  {event.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${event.contact_phone}`}
                        className="text-sm hover:underline"
                      >
                        {event.contact_phone}
                      </a>
                    </div>
                  )}
                  {event.website_url && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={event.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline"
                      >
                        {t("common.website") || "Website"}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Additional Info */}
            {(event.capacity_total ||
              event.age_restriction ||
              event.refund_policy) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("event.additionalInfo") || "Thông tin thêm"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {event.capacity_total && (
                    <div>
                      <p className="text-muted-foreground">
                        {t("event.capacity") || "Sức chứa"}:
                      </p>
                      <p className="font-medium">
                        {event.capacity_total.toLocaleString()} {t("common.people") || "người"}
                      </p>
                    </div>
                  )}
                  {event.age_restriction && (
                    <div>
                      <p className="text-muted-foreground">
                        {t("event.ageRestriction") || "Độ tuổi"}:
                      </p>
                      <p className="font-medium">{event.age_restriction}</p>
                    </div>
                  )}
                  {event.refund_policy && (
                    <div>
                      <p className="text-muted-foreground">
                        {t("event.refundPolicy") || "Chính sách hoàn tiền"}:
                      </p>
                      <p className="text-xs">{event.refund_policy}</p>
                    </div>
                  )}
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
