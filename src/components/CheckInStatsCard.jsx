import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, TrendingUp, UserCheck, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Card hiển thị thống kê check-in
 * @param {Object} stats - Dữ liệu thống kê từ API
 * @param {number} stats.total_issued - Tổng số vé đã phát hành
 * @param {number} stats.checked_in - Số vé đã check-in
 * @param {number} stats.not_checked_in - Số vé chưa check-in
 * @param {number} stats.revoked_count - Số vé bị thu hồi
 * @param {number} stats.refunded_count - Số vé đã hoàn tiền
 * @param {string} stats.last_check_in_at - Thời điểm check-in gần nhất
 * @param {boolean} loading - Trạng thái loading
 * @param {boolean} compact - Hiển thị compact mode
 */
export function CheckInStatsCard({ stats, loading = false, compact = false }) {
  const { t } = useTranslation();

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  // Calculate percentage
  const checkedInPercent = stats?.total_issued > 0
    ? Math.round((stats.checked_in / stats.total_issued) * 100)
    : 0;

  if (loading) {
    return (
      <Card className={compact ? '' : ''}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          {t('checkin.stats.noData', 'Chưa có dữ liệu thống kê')}
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {stats.checked_in}
                </span>
                <span className="text-gray-500">/</span>
                <span className="text-lg text-gray-600 dark:text-gray-400">
                  {stats.total_issued}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                ({checkedInPercent}%)
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{formatTime(stats.last_check_in_at)}</span>
            </div>
          </div>
          <Progress value={checkedInPercent} className="mt-2 h-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total issued */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('checkin.stats.totalIssued', 'Tổng số vé')}
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_issued}</div>
          <p className="text-xs text-muted-foreground">
            {t('checkin.stats.issuedDesc', 'Vé đã phát hành')}
          </p>
        </CardContent>
      </Card>

      {/* Checked in */}
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
            {t('checkin.stats.checkedIn', 'Đã check-in')}
          </CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.checked_in}
          </div>
          <Progress value={checkedInPercent} className="mt-2 h-2" />
          <p className="text-xs text-green-600 dark:text-green-500 mt-1">
            {checkedInPercent}% {t('checkin.stats.ofTotal', 'trên tổng')}
          </p>
        </CardContent>
      </Card>

      {/* Not checked in */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('checkin.stats.notCheckedIn', 'Chưa check-in')}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.not_checked_in}</div>
          <p className="text-xs text-muted-foreground">
            {t('checkin.stats.pendingDesc', 'Đang chờ')}
          </p>
        </CardContent>
      </Card>

      {/* Last check-in */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('checkin.stats.lastCheckIn', 'Check-in gần nhất')}
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">
            {formatTime(stats.last_check_in_at)}
          </div>
          {stats.revoked_count > 0 || stats.refunded_count > 0 ? (
            <p className="text-xs text-muted-foreground">
              {stats.revoked_count > 0 && (
                <span className="text-red-500">{stats.revoked_count} {t('checkin.stats.revoked', 'thu hồi')}</span>
              )}
              {stats.revoked_count > 0 && stats.refunded_count > 0 && ' • '}
              {stats.refunded_count > 0 && (
                <span className="text-orange-500">{stats.refunded_count} {t('checkin.stats.refunded', 'hoàn tiền')}</span>
              )}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t('checkin.stats.timeDesc', 'Thời gian')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CheckInStatsCard;
