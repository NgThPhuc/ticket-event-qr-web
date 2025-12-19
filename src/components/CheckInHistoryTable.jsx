import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    DoorOpen,
    Filter,
    Search,
    User
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Table hiển thị lịch sử check-in
 * @param {Array} data - Danh sách check-in records
 * @param {Object} meta - Metadata phân trang
 * @param {Object} filters - Available filters
 * @param {boolean} loading - Trạng thái loading
 * @param {Function} onPageChange - Callback khi đổi trang
 * @param {Function} onSearch - Callback khi search
 * @param {Function} onFilterChange - Callback khi đổi filter
 */
export function CheckInHistoryTable({
  data = [],
  meta = { page: 1, limit: 20, total: 0, total_pages: 1 },
  filters = { available_gates: [] },
  loading = false,
  onPageChange,
  onSearch,
  onFilterChange,
}) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');
  const [selectedGate, setSelectedGate] = useState('all');

  const formatTime = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchValue);
    }
  };

  const handleGateChange = (value) => {
    setSelectedGate(value);
    if (onFilterChange) {
      onFilterChange({ gate: value === 'all' ? null : value });
    }
  };

  const handlePageChange = (newPage) => {
    if (onPageChange && newPage >= 1 && newPage <= meta.total_pages) {
      onPageChange(newPage);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('checkin.history.searchPlaceholder', 'Tìm theo tên hoặc mã vé...')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        {filters.available_gates?.length > 0 && (
          <Select value={selectedGate} onValueChange={handleGateChange}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('checkin.history.allGates', 'Tất cả cổng')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('checkin.history.allGates', 'Tất cả cổng')}
              </SelectItem>
              {filters.available_gates.map((gate) => (
                <SelectItem key={gate} value={gate}>
                  {gate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('checkin.history.attendee', 'Người tham dự')}</TableHead>
              <TableHead>{t('checkin.history.ticketType', 'Loại vé')}</TableHead>
              <TableHead>{t('checkin.history.gate', 'Cổng')}</TableHead>
              <TableHead>{t('checkin.history.time', 'Thời gian')}</TableHead>
              <TableHead>{t('checkin.history.staff', 'Nhân viên')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <div className="animate-pulse h-10 bg-gray-100 dark:bg-gray-800 rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  {t('checkin.history.noData', 'Chưa có lượt check-in nào')}
                </TableCell>
              </TableRow>
            ) : (
              data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">{record.attendee_name}</p>
                        <p className="text-sm text-gray-500">{record.attendee_email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{record.ticket_type}</Badge>
                      <span className="text-xs text-gray-500">{record.ticket_serial}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {record.checked_in_gate ? (
                      <div className="flex items-center gap-2">
                        <DoorOpen className="w-4 h-4 text-gray-500" />
                        <span>{record.checked_in_gate}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{formatTime(record.checked_in_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600 dark:text-gray-400">
                      {record.checked_in_by || '--'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {t('checkin.history.showing', 'Hiển thị')} {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.total)} {t('checkin.history.of', 'trong')} {meta.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(meta.page - 1)}
              disabled={meta.page <= 1 || loading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm px-3">
              {meta.page} / {meta.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(meta.page + 1)}
              disabled={meta.page >= meta.total_pages || loading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckInHistoryTable;
