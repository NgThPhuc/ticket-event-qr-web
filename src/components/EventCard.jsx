import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Globe, MapPin, Monitor, Ticket } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

/**
 * EventCard Component
 * Card hiển thị sự kiện trong danh sách với design modern
 * 
 * @param {Object} event - Thông tin event
 */
const EventCard = ({ event }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClick = () => {
    navigate(`/e/${event.slug}`);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format price
  const formatPrice = (price) => {
    if (!price || price === 0) return t('ticket.free') || 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get attendance mode icon and label
  const getAttendanceMode = (mode) => {
    switch (mode) {
      case 'ONLINE':
        return { icon: Monitor, label: t('event.online') || 'Online', color: 'text-blue-600' };
      case 'OFFLINE':
        return { icon: MapPin, label: t('event.offline') || 'Offline', color: 'text-green-600' };
      case 'HYBRID':
        return { icon: Globe, label: t('event.hybrid') || 'Hybrid', color: 'text-purple-600' };
      default:
        return { icon: MapPin, label: mode, color: 'text-primary' };
    }
  };

  const attendanceMode = getAttendanceMode(event.attendance_mode);
  const AttendanceIcon = attendanceMode.icon;

  // Get location text
  const getLocationText = () => {
    if (event.attendance_mode === 'ONLINE') {
      return t('home.featured.online') || 'Sự kiện trực tuyến';
    }
    if (event.venue_name) return event.venue_name;
    if (event.city) return event.city;
    return t('home.featured.locationTBA') || 'Địa điểm sẽ thông báo';
  };

  return (
    <div 
      className="group bg-white dark:bg-gray-900 rounded-[1.5rem] p-3 shadow-lg hover:shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer border border-gray-100 dark:border-gray-800 hover:border-primary/30 dark:hover:border-primary/30"
      onClick={handleClick}
    >
      {/* Image Section with Hover Effect */}
      <div className="relative overflow-hidden rounded-xl h-44">
        {event.cover_image_url ? (
          <img 
            src={event.cover_image_url}
            alt={event.title}
            loading="lazy"
            className="w-full h-full object-cover transform transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center">
            <Calendar className="h-12 w-12 text-white/40" />
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"></div>
        
        {/* Date Badge - Top Left */}
        <div className="absolute top-3 left-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl px-3 py-2 shadow-lg backdrop-blur-sm">
            <p className="text-xs font-bold text-primary uppercase tracking-wide">
              {formatDate(event.start_at)}
            </p>
          </div>
        </div>

        {/* Attendance Mode Badge - Top Right */}
        <div className="absolute top-3 right-3">
          <Badge 
            variant="secondary" 
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-xs font-medium gap-1 shadow-sm"
          >
            <AttendanceIcon className={`h-3 w-3 ${attendanceMode.color}`} />
            {attendanceMode.label}
          </Badge>
        </div>

        {/* Category Badge - Bottom Left */}
        {event.category && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-primary/90 hover:bg-primary text-white shadow-lg">
              {event.category}
            </Badge>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="mt-4 px-1">
        {/* Metadata (Time & Location) */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-primary mr-1.5 flex-shrink-0" />
            <span className="text-xs">{formatTime(event.start_at)}</span>
          </div>
          <div className="flex items-center min-w-0">
            <MapPin className="w-4 h-4 text-primary mr-1.5 flex-shrink-0" />
            <span className="truncate text-xs">{getLocationText()}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-foreground leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {event.title}
        </h3>

        {/* Description/Subtitle */}
        {event.subtitle && (
          <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">
            {event.subtitle}
          </p>
        )}

        {/* Organizer */}
        {event.organization && (
          <div className="flex items-center gap-2 mb-4">
            {event.organization.logo_url ? (
              <img
                src={event.organization.logo_url}
                alt={event.organization.name}
                className="h-6 w-6 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {event.organization.name?.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-xs text-muted-foreground truncate">
              {event.organization.name}
            </span>
          </div>
        )}

        {/* Divider Line */}
        <div className="border-t border-gray-100 dark:border-gray-800 mb-4"></div>

        {/* Price & CTA Button */}
        <div className="flex items-center justify-between gap-3">
          {/* Price */}
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary" />
            <span className="font-bold text-primary">
              {event.min_price ? formatPrice(event.min_price) : (t('ticket.free') || 'Miễn phí')}
            </span>
          </div>

          {/* Button with Hover Effect */}
          <button className="group/btn relative bg-primary text-white rounded-full overflow-hidden shadow-md hover:shadow-lg transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] px-5 py-2.5">
            {/* Hover background layer */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0 bg-primary/80 dark:bg-white/20 group-hover/btn:w-full transition-[width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] -translate-x-1/2 rounded-full"></div>
            
            {/* Button content */}
            <span className="relative z-10 text-sm font-semibold whitespace-nowrap">
              {t('home.featured.details') || 'Chi tiết'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
