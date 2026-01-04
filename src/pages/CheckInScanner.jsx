import { ArrowLeft, History, Settings } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DashboardLayout } from '../layouts/DashboardLayout';

import CheckInResultModal from '../components/CheckInResultModal';
import CheckInStatsCard from '../components/CheckInStatsCard';
import QRScanner from '../components/QRScanner';

import { getCheckInStats, scanQRCode } from '../api/checkIn';
import { getEvents } from '../api/events';
import { useAuth } from '../contexts/AuthContext';

// Common gates
const GATE_OPTIONS = [
  'Main Gate',
  'Gate A',
  'Gate B',
  'Gate C',
  'VIP Entrance',
];

/**
 * Trang quét QR check-in
 */
export default function CheckInScanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // State
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get('eventId') || '');
  const [selectedGate, setSelectedGate] = useState('');
  const [customGate, setCustomGate] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Result modal
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Loading
  const [eventsLoading, setEventsLoading] = useState(true);

  // Device ID (generate once per session)
  const [deviceId] = useState(() => {
    let id = sessionStorage.getItem('checkin_device_id');
    if (!id) {
      id = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('checkin_device_id', id);
    }
    return id;
  });

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setEventsLoading(true);
      try {
        const response = await getEvents({ status: 'PUBLISHED', limit: 100 });
        const eventsList = response.data || response;
        setEvents(Array.isArray(eventsList) ? eventsList : []);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error(t('checkin.scanner.fetchEventsError', 'Không thể tải danh sách sự kiện'));
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, [t]);

  // Fetch stats when event changes
  const fetchStats = useCallback(async () => {
    if (!selectedEventId) {
      setStats(null);
      return;
    }

    setStatsLoading(true);
    try {
      const statsData = await getCheckInStats(selectedEventId);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle QR scan
  const handleScan = useCallback(async (qrPayload) => {
    if (!selectedEventId) {
      toast.error(t('checkin.scanner.selectEventFirst', 'Vui lòng chọn sự kiện trước'));
      return;
    }

    // Determine gate
    const gate = customGate || selectedGate || null;

    try {
      const result = await scanQRCode(qrPayload, gate, deviceId);
      setScanResult(result);
      setShowResult(true);

      // Refresh stats after successful check-in
      if (result.valid) {
        fetchStats();
      }
    } catch (error) {
      console.error('Error scanning QR:', error);
      setScanResult({
        valid: false,
        reason: 'NETWORK_ERROR',
        message: error.message || t('checkin.scanner.networkError', 'Lỗi kết nối'),
      });
      setShowResult(true);
    }
  }, [selectedEventId, selectedGate, customGate, deviceId, fetchStats, t]);

  // Handle scan error
  const handleScanError = useCallback((error) => {
    console.error('Scanner error:', error);
    // Don't show toast for every frame without QR
  }, []);

  // Close result modal
  const handleCloseResult = useCallback(() => {
    setShowResult(false);
    setScanResult(null);
  }, []);

  // Get current event name
  const currentEvent = events.find(e => e.id === selectedEventId);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/check-in')}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold truncate">
                {t('checkin.scanner.title', 'Quét mã QR')}
              </h1>
              {currentEvent && (
                <p className="text-gray-500 text-sm truncate">{currentEvent.name}</p>
              )}
            </div>
          </div>
          {selectedEventId && (
            <Button
              variant="outline"
              onClick={() => navigate(`/check-in/history/${selectedEventId}`)}
              className="w-full sm:w-auto"
            >
              <History className="w-4 h-4 mr-2" />
              {t('checkin.scanner.viewHistory', 'Lịch sử')}
            </Button>
          )}
        </div>

        {/* Main Content - Responsive Grid */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          {/* Left side - Scanner */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Event selection */}
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">{t('checkin.scanner.selectEvent', 'Chọn sự kiện')}</Label>
                    <Select
                      value={selectedEventId}
                      onValueChange={setSelectedEventId}
                      disabled={eventsLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('checkin.scanner.eventPlaceholder', 'Chọn sự kiện...')} />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">{t('checkin.scanner.selectGate', 'Cổng check-in')}</Label>
                    <Select
                      value={selectedGate}
                      onValueChange={(v) => {
                        setSelectedGate(v);
                        if (v !== 'custom') setCustomGate('');
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('checkin.scanner.gatePlaceholder', 'Chọn cổng (tùy chọn)')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          {t('checkin.scanner.noGate', 'Không chọn')}
                        </SelectItem>
                        {GATE_OPTIONS.map((gate) => (
                          <SelectItem key={gate} value={gate}>
                            {gate}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">
                          {t('checkin.scanner.customGate', 'Tùy chỉnh...')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedGate === 'custom' && (
                      <Input
                        placeholder={t('checkin.scanner.enterGate', 'Nhập tên cổng')}
                        value={customGate}
                        onChange={(e) => setCustomGate(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scanner */}
            {selectedEventId ? (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <QRScanner
                    onScan={handleScan}
                    onError={handleScanError}
                    isScanning={isScanning}
                    setIsScanning={setIsScanning}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 md:p-12 text-center">
                  <Settings className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm md:text-base">
                    {t('checkin.scanner.selectEventPrompt', 'Vui lòng chọn sự kiện để bắt đầu quét')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right side - Stats (hiển thị dưới trên mobile) */}
          <div className="space-y-4 md:space-y-6 order-first lg:order-last">
            {selectedEventId && (
              <>
                <CheckInStatsCard
                  stats={stats}
                  loading={statsLoading}
                  compact={false}
                />

                {/* Quick actions */}
                <Card>
                  <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
                    <h3 className="font-medium text-xs md:text-sm text-gray-500 uppercase">
                      {t('checkin.scanner.quickActions', 'Thao tác nhanh')}
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-sm"
                        onClick={() => navigate(`/check-in/history/${selectedEventId}`)}
                      >
                        <History className="w-4 h-4 mr-2" />
                        <span className="truncate">{t('checkin.history.title', 'Lịch sử')}</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-sm"
                        onClick={() => navigate(`/events/${selectedEventId}`)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        <span className="truncate">{t('checkin.scanner.eventDetails', 'Chi tiết sự kiện')}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Result Modal */}
        <CheckInResultModal
          open={showResult}
          onClose={handleCloseResult}
          result={scanResult}
          autoCloseMs={3000}
        />
      </div>
    </DashboardLayout>
  );
}
