import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    ArrowRight,
    Briefcase,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Film,
    Gamepad2,
    GraduationCap,
    Heart,
    MoreHorizontal,
    Music,
    Palette,
    Plane,
    Star,
    Ticket,
    Utensils
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories } from '../api/categories';
import { getPublicEvents } from '../api/events';

// Map icon name từ backend sang lucide-react component
const iconMap = {
    'music': Music,
    'palette': Palette,
    'plane': Plane,
    'more-horizontal': MoreHorizontal,
    'film': Film,
    'gamepad-2': Gamepad2,
    'graduation-cap': GraduationCap,
    'heart': Heart,
    'briefcase': Briefcase,
    'utensils': Utensils,
    'star': Star,
};

const getIconComponent = (iconName) => {
    return iconMap[iconName] || Star;
};

/**
 * CategorySection - Hiển thị events theo một category với slider
 */
const CategorySection = ({ category, visibleCards = 4 }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    const IconComponent = getIconComponent(category.icon);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await getPublicEvents({
                    category_slugs: category.slug,
                    limit: 10,
                    sort: 'start_at:asc'
                });
                setEvents(response.data || []);
            } catch (err) {
                console.error(`Error fetching events for category ${category.slug}:`, err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [category.slug]);

    const maxIndex = Math.max(0, events.length - visibleCards);
    const handlePrev = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
    const handleNext = () => setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex < maxIndex;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(price || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'short',
        });
    };

    const formatFullDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    // Don't render if no events
    if (!loading && events.length === 0) {
        return null;
    }

    return (
        <section className="py-8 md:py-10">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <IconComponent 
                            className="w-5 h-5" 
                            style={{ color: category.color || '#6B7280' }} 
                        />
                        <h2 
                            className="text-xl font-bold text-foreground"
                            style={{ color: category.color || undefined }}
                        >
                            {category.name}
                        </h2>
                    </div>
                    <button 
                        onClick={() => navigate(`/events?category_slugs=${category.slug}`)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                        {t('home.featured.viewAll', 'Xem thêm')}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Loading Skeleton */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i} className="overflow-hidden animate-pulse border-0">
                                <div className="h-48 bg-muted rounded-xl"></div>
                                <CardContent className="p-4">
                                    <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-muted rounded w-1/2 mb-1"></div>
                                    <div className="h-4 bg-muted rounded w-2/3"></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="relative">
                        {/* Navigation Arrows */}
                        {events.length > visibleCards && (
                            <>
                                <button
                                    onClick={handlePrev}
                                    disabled={!canGoPrev}
                                    className={`absolute left-0 top-24 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-all duration-200 ${
                                        canGoPrev ? 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                                    }`}
                                    aria-label="Previous"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </button>

                                <button
                                    onClick={handleNext}
                                    disabled={!canGoNext}
                                    className={`absolute right-0 top-24 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-all duration-200 ${
                                        canGoNext ? 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                                    }`}
                                    aria-label="Next"
                                >
                                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </button>
                            </>
                        )}

                        {/* Slider */}
                        <div className="overflow-hidden mx-2">
                            <div 
                                className="flex transition-transform duration-300 ease-in-out"
                                style={{ transform: `translateX(-${currentIndex * (100 / visibleCards)}%)` }}
                            >
                                {events.map((event) => (
                                    <div 
                                        key={event.id} 
                                        className="flex-shrink-0 px-3"
                                        style={{ width: `${100 / visibleCards}%` }}
                                    >
                                        <Link to={`/e/${event.slug}`}>
                                            <Card className="overflow-hidden group h-full border-0 shadow-none bg-transparent">
                                                <div className="relative h-48 overflow-hidden rounded-xl">
                                                    {event.cover_image_url ? (
                                                        <img
                                                            src={event.cover_image_url}
                                                            alt={event.title}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                                            <Calendar className="w-12 h-12 text-white/50" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-3 left-3">
                                                        <Badge className="bg-white text-gray-900 hover:bg-white font-semibold shadow-sm">
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

/**
 * CategoryEventsSection - Container cho nhiều CategorySection
 * Hiển thị events theo từng category (trừ category "Khác")
 */
const CategoryEventsSection = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getCategories();
                // Filter categories: chỉ lấy active
                const activeCategories = (response || [])
                    .filter(cat => cat.is_active !== false)
                    .sort((a, b) => (a.order || 0) - (b.order || 0));
                setCategories(activeCategories);
            } catch (err) {
                console.error('Error fetching categories:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) {
        return null;
    }

    if (categories.length === 0) {
        return null;
    }

    return (
        <div>
            {categories.map((category) => (
                <CategorySection key={category.id} category={category} />
            ))}
        </div>
    );
};

export default CategoryEventsSection;
