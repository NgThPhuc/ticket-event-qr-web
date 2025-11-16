import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { getPublicEvents } from '../api/events';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Building2, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  useEffect(() => {
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

        const response = await getPublicEvents(params);
        setEvents(response.data || []);
        setTotalPages(response.meta?.totalPages || 1);
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách sự kiện');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [page, searchQuery, attendanceMode, limit]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('pages.events.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Khám phá các sự kiện công khai đang diễn ra
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm sự kiện..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={attendanceMode || undefined} onValueChange={(value) => setAttendanceMode(value || '')}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tất cả loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="OFFLINE">Offline</SelectItem>
                <SelectItem value="ONLINE">Online</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Tìm kiếm</Button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {t('common.loading') || 'Đang tải...'}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Events Grid */}
        {!loading && !error && (
          <>
            {events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
                  Không tìm thấy sự kiện nào
                </p>
                <p className="text-gray-500 dark:text-gray-500">
                  Hãy thử tìm kiếm với từ khóa khác hoặc bỏ bộ lọc
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {events.map((event) => (
                    <Card
                      key={event.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow"
                    >
                        <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                          {event.cover_image_url ? (
                            <img
                              src={event.cover_image_url}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                              <Calendar className="h-16 w-16 text-white opacity-50" />
                            </div>
                          )}
                          {event.attendance_mode && (
                            <div className="absolute top-2 right-2">
                              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                {event.attendance_mode === 'OFFLINE' ? 'Offline' : 
                                 event.attendance_mode === 'ONLINE' ? 'Online' : 'Hybrid'}
                              </span>
                            </div>
                          )}
                        </div>
                        <CardHeader>
                          <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                          {event.subtitle && (
                            <CardDescription className="line-clamp-2">
                              {event.subtitle}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {event.start_at && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(event.start_at)}</span>
                            </div>
                          )}
                          {event.venue_name && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="h-4 w-4" />
                              <span className="line-clamp-1">
                                {event.venue_name}
                                {event.city && `, ${event.city}`}
                              </span>
                            </div>
                          )}
                          {event.organization && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Building2 className="h-4 w-4" />
                              <span className="line-clamp-1">{event.organization.name}</span>
                            </div>
                          )}
                        </CardContent>
                    </Card>
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
                      Trước
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Trang {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Sau
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

