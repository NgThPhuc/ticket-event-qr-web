import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MembersDataTable } from '../components/MembersDataTable';
import {
  getOrganizationMembers,
  addOrganizationMember,
  updateMemberRole,
  removeOrganizationMember,
} from '../api/organizations';

const ManageMembers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { organizationId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'EVENT_MANAGER',
  });

  const roles = [
    { value: 'EVENT_MANAGER', label: 'Event Manager' },
    { value: 'CHECKIN_STAFF', label: 'Check-in Staff' },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchMembers();
  }, [organizationId, isAuthenticated, navigate]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrganizationMembers(organizationId);
      setMembers(data || []);
    } catch (err) {
      setError(err.message || t('members.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    setSuccess(null);

    try {
      await addOrganizationMember(organizationId, formData);
      setSuccess(t('members.addSuccess'));
      setFormData({ email: '', role: 'EVENT_MANAGER' });
      setShowAddForm(false);
      fetchMembers();
    } catch (err) {
      setError(err.message || t('members.addError'));
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      setError(null);
      await updateMemberRole(organizationId, memberId, { role: newRole });
      setSuccess(t('members.updateRoleSuccess'));
      fetchMembers();
    } catch (err) {
      setError(err.message || t('members.updateRoleError'));
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm(t('members.removeConfirm'))) {
      return;
    }

    try {
      setError(null);
      await removeOrganizationMember(organizationId, memberId);
      setSuccess(t('members.removeSuccess'));
      fetchMembers();
    } catch (err) {
      setError(err.message || t('members.removeError'));
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => navigate(`/organizations/${organizationId}`)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('common.back')}
            </button>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {t('members.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('members.subtitle')}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {t('members.membersList')}
            </h2>

            {showAddForm && (
              <form onSubmit={handleAddMember} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('members.email')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t('members.emailPlaceholder')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('members.role')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button type="submit" disabled={adding}>
                    {adding ? t('common.loading') : t('members.addButton')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData({ email: '', role: 'EVENT_MANAGER' });
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
              </div>
            ) : (
              <MembersDataTable
                members={members}
                roles={roles}
                currentUserId={user?.id}
                onUpdateRole={handleUpdateRole}
                onRemoveMember={handleRemoveMember}
                onAddMember={() => setShowAddForm(true)}
                t={t}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageMembers;

