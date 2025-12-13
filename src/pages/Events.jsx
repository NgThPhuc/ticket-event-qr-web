import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Filter, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPublicEvents } from '../api/events';
import EventCard from '../components/EventCard';
import Header from '../components/Header';

const Events = () => {
    const { t } = useTranslation();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [attendanceMode, setAttendanceMode] = useState('all');
    const [category, setCategory] = useState('all');
    const abortControllerRef = useRef(null);

    useEffect(() => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const fetchEvents = async () => {
            setLoading(true);
            setError('');
            try {
                const params = {
                    page,
                    limit,
                    sort: 'start_at:desc',
                };

                if (searchQuery) {
                    params.q = searchQuery;
                }

                if (attendanceMode && attendanceMode !== 'all') {
                    params.attendance_mode = attendanceMode;
                }

                if (category && category !== 'all') {
                    params.category = category;
                }

                const response = await getPublicEvents(params);
                setEvents(response.data || []);
                setTotalPages(response.meta?.totalPages || 1);
            } catch (err) {
                if (err.name === 'AbortError') return;
                setError(err.message || t('eventsPage.loadError'));
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [page, searchQuery, attendanceMode, category, limit, t]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                        {t('eventsPage.title') || 'Sự kiện'}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        {t('eventsPage.subtitle') || 'Khám phá các sự kiện thú vị'}
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-8 space-y-4">
                    <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder={t('eventsPage.searchPlaceholder') || 'Tìm kiếm sự kiện...'}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={attendanceMode} onValueChange={(value) => setAttendanceMode(value)}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder={t('eventsPage.filterAll') || 'Tất cả'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('eventsPage.filterAll') || 'Tất cả'}</SelectItem>
                                <SelectItem value="OFFLINE">{t('eventsPage.filterOffline') || 'Tại địa điểm'}</SelectItem>
                                <SelectItem value="ONLINE">{t('eventsPage.filterOnline') || 'Trực tuyến'}</SelectItem>
                                <SelectItem value="HYBRID">{t('eventsPage.filterHybrid') || 'Kết hợp'}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button type="submit">{t('eventsPage.searchButton') || 'Tìm kiếm'}</Button>
                    </form>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="mt-4 text-muted-foreground">
                                {t('common.loading') || 'Đang tải...'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-8">
                        <p className="text-destructive">{error}</p>
                    </div>
                )}

                {/* Events Grid */}
                {!loading && !error && (
                    <>
                        {events.length === 0 ? (
                            <div className="text-center py-12">
                                <CalendarIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-xl text-foreground mb-2">
                                    {t('eventsPage.noEventsTitle') || 'Không có sự kiện nào'}
                                </p>
                                <p className="text-muted-foreground">
                                    {t('eventsPage.noEventsDescription') || 'Vui lòng thử lại với bộ lọc khác'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                    {events.map((event) => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            {t('eventsPage.prev') || 'Trước'}
                                        </Button>
                                        <span className="text-sm text-muted-foreground">
                                            {t('eventsPage.page') || 'Trang'} {page} / {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                        >
                                            {t('eventsPage.next') || 'Sau'}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Events;
