import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Building2 } from 'lucide-react';
import { getOrganization, updateOrganization } from '../api/organizations';

const EditOrganization = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { organizationId } = useParams();
  const { isAuthenticated } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    website_url: '',
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch organization data
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!isAuthenticated || !organizationId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setAlert({ type: '', message: '' });
      try {
        const data = await getOrganization(organizationId);
        setOrganization(data);
        // Pre-fill form data
        setFormData({
          name: data.name || '',
          description: data.description || '',
          logo_url: data.logo_url || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          address: data.address || '',
          website_url: data.website_url || '',
        });
      } catch (err) {
        setAlert({
          type: 'error',
          message: err.message || t('organization.fetchError') || 'Không thể tải thông tin tổ chức',
        });
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Xóa error khi user nhập
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Validate name nếu có
    if (formData.name.trim() && formData.name.trim().length < 3) {
      newErrors.name = t('organization.nameMinLength');
    }

    // Validate email nếu có
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = t('register.emailInvalid');
    }

    // Validate URL nếu có
    if (formData.logo_url && !/^https?:\/\/.+/.test(formData.logo_url)) {
      newErrors.logo_url = t('organization.logoUrlInvalid') || 'URL không hợp lệ';
    }

    if (formData.website_url && !/^https?:\/\/.+/.test(formData.website_url)) {
      newErrors.website_url = t('organization.websiteUrlInvalid') || 'URL không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      // Chỉ gửi các trường có giá trị và đã thay đổi
      const payload = {};
      
      if (formData.name.trim() && formData.name.trim() !== organization?.name) {
        payload.name = formData.name.trim();
      }
      if (formData.description.trim() !== (organization?.description || '')) {
        payload.description = formData.description.trim();
      }
      if (formData.logo_url.trim() !== (organization?.logo_url || '')) {
        payload.logo_url = formData.logo_url.trim();
      }
      if (formData.contact_email.trim() !== (organization?.contact_email || '')) {
        payload.contact_email = formData.contact_email.trim();
      }
      if (formData.contact_phone.trim() !== (organization?.contact_phone || '')) {
        payload.contact_phone = formData.contact_phone.trim();
      }
      if (formData.address.trim() !== (organization?.address || '')) {
        payload.address = formData.address.trim();
      }
      if (formData.website_url.trim() !== (organization?.website_url || '')) {
        payload.website_url = formData.website_url.trim();
      }

      // Nếu không có gì thay đổi
      if (Object.keys(payload).length === 0) {
        setAlert({
          type: 'info',
          message: t('organization.noChanges') || 'Không có thay đổi nào',
        });
        setSubmitting(false);
        return;
      }

      const result = await updateOrganization(organizationId, payload);
      
      setAlert({
        type: 'success',
        message: t('organization.updateSuccess') || 'Cập nhật tổ chức thành công!',
      });
      
      // Redirect về trang detail sau 2 giây
      setTimeout(() => {
        navigate(`/organizations/${organizationId}`);
      }, 2000);
    } catch (error) {
      // Xử lý lỗi từ API
      let errorMessage = t('organization.updateError') || 'Có lỗi xảy ra khi cập nhật tổ chức. Vui lòng thử lại.';
      
      if (error.message) {
        if (Array.isArray(error.message)) {
          errorMessage = error.message.join(', ');
        } else {
          errorMessage = error.message;
        }
      }

      setAlert({ type: 'error', message: errorMessage });

      // Nếu lỗi 403, redirect về trang organizations
      if (error.status === 403) {
        setTimeout(() => {
          navigate('/organizations');
        }, 2000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {t('common.loading') || 'Đang tải...'}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/organizations/${organizationId}`)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('common.back') || 'Quay lại'}
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('organization.edit') || 'Chỉnh Sửa Tổ Chức'}
            </h1>
            {organization && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Building2 className="h-5 w-5" />
                <span>{organization.name}</span>
                <span className="text-sm">(@{organization.slug})</span>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            {/* Alert */}
            {alert.message && (
              <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="mb-6">
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('organization.name')}
                </Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('organization.namePlaceholder')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('organization.nameHint')}
                </p>
              </div>

              {/* Slug - Read-only */}
              {organization && (
                <div>
                  <Label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('organization.slug')} <span className="text-gray-400">({t('organization.slugReadOnly') || 'Không thể thay đổi'})</span>
                  </Label>
                  <Input
                    id="slug"
                    type="text"
                    value={organization.slug}
                    disabled
                    className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('organization.slugCannotChange') || 'Slug không thể thay đổi sau khi tạo'}
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <Label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('organization.description')}
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t('organization.descriptionPlaceholder')}
                  rows={4}
                />
              </div>

              {/* Logo URL */}
              <div>
                <Label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('organization.logoUrl')}
                </Label>
                <Input
                  id="logo_url"
                  type="url"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleChange}
                  placeholder={t('organization.logoUrlPlaceholder')}
                  className={errors.logo_url ? 'border-red-500' : ''}
                />
                {errors.logo_url && (
                  <p className="mt-1 text-sm text-red-600">{errors.logo_url}</p>
                )}
              </div>

              {/* Website URL */}
              <div>
                <Label htmlFor="website_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('organization.websiteUrl') || 'Website URL'}
                </Label>
                <Input
                  id="website_url"
                  type="url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className={errors.website_url ? 'border-red-500' : ''}
                />
                {errors.website_url && (
                  <p className="mt-1 text-sm text-red-600">{errors.website_url}</p>
                )}
              </div>

              {/* Contact Email */}
              <div>
                <Label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('organization.contactEmail')}
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder={t('organization.contactEmailPlaceholder')}
                  className={errors.contact_email ? 'border-red-500' : ''}
                />
                {errors.contact_email && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>
                )}
              </div>

              {/* Contact Phone */}
              <div>
                <Label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('organization.contactPhone')}
                </Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder={t('organization.contactPhonePlaceholder')}
                />
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('organization.address')}
                </Label>
                <Input
                  id="address"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={t('organization.addressPlaceholder')}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/organizations/${organizationId}`)}
                  className="flex-1"
                  disabled={submitting}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  {submitting ? t('common.loading') : t('organization.updateButton') || 'Cập nhật'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditOrganization;

