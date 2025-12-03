import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Building2, Calendar, Globe, MapPin, Monitor, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

/**
 * EventCard Component
 * Card hiển thị sự kiện trong danh sách
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get attendance mode icon
  const getAttendanceModeIcon = (mode) => {
    switch (mode) {
      case 'ONLINE':
        return <Monitor className="h-4 w-4" />;
      case 'OFFLINE':
        return <MapPin className="h-4 w-4" />;
      case 'HYBRID':
        return <Globe className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  // Get attendance mode label
  const getAttendanceModeLabel = (mode) => {
    switch (mode) {
      case 'ONLINE':
        return t('event.online') || 'Trực tuyến';
      case 'OFFLINE':
        return t('event.offline') || 'Tại địa điểm';
      case 'HYBRID':
        return t('event.hybrid') || 'Kết hợp';
      default:
        return mode;
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50"
      onClick={handleClick}
    >
      {/* Cover Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Category badge overlay */}
        {event.category && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/90 dark:bg-gray-900/90 backdrop-blur">
              {event.category}
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-2">
          {/* Title */}
          <h3 className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          
          {/* Subtitle */}
          {event.subtitle && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {event.subtitle}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Date */}
        <div className="flex items-start gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-foreground">
              {formatDate(event.start_at)}
            </p>
            {event.end_at && (
              <p className="text-xs text-muted-foreground">
                {t('event.until') || 'đến'} {formatDate(event.end_at)}
              </p>
            )}
          </div>
        </div>

        {/* Location/Mode */}
        <div className="flex items-start gap-2 text-sm">
          {getAttendanceModeIcon(event.attendance_mode)}
          <div className="flex-1">
            {event.attendance_mode === 'ONLINE' ? (
              <p className="text-muted-foreground">{getAttendanceModeLabel(event.attendance_mode)}</p>
            ) : (
              <>
                <p className="font-medium text-foreground line-clamp-1">
                  {event.venue_name || getAttendanceModeLabel(event.attendance_mode)}
                </p>
                {event.city && (
                  <p className="text-xs text-muted-foreground">
                    {event.district && `${event.district}, `}{event.city}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Organization */}
        {event.organization && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {event.organization.logo_url && (
                <img
                  src={event.organization.logo_url}
                  alt={event.organization.name}
                  className="h-5 w-5 rounded-full object-cover flex-shrink-0"
                />
              )}
              <span className="text-muted-foreground truncate">
                {event.organization.name}
              </span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          {/* Attendance mode badge */}
          <Badge variant="outline" className="gap-1">
            {getAttendanceModeIcon(event.attendance_mode)}
            {getAttendanceModeLabel(event.attendance_mode)}
          </Badge>

          {/* Capacity indicator */}
          {event.capacity_total && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{event.capacity_total.toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
