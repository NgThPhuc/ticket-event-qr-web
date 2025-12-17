import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { getOrganization } from '../api/organizations';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Users, Calendar, Edit, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

  if (authLoading || !isAuthenticated) {
    return null;
  }

  // Check permissions
  const isPlatformAdmin = user?.platform_role === 'PLATFORM_ADMIN';
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

                  {/* Payout & Bank Info */}
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      {t('organization.payoutSectionTitle') || 'Thanh toán cho tổ chức (Payout)'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400 mb-1">
                          {t('organization.payoutStatusLabel') || 'Trạng thái payout'}
                        </p>
                        <Badge
                          variant={organization.payout_enabled ? 'default' : 'secondary'}
                          className={organization.payout_enabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                        >
                          {organization.payout_enabled
                            ? t('organization.payoutStatusEnabled') || 'Đang bật payout'
                            : t('organization.payoutStatusDisabled') || 'Chưa bật payout'}
                        </Badge>
                        {!organization.payout_enabled || !organization.bank_account_number || !organization.bank_account_name || !organization.bank_name ? (
                          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                            {t('organization.bankWarningMissing') || 'Chưa đủ điều kiện nhận payout. Vui lòng đảm bảo đã nhập đủ thông tin ngân hàng và được nền tảng bật payout.'}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-1 text-sm text-gray-900 dark:text-white">
                        <p>
                          <span className="font-medium">
                            {t('organization.bankAccountNumber') || 'Số tài khoản'}:
                          </span>{' '}
                          {organization.bank_account_number || '-'}
                        </p>
                        <p>
                          <span className="font-medium">
                            {t('organization.bankAccountName') || 'Chủ tài khoản'}:
                          </span>{' '}
                          {organization.bank_account_name || '-'}
                        </p>
                        <p>
                          <span className="font-medium">
                            {t('organization.bankName') || 'Ngân hàng'}:
                          </span>{' '}
                          {organization.bank_name || '-'}
                        </p>
                      </div>
                    </div>
                  </div>

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
      </div>
    </DashboardLayout>
  );
};

export default OrganizationDetail;

