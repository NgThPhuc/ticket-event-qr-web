import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Banknote,
    Building2,
    Calendar,
    Clock,
    Edit,
    History,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Trash2,
    TrendingUp,
    User,
    Users,
    Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { getOrganization } from '../api/organizations';
import { getOrganizationBalance, requestPayout, updateOrganizationPayoutStatus } from '../api/payouts';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

const getRoleLabel = (role, t) => {
    const roleKey = `roles.${role}`;
    return t(roleKey) || role;
};

const getRoleBadgeVariant = (role) => {
    const variantMap = {
        'ORGANIZER_ADMIN': 'default',
        'EVENT_MANAGER': 'secondary',
        'CHECKIN_STAFF': 'outline',
        'CUSTOMER': 'outline',
    };
    return variantMap[role] || 'outline';
};

const OrganizationDetail = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { organizationId } = useParams();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [deleteDialog, setDeleteDialog] = useState({
        open: false,
        organizationId: null,
        organizationName: '',
    });

    // Payout states
    const [balance, setBalance] = useState(null);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [withdrawDialog, setWithdrawDialog] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);

    // Admin payout toggle
    const isPlatformAdmin = user?.platform_role === 'PLATFORM_ADMIN';
    const [payoutEnabled, setPayoutEnabled] = useState(false);
    const [togglingPayout, setTogglingPayout] = useState(false);

    // Fetch organization details
    useEffect(() => {
        const fetchOrganization = async () => {
            if (!isAuthenticated || !organizationId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');

            try {
                const data = await getOrganization(organizationId);
                setOrganization(data);
                // Set payout status for admin toggle
                setPayoutEnabled(data.payout_enabled || false);
            } catch (err) {
                setError(err.message || t('organization.fetchError') || 'Không thể tải thông tin tổ chức');
                if (err.status === 403 || err.status === 404) {
                    // Redirect nếu không có quyền hoặc không tìm thấy
                    setTimeout(() => {
                        navigate('/organizations');
                    }, 2000);
                }
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated && organizationId) {
            fetchOrganization();
        }
    }, [isAuthenticated, organizationId, navigate, t]);

    // Fetch balance
    const fetchBalance = async () => {
        if (!organizationId) return;
        setBalanceLoading(true);
        try {
            const data = await getOrganizationBalance(organizationId);
            setBalance(data);
        } catch (err) {
            console.error('Error fetching balance:', err);
        } finally {
            setBalanceLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && organizationId && organization) {
            fetchBalance();
        }
    }, [isAuthenticated, organizationId, organization]);

    // Handle withdraw request
    const handleWithdraw = async () => {
        if (!organizationId) return;
        setWithdrawing(true);
        try {
            const amount = withdrawAmount ? parseInt(withdrawAmount) : undefined;
            await requestPayout(organizationId, amount);
            setAlert({
                type: 'success',
                message: t('payout.requestSuccess') || 'Yêu cầu rút tiền đã được gửi thành công!',
            });
            setWithdrawDialog(false);
            setWithdrawAmount('');
            fetchBalance();
        } catch (err) {
            setAlert({
                type: 'error',
                message: err.message || t('payout.requestError') || 'Không thể gửi yêu cầu rút tiền',
            });
        } finally {
            setWithdrawing(false);
        }
    };

    // Admin toggle payout status
    const handleTogglePayout = async () => {
        if (!isPlatformAdmin || !organizationId) return;
        setTogglingPayout(true);
        try {
            const newStatus = !payoutEnabled;
            await updateOrganizationPayoutStatus(organizationId, newStatus);
            setPayoutEnabled(newStatus);
            // Update organization object
            setOrganization(prev => ({ ...prev, payout_enabled: newStatus }));
            setAlert({
                type: 'success',
                message: newStatus
                    ? t('organization.payoutStatusEnabled') || 'Đã bật payout cho tổ chức.'
                    : t('organization.payoutStatusDisabled') || 'Đã tắt payout cho tổ chức.',
            });
            // Refetch balance to update UI
            fetchBalance();
            setTimeout(() => setAlert({ type: '', message: '' }), 3000);
        } catch (err) {
            setAlert({
                type: 'error',
                message: err.message || t('organization.payoutToggleError') || 'Không thể thay đổi trạng thái payout.',
            });
        } finally {
            setTogglingPayout(false);
        }
    };

    const formatVND = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const canWithdraw = balance &&
        balance.payout_enabled &&
        balance.has_bank_info &&
        balance.available_balance > 0;

    if (authLoading || !isAuthenticated) {
        return null;
    }

    // Check permissions - isPlatformAdmin đã khai báo ở trên
    const isOrganizerAdmin = organization?.members?.some(
        m => m.user_id === user?.id && m.role === 'ORGANIZER_ADMIN'
    );
    const canEdit = isPlatformAdmin || isOrganizerAdmin;
    const canDelete = isPlatformAdmin || isOrganizerAdmin;

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    {/* <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/organizations')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back') || 'Quay lại'}
            </Button>
          </div> */}
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {t('organization.detailSubtitle') || 'Chi tiết Tổ Chức'}
                    </h1>
                </div>

                {/* Alert */}
                {alert.message && (
                    <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="mb-6">
                        <AlertDescription>{alert.message}</AlertDescription>
                    </Alert>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">
                                {t('common.loading') || 'Đang tải...'}
                            </p>
                        </div>
                    </div>
                ) : error ? (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : organization ? (
                    <div className="space-y-6">
                        {/* Organization Info Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        {organization.logo_url ? (
                                            <img
                                                src={organization.logo_url}
                                                alt={organization.name}
                                                className="h-20 w-20 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                                                <Building2 className="h-10 w-10 text-blue-600 dark:text-blue-300" />
                                            </div>
                                        )}
                                        <div>
                                            <CardTitle className="text-2xl">{organization.name}</CardTitle>
                                            <CardDescription className="mt-1">@{organization.slug}</CardDescription>
                                            <div className="mt-2">
                                                <Badge variant={organization.is_active ? 'default' : 'secondary'}>
                                                    {organization.is_active
                                                        ? t('organization.active') || 'Active'
                                                        : t('organization.inactive') || 'Inactive'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    {canEdit && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => navigate(`/organizations/${organizationId}/edit`)}
                                                className="gap-2"
                                            >
                                                <Edit className="h-4 w-4" />
                                                {t('organization.edit')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => navigate(`/organizations/${organizationId}/members`)}
                                                className="gap-2"
                                            >
                                                <Users className="h-4 w-4" />
                                                {t('organization.manageMembers')}
                                            </Button>
                                            {/* Admin Only: Toggle Payout */}
                                            {isPlatformAdmin && (
                                                <div className="flex items-center gap-2 px-3 py-1.5 border rounded-md bg-gray-50 dark:bg-gray-800">
                                                    <Wallet className="h-4 w-4 text-emerald-500" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Payout
                                                    </span>
                                                    {togglingPayout && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                                                    <Switch
                                                        checked={payoutEnabled}
                                                        onCheckedChange={handleTogglePayout}
                                                        disabled={togglingPayout}
                                                    />
                                                </div>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => setDeleteDialog({
                                                        open: true,
                                                        organizationId: organization.id,
                                                        organizationName: organization.name,
                                                    })}
                                                    className="gap-2"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    {t('organization.delete')}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Description */}
                                    {organization.description && (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                {t('organization.description')}
                                            </h3>
                                            <p className="text-gray-900 dark:text-white">
                                                {organization.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Contact Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {organization.contact_email && (
                                            <div className="flex items-center gap-3">
                                                <Mail className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        {t('organization.contactEmail')}
                                                    </p>
                                                    <p className="text-gray-900 dark:text-white">
                                                        {organization.contact_email}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {organization.contact_phone && (
                                            <div className="flex items-center gap-3">
                                                <Phone className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        {t('organization.contactPhone')}
                                                    </p>
                                                    <p className="text-gray-900 dark:text-white">
                                                        {organization.contact_phone}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {organization.address && (
                                            <div className="flex items-center gap-3">
                                                <MapPin className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        {t('organization.address')}
                                                    </p>
                                                    <p className="text-gray-900 dark:text-white">
                                                        {organization.address}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Balance & Payout Section */}
                                    {(canEdit || balance) && (
                                        <div className="pt-4 border-t">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                    <Wallet className="h-4 w-4" />
                                                    {t('payout.balance.title') || 'Số dư & Rút tiền'}
                                                </h3>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/organizations/${organizationId}/payouts`)}
                                                    className="gap-2"
                                                >
                                                    <History className="h-4 w-4" />
                                                    {t('payout.history.button') || 'Lịch sử'}
                                                </Button>
                                            </div>

                                            {balanceLoading ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                </div>
                                            ) : balance ? (
                                                <div className="space-y-4">
                                                    {/* Balance Cards */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        {/* Total Revenue */}
                                                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                                                            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                                                                <TrendingUp className="h-4 w-4" />
                                                                <span className="text-xs font-medium uppercase">
                                                                    {t('payout.balance.totalRevenue') || 'Tổng doanh thu'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                                                                {formatVND(balance.total_revenue)}
                                                            </p>
                                                        </div>
                                                        {/* Pending Balance */}
                                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                                                            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
                                                                <Clock className="h-4 w-4" />
                                                                <span className="text-xs font-medium uppercase">
                                                                    {t('payout.balance.pending') || 'Đang chờ'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
                                                                {formatVND(balance.pending_balance)}
                                                            </p>
                                                        </div>
                                                        {/* Available Balance */}
                                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                                                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                                                                <Banknote className="h-4 w-4" />
                                                                <span className="text-xs font-medium uppercase">
                                                                    {t('payout.balance.available') || 'Khả dụng'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xl font-bold text-green-700 dark:text-green-300">
                                                                {formatVND(balance.available_balance)}
                                                            </p>
                                                        </div>
                                                        {/* Total Paid Out */}
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                                                                <Wallet className="h-4 w-4" />
                                                                <span className="text-xs font-medium uppercase">
                                                                    {t('payout.balance.totalPaid') || 'Đã rút'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                                                {formatVND(balance.total_paid_out)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Withdraw Button & Status */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                                                        <div className="space-y-1">
                                                            {!balance.payout_enabled && (
                                                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                                                    ⚠️ {t('payout.notEnabled') || 'Tính năng rút tiền chưa được kích hoạt'}
                                                                </p>
                                                            )}
                                                            {!balance.has_bank_info && (
                                                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                                                    ⚠️ {t('payout.noBankInfo') || 'Vui lòng cập nhật thông tin ngân hàng'}{' '}
                                                                    <button
                                                                        onClick={() => navigate(`/organizations/${organizationId}/edit`)}
                                                                        className="underline hover:text-amber-700 dark:hover:text-amber-300"
                                                                    >
                                                                        {t('payout.updateBankInfo') || 'Cập nhật ngay'}
                                                                    </button>
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {!balance.has_bank_info && (
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => navigate(`/organizations/${organizationId}/edit`)}
                                                                    className="gap-2"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                    {t('payout.updateBankInfoButton') || 'Cập nhật ngân hàng'}
                                                                </Button>
                                                            )}
                                                            <Button
                                                                onClick={() => setWithdrawDialog(true)}
                                                                disabled={!canWithdraw}
                                                                className="gap-2"
                                                            >
                                                                <Banknote className="h-4 w-4" />
                                                                {t('payout.withdrawButton') || 'Yêu cầu rút tiền'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    {t('payout.noBalance') || 'Không thể tải thông tin số dư'}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Owner Information */}
                                    <div className="pt-4 border-t">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3">
                                                <User className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        {t('organization.owner')}
                                                    </p>
                                                    <p className="text-gray-900 dark:text-white">
                                                        {organization.owner?.full_name || organization.owner?.email}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {organization.owner?.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Users className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        {t('organization.members') || 'Thành viên'}
                                                    </p>
                                                    <p className="text-gray-900 dark:text-white">
                                                        {organization._count?.members || organization.members?.length || 0}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timestamps */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {t('organization.createdAt') || 'Ngày tạo'}
                                                </p>
                                                <p className="text-gray-900 dark:text-white">
                                                    {formatDate(organization.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {t('organization.updatedAt') || 'Cập nhật lần cuối'}
                                                </p>
                                                <p className="text-gray-900 dark:text-white">
                                                    {formatDate(organization.updated_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Statistics */}
                        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>{t('organization.members') || 'Thành viên'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organization._count?.members || 0}</div>
                </CardContent>
              </Card>
            </div> */}

                        {/* Members List */}
                        {organization.members && organization.members.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>{t('members.membersList') || 'Danh sách thành viên'}</CardTitle>
                                            <CardDescription>
                                                {organization.members.length} {t('members.members') || 'thành viên'}
                                            </CardDescription>
                                        </div>
                                        {canEdit && (
                                            <Button
                                                variant="outline"
                                                onClick={() => navigate(`/organizations/${organizationId}/members`)}
                                                className="gap-2"
                                            >
                                                <Users className="h-4 w-4" />
                                                {t('organization.manageMembers')}
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('members.name')}</TableHead>
                                                <TableHead>{t('members.email')}</TableHead>
                                                <TableHead>{t('members.role')}</TableHead>
                                                <TableHead>{t('members.joinedAt')}</TableHead>
                                                <TableHead>{t('members.status') || 'Trạng thái'}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {organization.members.map((member) => (
                                                <TableRow key={member.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                                                <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                                                                    {member.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                                                </span>
                                                            </div>
                                                            <span className="font-medium">
                                                                {member.user?.full_name || t('members.unknown')}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {member.user?.email || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getRoleBadgeVariant(member.role)}>
                                                            {getRoleLabel(member.role, t)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatDate(member.joined_at)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={member.is_active ? 'default' : 'secondary'}>
                                                            {member.is_active
                                                                ? t('organization.active')
                                                                : t('organization.inactive')}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                ) : null}

                {/* Delete Confirmation Dialog */}
                <AlertDialog
                    open={deleteDialog.open}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeleteDialog({ open: false, organizationId: null, organizationName: '' });
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {t('organization.deleteConfirmTitle') || 'Xác nhận xóa tổ chức'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('organization.deleteConfirmMessage', { name: deleteDialog.organizationName }) ||
                                    `Bạn có chắc chắn muốn xóa tổ chức "${deleteDialog.organizationName}"? Hành động này không thể hoàn tác và sẽ xóa tất cả sự kiện, đơn hàng và vé liên quan.`}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={async () => {
                                    // Handle delete - redirect to organizations list
                                    navigate('/organizations');
                                }}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {t('organization.deleteConfirm') || 'Xóa'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Withdraw Dialog */}
                <Dialog open={withdrawDialog} onOpenChange={setWithdrawDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {t('payout.withdraw.title') || 'Yêu cầu rút tiền'}
                            </DialogTitle>
                            <DialogDescription>
                                {t('payout.withdraw.description') ||
                                    `Số dư khả dụng: ${formatVND(balance?.available_balance || 0)}. Để trống để rút toàn bộ số dư.`}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="withdrawAmount">
                                    {t('payout.withdraw.amount') || 'Số tiền muốn rút (VNĐ)'}
                                </Label>
                                <Input
                                    id="withdrawAmount"
                                    type="number"
                                    placeholder={t('payout.withdraw.amountPlaceholder') || 'Để trống để rút hết'}
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    max={balance?.available_balance || 0}
                                    min={1}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t('payout.withdraw.hint') || 'Yêu cầu sẽ được admin xử lý và chuyển khoản.'}
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setWithdrawDialog(false);
                                    setWithdrawAmount('');
                                }}
                            >
                                {t('common.cancel') || 'Hủy'}
                            </Button>
                            <Button onClick={handleWithdraw} disabled={withdrawing}>
                                {withdrawing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t('common.loading') || 'Đang xử lý...'}
                                    </>
                                ) : (
                                    t('payout.withdraw.submit') || 'Gửi yêu cầu'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default OrganizationDetail;

