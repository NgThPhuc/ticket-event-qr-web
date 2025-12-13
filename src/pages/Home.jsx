import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Globe,
  MapPin,
  MousePointer2,
  QrCode,
  Search,
  Sparkles,
  Star,
  Ticket,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { getPublicEvents } from '../api/events';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
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

  const categories = [
    { icon: '🎵', name: t('home.categories.music'), color: 'from-pink-500 to-rose-500' },
    { icon: '💼', name: t('home.categories.business'), color: 'from-blue-500 to-cyan-500' },
    { icon: '🎨', name: t('home.categories.art'), color: 'from-purple-500 to-violet-500' },
    { icon: '🏃', name: t('home.categories.sports'), color: 'from-green-500 to-emerald-500' },
    { icon: '🍕', name: t('home.categories.food'), color: 'from-orange-500 to-amber-500' },
    { icon: '💻', name: t('home.categories.tech'), color: 'from-indigo-500 to-blue-500' },
  ];

  const stats = [
    { number: '10K+', label: t('home.stats.events'), icon: Calendar },
    { number: '500K+', label: t('home.stats.attendees'), icon: Users },
    { number: '1K+', label: t('home.stats.organizers'), icon: Globe },
    { number: '99%', label: t('home.stats.satisfaction'), icon: Star },
  ];

  const steps = [
    {
      icon: Search,
      title: t('home.howItWorks.step1Title'),
      description: t('home.howItWorks.step1Desc'),
    },
    {
      icon: MousePointer2,
      title: t('home.howItWorks.step2Title'),
      description: t('home.howItWorks.step2Desc'),
    },
    {
      icon: QrCode,
      title: t('home.howItWorks.step3Title'),
      description: t('home.howItWorks.step3Desc'),
    },
  ];

  const features = [
    {
      icon: QrCode,
      title: t('home.whyUs.qrCheckin'),
      description: t('home.whyUs.qrCheckinDesc'),
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      icon: Ticket,
      title: t('home.whyUs.flexibleTickets'),
      description: t('home.whyUs.flexibleTicketsDesc'),
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      icon: TrendingUp,
      title: t('home.whyUs.reports'),
      description: t('home.whyUs.reportsDesc'),
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      icon: Globe,
      title: t('home.whyUs.eventTypes'),
      description: t('home.whyUs.eventTypesDesc'),
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      icon: Users,
      title: t('home.whyUs.teamManagement'),
      description: t('home.whyUs.teamManagementDesc'),
      color: 'text-pink-600',
      bg: 'bg-pink-100 dark:bg-pink-900/30',
    },
    {
      icon: Zap,
      title: t('home.whyUs.fastPayment'),
      description: t('home.whyUs.fastPaymentDesc'),
      color: 'text-yellow-600',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return t('home.featured.free');
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm mb-8 border border-white/20">
              <Sparkles className="w-4 h-4" />
              <span>{t('home.hero.badge')}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              {t('home.hero.headline1')}
              <span className="block mt-2 bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                {t('home.hero.headline2')}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              {t('home.hero.description')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-purple-700 hover:bg-white/90 px-8 py-6 text-lg font-semibold shadow-xl shadow-purple-900/20"
                onClick={() => navigate('/events')}
              >
                <Search className="w-5 h-5 mr-2" />
                {t('home.hero.exploreEvents')}
              </Button>
              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold backdrop-blur-sm"
                  onClick={() => navigate('/register')}
                >
                  {t('home.hero.registerFree')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>{t('home.hero.securePayment')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>{t('home.hero.flexibleRefund')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>{t('home.hero.support247')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('home.categories.title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('home.categories.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/events?category=${category.name}`}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 overflow-hidden">
                  <CardContent className={`p-6 text-center bg-gradient-to-br ${category.color} group-hover:scale-105 transition-transform duration-300`}>
                    <div className="text-4xl mb-3">{category.icon}</div>
                    <div className="font-semibold text-white">{category.name}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-primary font-medium mb-2">
                <TrendingUp className="w-4 h-4" />
                <span>{t('home.featured.badge')}</span>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event) => (
                <Link key={event.id} to={`/e/${event.slug}`}>
                  <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                    <div className="relative h-48 overflow-hidden">
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
                      <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      {event.subtitle && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-1">{event.subtitle}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-1">
                          {event.attendance_mode === 'ONLINE'
                            ? t('home.featured.online')
                            : event.venue_name || event.city || t('home.featured.locationTBA')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-primary">
                            {event.min_price ? formatPrice(event.min_price) : t('home.featured.free')}
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

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-primary font-medium mb-2">
              <Zap className="w-4 h-4" />
              <span>{t('home.howItWorks.badge')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('home.howItWorks.title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('home.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
                )}
                <Card className="text-center p-8 h-full hover:shadow-lg transition-shadow border-0 bg-background">
                  <div className="relative inline-flex">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-primary/25">
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-4 border-primary flex items-center justify-center font-bold text-primary text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>

            <CardContent className="relative p-8 md:p-16 text-center">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  {t('home.cta.title')}
                </h2>
                <p className="text-lg md:text-xl text-white/80 mb-8">
                  {t('home.cta.description')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {isAuthenticated ? (
                    <Button
                      size="lg"
                      className="bg-white text-purple-700 hover:bg-white/90 px-8 py-6 text-lg font-semibold"
                      onClick={() => navigate('/create-organization')}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      {t('home.cta.createOrg')}
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        className="bg-white text-purple-700 hover:bg-white/90 px-8 py-6 text-lg font-semibold"
                        onClick={() => navigate('/register')}
                      >
                        {t('home.cta.startFree')}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold"
                        onClick={() => navigate('/login')}
                      >
                        {t('home.cta.login')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('home.whyUs.title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('home.whyUs.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-0">
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground mb-4">
            {t('home.footer.questions')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" onClick={() => navigate('/contact')}>
              {t('home.footer.contactSupport')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/policy')}>
              {t('home.footer.policies')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
