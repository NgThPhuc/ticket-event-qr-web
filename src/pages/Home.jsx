import HeroSlider from '@/components/HeroSlider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, MapPin, Ticket } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { getPublicEvents } from '../api/events';
import CategoryEventsSection from '../components/CategoryEventsSection';
import Header from '../components/Header';
import LocationSection from '../components/LocationSection';

const Home = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [featuredEvents, setFeaturedEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const hasFetched = useRef(false);
    
    // Slider state for featured events
    const [currentIndex, setCurrentIndex] = useState(0);
    const visibleCards = 4;

    // State for "This Week / This Month" section
    const [activeTab, setActiveTab] = useState('weekend'); // 'weekend' | 'month'
    const [weekendEvents, setWeekendEvents] = useState([]);
    const [monthEvents, setMonthEvents] = useState([]);
    const [loadingTimeFilter, setLoadingTimeFilter] = useState(true);
    const [timeFilterIndex, setTimeFilterIndex] = useState(0);

    // Helper function to get weekend date range
    const getWeekendDateRange = () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        
        // Calculate Saturday (next or current)
        const daysUntilSaturday = dayOfWeek === 0 ? 6 : (6 - dayOfWeek);
        const saturday = new Date(now);
        saturday.setDate(now.getDate() + daysUntilSaturday);
        saturday.setHours(0, 0, 0, 0);
        
        // Sunday is the day after Saturday
        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        sunday.setHours(23, 59, 59, 999);
        
        return { start: saturday, end: sunday };
    };

    // Helper function to get this month's date range
    const getMonthDateRange = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start, end };
    };

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const fetchAllEvents = async () => {
            try {
                // Fetch featured events
                const response = await getPublicEvents({ limit: 10, sort: 'start_at:asc' });
                const allEvents = response.data || [];
                setFeaturedEvents(allEvents);

                // Filter events for weekend
                const weekendRange = getWeekendDateRange();
                const weekend = allEvents.filter(event => {
                    const eventDate = new Date(event.start_at);
                    return eventDate >= weekendRange.start && eventDate <= weekendRange.end;
                });
                setWeekendEvents(weekend);

                // Filter events for this month
                const monthRange = getMonthDateRange();
                const month = allEvents.filter(event => {
                    const eventDate = new Date(event.start_at);
                    return eventDate >= monthRange.start && eventDate <= monthRange.end;
                });
                setMonthEvents(month);

            } catch (err) {
                console.error('Error fetching events:', err);
            } finally {
                setLoading(false);
                setLoadingTimeFilter(false);
            }
        };
        fetchAllEvents();
    }, []);

    // Slider navigation for featured events
    const maxIndex = Math.max(0, featuredEvents.length - visibleCards);
    const handlePrev = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
    const handleNext = () => setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex < maxIndex;

    // Slider navigation for time-filtered events
    const currentTimeEvents = activeTab === 'weekend' ? weekendEvents : monthEvents;
    const maxTimeIndex = Math.max(0, currentTimeEvents.length - visibleCards);
    const handleTimePrev = () => setTimeFilterIndex((prev) => Math.max(0, prev - 1));
    const handleTimeNext = () => setTimeFilterIndex((prev) => Math.min(maxTimeIndex, prev + 1));
    const canTimeGoPrev = timeFilterIndex > 0;
    const canTimeGoNext = timeFilterIndex < maxTimeIndex;

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setTimeFilterIndex(0);
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

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(price || 0);
    };

    // Reusable Event Card Component
    const EventCard = ({ event, showFullDate = false }) => (
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
                    {!showFullDate && (
                        <div className="absolute top-3 left-3">
                            <Badge className="bg-white/90 text-foreground hover:bg-white">
                                {formatDate(event.start_at)}
                            </Badge>
                        </div>
                    )}
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
                        <span>{t('eventDetail.priceFrom')} {formatPrice(event.pricing?.min_price)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatFullDate(event.start_at)}</span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <HeroSlider />
            
            {/* Featured Events Section */}
            <section className="py-12 md:py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                                {t('home.featured.title')}
                            </h2>
                        </div>
                        <Button variant="outline" onClick={() => navigate('/events')}>
                            {t('home.featured.viewAll')}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <Card key={i} className="overflow-hidden animate-pulse">
                                    <div className="h-48 bg-muted"></div>
                                    <CardContent className="p-5">
                                        <div className="h-4 bg-muted rounded w-1/4 mb-3"></div>
                                        <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                                        <div className="h-4 bg-muted rounded w-1/2"></div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : featuredEvents.length > 0 ? (
                        <div className="relative">
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

                            <div className="overflow-hidden mx-2">
                                <div 
                                    className="flex transition-transform duration-300 ease-in-out"
                                    style={{ transform: `translateX(-${currentIndex * (100 / visibleCards)}%)` }}
                                >
                                    {featuredEvents.map((event) => (
                                        <div 
                                            key={event.id} 
                                            className="flex-shrink-0 px-3"
                                            style={{ width: `${100 / visibleCards}%` }}
                                        >
                                            <Link to={`/e/${event.slug}`}>
                                                <Card className="overflow-hidden group h-full border-0 shadow-none bg-transparent">
                                                    <div className="relative h-48 overflow-hidden rounded-b-xl">
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
                                                    <CardContent className="p-5">
                                                        <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
                                                            {event.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <MapPin className="w-4 h-4 flex-shrink-0" />
                                                            <span className="line-clamp-1">
                                                                {event.attendance_mode === 'ONLINE'
                                                                    ? t('home.featured.online')
                                                                    : event.venue_name || event.city || t('home.featured.locationTBA')}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 pt-1">
                                                            <Ticket className="w-4 h-4 text-primary" />
                                                            <span className="text-sm">
                                                                <span className="text-muted-foreground">{t('eventDetail.priceFrom')}: </span>
                                                                <span className="font-semibold text-primary">{formatPrice(event.pricing?.min_price)}</span>
                                                            </span>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">{t('home.featured.noEvents')}</h3>
                            <p className="text-muted-foreground mb-6">{t('home.featured.noEventsDesc')}</p>
                            <Button onClick={() => navigate('/events')}>
                                {t('home.hero.exploreEvents')}
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Events by Category Sections (Âm nhạc, Sân khấu, Tham quan...) */}
            <CategoryEventsSection />

            {/* Location Section - Điểm đến thú vị */}
            <LocationSection />

            {/* This Weekend / This Month Section */}
            {/* <section className="py-8 md:py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => handleTabChange('weekend')}
                                className={`text-lg font-semibold transition-colors pb-2 border-b-2 ${
                                    activeTab === 'weekend' 
                                        ? 'text-primary border-primary' 
                                        : 'text-muted-foreground border-transparent hover:text-foreground'
                                }`}
                            >
                                {t('home.timeFilter.weekend', 'Cuối tuần này')}
                            </button>
                            <button
                                onClick={() => handleTabChange('month')}
                                className={`text-lg font-semibold transition-colors pb-2 border-b-2 ${
                                    activeTab === 'month' 
                                        ? 'text-primary border-primary' 
                                        : 'text-muted-foreground border-transparent hover:text-foreground'
                                }`}
                            >
                                {t('home.timeFilter.month', 'Tháng này')}
                            </button>
                        </div>

                        <Button variant="ghost" onClick={() => navigate('/events')} className="text-primary">
                            {t('home.featured.viewAll', 'Xem thêm')}
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>

                    {loadingTimeFilter ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <Card key={i} className="overflow-hidden animate-pulse">
                                    <div className="h-48 bg-muted"></div>
                                    <CardContent className="p-4">
                                        <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                                        <div className="h-4 bg-muted rounded w-1/2 mb-1"></div>
                                        <div className="h-4 bg-muted rounded w-2/3"></div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : currentTimeEvents.length > 0 ? (
                        <div className="relative">
                            {currentTimeEvents.length > visibleCards && (
                                <>
                                    <button
                                        onClick={handleTimePrev}
                                        disabled={!canTimeGoPrev}
                                        className={`absolute left-0 top-24 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-all duration-200 ${
                                            canTimeGoPrev ? 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                                        }`}
                                        aria-label="Previous"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    </button>

                                    <button
                                        onClick={handleTimeNext}
                                        disabled={!canTimeGoNext}
                                        className={`absolute right-0 top-24 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-all duration-200 ${
                                            canTimeGoNext ? 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                                        }`}
                                        aria-label="Next"
                                    >
                                        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    </button>
                                </>
                            )}

                            <div className="overflow-hidden mx-2">
                                <div 
                                    className="flex transition-transform duration-300 ease-in-out"
                                    style={{ transform: `translateX(-${timeFilterIndex * (100 / visibleCards)}%)` }}
                                >
                                    {currentTimeEvents.map((event) => (
                                        <div 
                                            key={event.id} 
                                            className="flex-shrink-0 px-3"
                                            style={{ width: `${100 / visibleCards}%` }}
                                        >
                                            <EventCard event={event} showFullDate={true} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-foreground mb-1">
                                {activeTab === 'weekend' 
                                    ? t('home.timeFilter.noWeekendEvents', 'Không có sự kiện cuối tuần này')
                                    : t('home.timeFilter.noMonthEvents', 'Không có sự kiện trong tháng này')
                                }
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                {t('home.timeFilter.checkBack', 'Hãy quay lại sau để xem các sự kiện mới!')}
                            </p>
                        </div>
                    )}
                </div>
            </section> */}
        </div>
    );
};

export default Home;

