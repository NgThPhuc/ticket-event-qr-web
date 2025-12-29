import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Ticket } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

/**
 * EventCard Component
 * Card hiển thị sự kiện với design giống CategoryEventsSection
 * 
 * @param {Object} event - Thông tin event
 */
const EventCard = ({ event }) => {
    const { t } = useTranslation();

    // Format date short (e.g., "27 thg 1")
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'short',
        });
    };

    // Format full date (e.g., "27 tháng 1, 2026")
    const formatFullDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(price || 0);
    };

    return (
        <Link to={`/e/${event.slug}`}>
            <Card className="overflow-hidden group h-full border-0 shadow-none bg-transparent">
                <div className="relative h-48 overflow-hidden rounded-xl">
                    {event.cover_image_url ? (
                        <img
                            src={event.cover_image_url}
                            alt={event.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-white/50" />
                        </div>
                    )}
                    <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 text-foreground hover:bg-white">
                            {formatDate(event.start_at)}
                        </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                        <Badge variant={event.attendance_mode === 'ONLINE' ? 'secondary' : 'default'}>
                            {event.attendance_mode === 'ONLINE' ? '🌐 Online' : event.attendance_mode === 'HYBRID' ? '🔄 Hybrid' : '📍 Offline'}
                        </Badge>
                    </div>
                </div>
                <CardContent className="p-4">
                    <h3 className="font-bold text-base text-foreground mb-2 line-clamp-2 min-h-[3rem] group-hover:text-primary transition-colors">
                        {event.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-primary mb-1">
                        <Ticket className="w-4 h-4" />
                        <span>{t('eventDetail.priceFrom', 'Từ')} {formatPrice(event.pricing?.min_price)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatFullDate(event.start_at)}</span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

export default EventCard;
