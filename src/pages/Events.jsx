import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    ArrowDownAZ,
    ArrowUpAZ,
    Calendar as CalendarIcon,
    Filter,
    MapPin,
    RotateCcw,
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { getCategories } from '../api/categories';
import { getPublicEvents } from '../api/events';
import EventCard from '../components/EventCard';
import Header from '../components/Header';

const Events = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    const [totalPages, setTotalPages] = useState(1);
    const [categories, setCategories] = useState([]);
    const [initialParamsApplied, setInitialParamsApplied] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [attendanceMode, setAttendanceMode] = useState('all');
    const [city, setCity] = useState('');
    const [timeFrom, setTimeFrom] = useState('');
    const [timeTo, setTimeTo] = useState('');
    const [upcoming, setUpcoming] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [sortField, setSortField] = useState('start_at');
    const [sortDirection, setSortDirection] = useState('asc');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const abortControllerRef = useRef(null);

    // Read URL params on mount and apply them
    useEffect(() => {
        const q = searchParams.get('q');
        const mode = searchParams.get('attendance_mode');
        const cityParam = searchParams.get('city');
        const timeFromParam = searchParams.get('time_from');
        const timeToParam = searchParams.get('time_to');
        const upcomingParam = searchParams.get('upcoming');
        const categorySlugs = searchParams.get('category_slugs');
        const sortParam = searchParams.get('sort');

        if (q) setSearchQuery(q);
        if (mode) setAttendanceMode(mode);
        if (cityParam) setCity(cityParam);
        if (timeFromParam) setTimeFrom(timeFromParam);
        if (timeToParam) setTimeTo(timeToParam);
        if (upcomingParam === 'true') setUpcoming(true);
        if (categorySlugs) setSelectedCategories(categorySlugs.split(','));
        if (sortParam) {
            const [field, dir] = sortParam.split(':');
            if (field) setSortField(field);
            if (dir) setSortDirection(dir);
        }
        
        setInitialParamsApplied(true);
    }, []); // Only run once on mount

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getCategories();
                setCategories(response || []);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    // Fetch events
    useEffect(() => {
        // Wait for initial URL params to be applied
        if (!initialParamsApplied) return;

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
                    sort: `${sortField}:${sortDirection}`,
                };

                if (searchQuery) {
                    params.q = searchQuery;
                }

                if (attendanceMode && attendanceMode !== 'all') {
                    params.attendance_mode = attendanceMode;
                }

                if (city && city.trim()) {
                    params.city = city.trim();
                }

                if (timeFrom) {
                    params.time_from = new Date(timeFrom).toISOString();
                }

                if (timeTo) {
                    params.time_to = new Date(timeTo).toISOString();
                }

                if (upcoming) {
                    params.upcoming = true;
                }

                if (selectedCategories.length > 0) {
                    params.category_slugs = selectedCategories.join(',');
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
    }, [initialParamsApplied, page, searchQuery, attendanceMode, city, timeFrom, timeTo, upcoming, selectedCategories, sortField, sortDirection, limit, t]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
    };

    const handleCategoryToggle = (slug) => {
        setSelectedCategories((prev) =>
            prev.includes(slug)
                ? prev.filter((s) => s !== slug)
                : [...prev, slug]
        );
        setPage(1);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setAttendanceMode('all');
        setCity('');
        setTimeFrom('');
        setTimeTo('');
        setUpcoming(false);
        setSelectedCategories([]);
        setSortField('start_at');
        setSortDirection('asc');
        setPage(1);
    };

    const activeFiltersCount = [
        attendanceMode !== 'all',
        city.trim() !== '',
        timeFrom !== '',
        timeTo !== '',
        upcoming,
        selectedCategories.length > 0,
    ].filter(Boolean).length;

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
                        {t('eventsPage.subtitle') || 'Khám phá các sự kiện công khai đang diễn ra'}
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-8 space-y-4">
                    {/* Main Search Row */}
                    <form onSubmit={handleSearch} className="flex gap-3 flex-wrap items-center">
                        {/* Search Input */}
                        <div className="flex-1 min-w-[250px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder={t('eventsPage.searchPlaceholder') || 'Tìm kiếm sự kiện...'}
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(1);
                                    }}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Attendance Mode Filter */}
                        <Select value={attendanceMode} onValueChange={(value) => {
                            setAttendanceMode(value);
                            setPage(1);
                        }}>
                            <SelectTrigger className="w-[160px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder={t('eventsPage.filterAll') || 'Tất cả'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('eventsPage.filterAll') || 'Tất cả hình thức'}</SelectItem>
                                <SelectItem value="OFFLINE">{t('eventsPage.filterOffline') || 'Offline'}</SelectItem>
                                <SelectItem value="ONLINE">{t('eventsPage.filterOnline') || 'Online'}</SelectItem>
                                <SelectItem value="MIXED">{t('eventsPage.filterMixed') || 'Kết hợp'}</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* City Filter */}
                        <div className="relative w-[180px]">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder={t('eventsPage.cityPlaceholder') || 'Thành phố...'}
                                value={city}
                                onChange={(e) => {
                                    setCity(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-10"
                            />
                        </div>

                        {/* Sort */}
                        <Select value={`${sortField}:${sortDirection}`} onValueChange={(value) => {
                            const [field, dir] = value.split(':');
                            setSortField(field);
                            setSortDirection(dir);
                            setPage(1);
                        }}>
                            <SelectTrigger className="w-[180px]">
                                {sortDirection === 'asc' ? (
                                    <ArrowUpAZ className="h-4 w-4 mr-2" />
                                ) : (
                                    <ArrowDownAZ className="h-4 w-4 mr-2" />
                                )}
                                <SelectValue placeholder={t('eventsPage.sort') || 'Sắp xếp'} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="start_at:asc">{t('eventsPage.sortStartAsc') || 'Ngày bắt đầu ↑'}</SelectItem>
                                <SelectItem value="start_at:desc">{t('eventsPage.sortStartDesc') || 'Ngày bắt đầu ↓'}</SelectItem>
                                <SelectItem value="created_at:desc">{t('eventsPage.sortNewest') || 'Mới nhất'}</SelectItem>
                                <SelectItem value="created_at:asc">{t('eventsPage.sortOldest') || 'Cũ nhất'}</SelectItem>
                                <SelectItem value="title:asc">{t('eventsPage.sortTitleAZ') || 'Tên A-Z'}</SelectItem>
                                <SelectItem value="title:desc">{t('eventsPage.sortTitleZA') || 'Tên Z-A'}</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Advanced Filters Toggle */}
                        <Popover open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="relative">
                                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                                    {t('eventsPage.advancedFilters') || 'Bộ lọc'}
                                    {activeFiltersCount > 0 && (
                                        <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                            {activeFiltersCount}
                                        </Badge>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <div className="space-y-4">
                                    <div className="font-semibold text-sm">
                                        {t('eventsPage.advancedFiltersTitle') || 'Bộ lọc nâng cao'}
                                    </div>

                                    {/* Upcoming Only */}
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="upcoming" className="text-sm">
                                            {t('eventsPage.upcomingOnly') || 'Chỉ sự kiện sắp diễn ra'}
                                        </Label>
                                        <Switch
                                            id="upcoming"
                                            checked={upcoming}
                                            onCheckedChange={(checked) => {
                                                setUpcoming(checked);
                                                setPage(1);
                                            }}
                                        />
                                    </div>

                                    {/* Time From */}
                                    <div className="space-y-2">
                                        <Label htmlFor="timeFrom" className="text-sm">
                                            {t('eventsPage.timeFrom') || 'Từ ngày'}
                                        </Label>
                                        <Input
                                            type="datetime-local"
                                            id="timeFrom"
                                            value={timeFrom}
                                            onChange={(e) => {
                                                setTimeFrom(e.target.value);
                                                setPage(1);
                                            }}
                                        />
                                    </div>

                                    {/* Time To */}
                                    <div className="space-y-2">
                                        <Label htmlFor="timeTo" className="text-sm">
                                            {t('eventsPage.timeTo') || 'Đến ngày'}
                                        </Label>
                                        <Input
                                            type="datetime-local"
                                            id="timeTo"
                                            value={timeTo}
                                            onChange={(e) => {
                                                setTimeTo(e.target.value);
                                                setPage(1);
                                            }}
                                        />
                                    </div>

                                    {/* Categories */}
                                    {categories.length > 0 && (
                                        <div className="space-y-2">
                                            <Label className="text-sm">
                                                {t('eventsPage.categories') || 'Danh mục'}
                                            </Label>
                                            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                                                {categories.map((cat) => (
                                                    <Badge
                                                        key={cat.id}
                                                        variant={selectedCategories.includes(cat.slug) ? 'default' : 'outline'}
                                                        className="cursor-pointer hover:bg-primary/80 transition-colors"
                                                        onClick={() => handleCategoryToggle(cat.slug)}
                                                    >
                                                        {cat.name}
                                                        {selectedCategories.includes(cat.slug) && (
                                                            <X className="h-3 w-3 ml-1" />
                                                        )}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Reset Button */}
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={handleResetFilters}
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        {t('eventsPage.resetFilters') || 'Xóa bộ lọc'}
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button type="submit">{t('eventsPage.searchButton') || 'Tìm kiếm'}</Button>
                    </form>

                    {/* Active Filters Display */}
                    {(selectedCategories.length > 0 || city || timeFrom || timeTo || upcoming) && (
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-sm text-muted-foreground">
                                {t('eventsPage.activeFilters') || 'Đang lọc:'}
                            </span>
                            {upcoming && (
                                <Badge variant="secondary" className="gap-1">
                                    {t('eventsPage.upcomingOnly') || 'Sắp diễn ra'}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => setUpcoming(false)} />
                                </Badge>
                            )}
                            {city && (
                                <Badge variant="secondary" className="gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {city}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => setCity('')} />
                                </Badge>
                            )}
                            {timeFrom && (
                                <Badge variant="secondary" className="gap-1">
                                    {t('eventsPage.from') || 'Từ'}: {new Date(timeFrom).toLocaleDateString()}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => setTimeFrom('')} />
                                </Badge>
                            )}
                            {timeTo && (
                                <Badge variant="secondary" className="gap-1">
                                    {t('eventsPage.to') || 'Đến'}: {new Date(timeTo).toLocaleDateString()}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => setTimeTo('')} />
                                </Badge>
                            )}
                            {selectedCategories.map((slug) => {
                                const cat = categories.find((c) => c.slug === slug);
                                return (
                                    <Badge key={slug} variant="secondary" className="gap-1">
                                        {cat?.name || slug}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleCategoryToggle(slug)} />
                                    </Badge>
                                );
                            })}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={handleResetFilters}
                            >
                                {t('eventsPage.clearAll') || 'Xóa tất cả'}
                            </Button>
                        </div>
                    )}
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
