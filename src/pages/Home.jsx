import HeroSlider from '@/components/HeroSlider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Calendar, MapPin, Ticket } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { getPublicEvents } from '../api/events';
import Header from '../components/Header';

const Home = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [featuredEvents, setFeaturedEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const hasFetched = useRef(false);

    useEffect(() => {
        // Tránh duplicate call trong StrictMode
        if (hasFetched.current) return;
        hasFetched.current = true;

        const fetchEvents = async () => {
            try {
                const response = await getPublicEvents({ limit: 6, sort: 'start_at:asc' });
                setFeaturedEvents(response.data || []);
            } catch (err) {
                console.error('Error fetching events:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'short',
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(price || 0);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <HeroSlider />
            {/* Featured Events Section */}
            <section className="py-12 md:py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                        <div>
                            {/* <div className="inline-flex items-center gap-2 text-primary font-medium mb-2">
                                <TrendingUp className="w-4 h-4" />
                                <span>{t('home.featured.badge')}</span>
                            </div> */}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {featuredEvents.map((event) => (
                                <Link key={event.id} to={`/e/${event.slug}`}>
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
                                            {/* {event.subtitle && (
                                                <p className="text-muted-foreground text-sm mb-3 line-clamp-1">{event.subtitle}</p>
                                            )} */}
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                                <span className="line-clamp-1">
                                                    {event.attendance_mode === 'ONLINE'
                                                        ? t('home.featured.online')
                                                        : event.venue_name || event.city || t('home.featured.locationTBA')}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between pt-1">
                                                <div className="flex items-center gap-2">
                                                    <Ticket className="w-4 h-4 text-primary" />
                                                    <span className="text-sm">
                                                        <span className="text-muted-foreground">{t('eventDetail.priceFrom')}: </span>
                                                        <span className="font-semibold text-primary">{formatPrice(event.pricing?.min_price)}</span>
                                                    </span>
                                                </div>
                                                <Button size="sm" variant="ghost" className="text-primary hover:text-primary">
                                                    {t('home.featured.details')}
                                                    <ArrowRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
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
        </div>
    );
};

export default Home;
