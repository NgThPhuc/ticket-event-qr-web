import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { PlatformOrganizationsDataTable } from '../components/PlatformOrganizationsDataTable';
import { getAllOrganizations, deleteOrganization } from '../api/organizations';
import { Building2, Users, Activity } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';

const OrganizationsManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    organizationId: null,
    organizationName: '',
  });

  // Kiểm tra permission - chỉ PLATFORM_ADMIN mới có quyền truy cập
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (user?.platform_role !== 'PLATFORM_ADMIN') {
        // Redirect về dashboard nếu không phải PLATFORM_ADMIN
        navigate('/dashboard');
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      // Kiểm tra permission trước
      if (!isAuthenticated || user?.platform_role !== 'PLATFORM_ADMIN') {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await getAllOrganizations();
        setOrganizations(data || []);
      } catch (err) {
        setError(err.message || t('organizationsManagement.fetchError') || 'Không thể tải danh sách tổ chức');
        if (err.status === 403) {
          // Không có quyền - redirect
          navigate('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.platform_role === 'PLATFORM_ADMIN') {
      fetchOrganizations();
    }
  }, [isAuthenticated, user, navigate, t]);

  // Tính toán summary statistics
  const totalOrganizations = organizations.length;
  const totalMembers = organizations.reduce((sum, org) => sum + (org._count?.members || 0), 0);
  const activeToday = organizations.filter(org => {
    if (!org.created_at) return false;
    const createdDate = new Date(org.created_at);
    const today = new Date();
    return createdDate.toDateString() === today.toDateString();
  }).length;

  const handleView = (organizationId) => {
    navigate(`/organizations/${organizationId}`);
  };

  const handleEdit = (organizationId) => {
    navigate(`/organizations/${organizationId}/edit`);
  };

  const handleMembers = (organizationId) => {
    navigate(`/organizations/${organizationId}/members`);
  };

  const handleDelete = (organizationId, organizationName) => {
    setDeleteDialog({
      open: true,
      organizationId,
      organizationName,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.organizationId) return;

    try {
      await deleteOrganization(deleteDialog.organizationId);
      setAlert({
        type: 'success',
        message: t('organizationsManagement.deleteSuccess') || 'Xóa tổ chức thành công',
      });
      // Reload danh sách
      const data = await getAllOrganizations();
      setOrganizations(data || []);
      setDeleteDialog({ open: false, organizationId: null, organizationName: '' });
      
      // Ẩn alert sau 3 giây
      setTimeout(() => {
        setAlert({ type: '', message: '' });
      }, 3000);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || t('organizationsManagement.deleteError') || 'Không thể xóa tổ chức',
      });
      setDeleteDialog({ open: false, organizationId: null, organizationName: '' });
      
      // Ẩn alert sau 3 giây
      setTimeout(() => {
        setAlert({ type: '', message: '' });
      }, 3000);
    }
  };

  // Nếu không phải PLATFORM_ADMIN hoặc đang loading, không hiển thị gì
  if (authLoading || !isAuthenticated || user?.platform_role !== 'PLATFORM_ADMIN') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('organizationsManagement.title') || 'Organizations Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('organizationsManagement.subtitle') || 'Quản lý tất cả tổ chức trong hệ thống'}
          </p>
        </div>

        {/* Alert */}
        {alert.message && (
          <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="mb-6">
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Organizations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('organizationsManagement.stats.totalOrganizations') || 'Total Organizations'}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {totalOrganizations}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </div>

          {/* Total Members */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('organizationsManagement.stats.totalMembers') || 'Total Members'}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {totalMembers}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
            </div>
          </div>

          {/* Active Today */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('organizationsManagement.stats.activeToday') || 'Active Today'}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {activeToday}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Organizations List */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('organizationsManagement.organizationsList') || 'Organizations List'}
          </h2>
        </div>

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
        ) : (
          <PlatformOrganizationsDataTable
            organizations={organizations}
            onView={handleView}
            onEdit={handleEdit}
            onMembers={handleMembers}
            onDelete={handleDelete}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog({ open: false, organizationId: null, organizationName: '' });
          }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('organizationsManagement.deleteConfirmTitle') || 'Xác nhận xóa tổ chức'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('organizationsManagement.deleteConfirmMessage', { name: deleteDialog.organizationName }) || 
                  `Bạn có chắc chắn muốn xóa tổ chức "${deleteDialog.organizationName}"? Hành động này không thể hoàn tác và sẽ xóa tất cả sự kiện, đơn hàng và vé liên quan.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('common.cancel') || 'Hủy'}
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                {t('organizationsManagement.deleteConfirm') || 'Xóa'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationsManagement;
