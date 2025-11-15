import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { MembersDataTable } from '../components/MembersDataTable';
import { 
  getOrganizationMembers, 
  addOrganizationMember, 
  updateMemberRole, 
  removeOrganizationMember,
  getOrganization 
} from '../api/organizations';
import { UserPlus, ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const OrganizationMembers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { organizationId } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });
  
  // Add Member Dialog
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addMemberData, setAddMemberData] = useState({
    email: '',
    role: 'CUSTOMER',
  });
  const [addMemberLoading, setAddMemberLoading] = useState(false);

  // Update Role Dialog
  const [updateRoleDialog, setUpdateRoleDialog] = useState({
    open: false,
    memberId: null,
    memberName: '',
    currentRole: '',
    newRole: '',
  });

  // Remove Member Dialog
  const [removeMemberDialog, setRemoveMemberDialog] = useState({
    open: false,
    memberId: null,
    memberName: '',
  });

  // Available roles for dropdown
  const roles = [
    { value: 'ORGANIZER_ADMIN', label: 'ORGANIZER_ADMIN' },
    { value: 'EVENT_MANAGER', label: 'Event Manager' },
    { value: 'CHECKIN_STAFF', label: 'Check-in Staff' },
    { value: 'CUSTOMER', label: 'Customer' },
  ];

  // Fetch organization and members
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !organizationId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      
      try {
        // Fetch organization info
        const orgData = await getOrganization(organizationId);
        setOrganization(orgData);

        // Fetch members
        const membersData = await getOrganizationMembers(organizationId);
        setMembers(membersData || []);
      } catch (err) {
        setError(err.message || t('members.fetchError'));
        if (err.status === 403 || err.status === 404) {
          // Redirect nếu không có quyền hoặc không tìm thấy
          navigate('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && organizationId) {
      fetchData();
    }
  }, [isAuthenticated, organizationId, navigate, t]);

  const handleAddMember = async () => {
    if (!addMemberData.email.trim()) {
      setAlert({
        type: 'error',
        message: t('members.emailRequired') || 'Email không được để trống',
      });
      return;
    }

    setAddMemberLoading(true);
    try {
      await addOrganizationMember(organizationId, {
        email: addMemberData.email.trim(),
        role: addMemberData.role,
      });

      setAlert({
        type: 'success',
        message: t('members.addSuccess'),
      });

      // Reload members
      const membersData = await getOrganizationMembers(organizationId);
      setMembers(membersData || []);

      // Reset form
      setAddMemberData({ email: '', role: 'CUSTOMER' });
      setAddMemberDialogOpen(false);

      // Hide alert after 3 seconds
      setTimeout(() => {
        setAlert({ type: '', message: '' });
      }, 3000);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || t('members.addError'),
      });

      setTimeout(() => {
        setAlert({ type: '', message: '' });
      }, 3000);
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!updateRoleDialog.memberId || !updateRoleDialog.newRole) {
      return;
    }

    try {
      await updateMemberRole(organizationId, updateRoleDialog.memberId, {
        role: updateRoleDialog.newRole,
      });

      setAlert({
        type: 'success',
        message: t('members.updateRoleSuccess'),
      });

      // Reload members
      const membersData = await getOrganizationMembers(organizationId);
      setMembers(membersData || []);

      setUpdateRoleDialog({
        open: false,
        memberId: null,
        memberName: '',
        currentRole: '',
        newRole: '',
      });

      setTimeout(() => {
        setAlert({ type: '', message: '' });
      }, 3000);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || t('members.updateRoleError'),
      });

      setTimeout(() => {
        setAlert({ type: '', message: '' });
      }, 3000);
    }
  };

  const confirmRemoveMember = async () => {
    if (!removeMemberDialog.memberId) {
      return;
    }

    try {
      await removeOrganizationMember(organizationId, removeMemberDialog.memberId);

      setAlert({
        type: 'success',
        message: t('members.removeSuccess'),
      });

      // Reload members
      const membersData = await getOrganizationMembers(organizationId);
      setMembers(membersData || []);

      setRemoveMemberDialog({
        open: false,
        memberId: null,
        memberName: '',
      });

      setTimeout(() => {
        setAlert({ type: '', message: '' });
      }, 3000);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || t('members.removeError'),
      });

      setTimeout(() => {
        setAlert({ type: '', message: '' });
      }, 3000);
    }
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  // Check if user has permission (PLATFORM_ADMIN or ORGANIZER_ADMIN in this org)
  // This will be handled by API returning 403 if no permission
  const isPlatformAdmin = user?.platform_role === 'PLATFORM_ADMIN';
  const canManageMembers = isPlatformAdmin || members.some(
    m => m.user_id === user?.id && m.role === 'ORGANIZER_ADMIN'
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/organizations')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back') || 'Quay lại'}
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('members.title')}
          </h1>
          {organization && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Building2 className="h-5 w-5" />
              <span>{organization.name}</span>
            </div>
          )}
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('members.subtitle')}
          </p>
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
        ) : (
          <>
            {/* Add Member Button */}
            {canManageMembers && (
              <div className="mb-6 flex justify-end">
                <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      {t('members.addMember')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('members.addMember')}</DialogTitle>
                      <DialogDescription>
                        {t('members.addMemberDescription') || 'Thêm thành viên mới vào tổ chức bằng email'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="email">{t('members.email')}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={addMemberData.email}
                          onChange={(e) =>
                            setAddMemberData({ ...addMemberData, email: e.target.value })
                          }
                          placeholder={t('members.emailPlaceholder')}
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">{t('members.role')}</Label>
                        <Select
                          value={addMemberData.role}
                          onValueChange={(value) =>
                            setAddMemberData({ ...addMemberData, role: value })
                          }
                        >
                          <SelectTrigger id="role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setAddMemberDialogOpen(false)}
                        disabled={addMemberLoading}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button onClick={handleAddMember} disabled={addMemberLoading}>
                        {addMemberLoading
                          ? t('common.loading')
                          : t('members.addButton')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Members Table */}
            <MembersDataTable
              members={members}
              roles={roles}
              currentUserId={user?.id}
              onUpdateRole={(memberId, newRole) => {
                const member = members.find((m) => m.id === memberId);
                if (member) {
                  setUpdateRoleDialog({
                    open: true,
                    memberId,
                    memberName: member.user?.full_name || member.user?.email,
                    currentRole: member.role,
                    newRole,
                  });
                }
              }}
              onRemoveMember={(memberId) => {
                const member = members.find((m) => m.id === memberId);
                if (member) {
                  setRemoveMemberDialog({
                    open: true,
                    memberId,
                    memberName: member.user?.full_name || member.user?.email,
                  });
                }
              }}
              onAddMember={() => setAddMemberDialogOpen(true)}
              t={t}
            />
          </>
        )}

        {/* Update Role Dialog */}
        <Dialog
          open={updateRoleDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setUpdateRoleDialog({
                open: false,
                memberId: null,
                memberName: '',
                currentRole: '',
                newRole: '',
              });
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t('members.updateRole') || 'Cập nhật vai trò'}
              </DialogTitle>
              <DialogDescription>
                {t('members.updateRoleDescription', { name: updateRoleDialog.memberName }) ||
                  `Cập nhật vai trò của ${updateRoleDialog.memberName}`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>{t('members.role')}</Label>
              <Select
                value={updateRoleDialog.newRole || updateRoleDialog.currentRole}
                onValueChange={(value) =>
                  setUpdateRoleDialog({ ...updateRoleDialog, newRole: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setUpdateRoleDialog({
                    open: false,
                    memberId: null,
                    memberName: '',
                    currentRole: '',
                    newRole: '',
                  })
                }
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleUpdateRole}>
                {t('common.save') || 'Lưu'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Member Confirmation Dialog */}
        <AlertDialog
          open={removeMemberDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setRemoveMemberDialog({
                open: false,
                memberId: null,
                memberName: '',
              });
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('members.removeConfirmTitle') || 'Xác nhận xóa thành viên'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('members.removeConfirm', { name: removeMemberDialog.memberName }) ||
                  `Bạn có chắc chắn muốn xóa thành viên "${removeMemberDialog.memberName}"?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRemoveMember}
                className="bg-red-600 hover:bg-red-700"
              >
                {t('members.remove')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationMembers;

