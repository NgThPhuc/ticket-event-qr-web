import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createOrganization } from '../api/organizations';

const CreateOrganization = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    logo_url: '',
  });

  // Redirect nếu chưa đăng nhập
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Tự động tạo slug từ name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
      .replace(/[^a-z0-9]+/g, '-') // Thay ký tự đặc biệt bằng dấu gạch ngang
      .replace(/^-+|-+$/g, ''); // Xóa dấu gạch ngang ở đầu và cuối
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // Tự động tạo slug khi name thay đổi
      if (name === 'name' && !formData.slug) {
        newData.slug = generateSlug(value);
      }
      return newData;
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate
      if (!formData.name || formData.name.length < 3) {
        throw new Error(t('organization.nameMinLength'));
      }
      if (!formData.slug) {
        throw new Error(t('organization.slugRequired'));
      }
      if (!formData.contact_email) {
        throw new Error(t('organization.contactEmailRequired'));
      }

      const result = await createOrganization(formData);
      setSuccess(true);

      // Chuyển về trang chủ sau 1.5 giây
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message || t('organization.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('organization.createTitle')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('organization.createSubtitle')}
            </p>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6">
                <AlertDescription>{t('organization.createSuccess')}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('organization.name')} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('organization.namePlaceholder')}
                  required
                  minLength={3}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('organization.nameHint')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('organization.slug')} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder={t('organization.slugPlaceholder')}
                  required
                  pattern="[a-z0-9-]+"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('organization.slugHint')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('organization.description')}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t('organization.descriptionPlaceholder')}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('organization.contactEmail')} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder={t('organization.contactEmailPlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('organization.contactPhone')}
                </label>
                <Input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder={t('organization.contactPhonePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('organization.address')}
                </label>
                <Input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={t('organization.addressPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('organization.logoUrl')}
                </label>
                <Input
                  type="url"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleChange}
                  placeholder={t('organization.logoUrlPlaceholder')}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  loading={loading}
                  className="flex-1"
                >
                  {t('organization.createButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateOrganization;

