import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="container mx-auto px-4 py-12">
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
            <Alert type="error" className="mb-6">
              {error}
            </Alert>
          )}

          {success && (
            <Alert type="success" className="mb-6">
              {success}
            </Alert>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('members.membersList')}
              </h2>
              <Button onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? t('common.cancel') : t('members.addMember')}
              </Button>
            </div>

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
                <Button type="submit" loading={adding} className="mt-4">
                  {t('members.addButton')}
                </Button>
              </form>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">{t('members.noMembers')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('members.name')}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('members.email')}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('members.role')}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('members.joinedAt')}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('members.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-300 font-medium">
                                {member.user?.full_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <span className="text-gray-900 dark:text-white">
                              {member.user?.full_name || t('members.unknown')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {member.user?.email || '-'}
                        </td>
                        <td className="py-3 px-4">
                          {member.user_id === user?.id && member.role === 'ORGANIZER_ADMIN' ? (
                            <select
                              value={member.role}
                              disabled
                              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium cursor-not-allowed"
                            >
                              <option value={member.role}>{member.role}</option>
                            </select>
                          ) : (
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium cursor-pointer"
                            >
                              {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                          {member.joined_at
                            ? new Date(member.joined_at).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {member.user_id !== user?.id && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                              {t('members.remove')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageMembers;

