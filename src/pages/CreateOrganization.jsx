import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { createOrganization } from '../api/organizations';
import Header from '../components/Header';
import ImageUploader from '../components/ImageUploader';
import { useAuth } from '../contexts/AuthContext';

const CreateOrganization = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo_url: '',
    contact_email: '',
    contact_phone: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Xóa error khi user nhập
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Tự động tạo slug từ name nếu trường slug trống
    if (name === 'name' && !formData.slug) {
      const autoSlug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();
      setFormData(prev => ({ ...prev, slug: autoSlug }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = t('organization.nameRequired') || 'Tên tổ chức không được để trống';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = t('organization.nameMinLength');
    }

    // Validate slug
    if (!formData.slug.trim()) {
      newErrors.slug = t('organization.slugRequired');
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = t('organization.slugInvalid') || 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang';
    }

    // Validate email nếu có
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = t('register.emailInvalid');
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

    setLoading(true);
    try {
      // Chỉ gửi các trường có giá trị
      const payload = {};
      if (formData.name.trim()) payload.name = formData.name.trim();
      if (formData.slug.trim()) payload.slug = formData.slug.trim();
      if (formData.description.trim()) payload.description = formData.description.trim();
      if (formData.logo_url.trim()) payload.logo_url = formData.logo_url.trim();
      if (formData.contact_email.trim()) payload.contact_email = formData.contact_email.trim();
      if (formData.contact_phone.trim()) payload.contact_phone = formData.contact_phone.trim();
      if (formData.address.trim()) payload.address = formData.address.trim();

      const result = await createOrganization(payload);
      
      setAlert({
        type: 'success',
        message: t('organization.createSuccess'),
      });
      
      // Redirect về trang chủ sau 2 giây
      setTimeout(() => {
        navigate('/');
        // Reload page để Header cập nhật (có thể có organization mới)
        window.location.reload();
      }, 2000);
    } catch (error) {
      // Xử lý lỗi từ API
      let errorMessage = t('organization.createError');
      
      if (error.message) {
        if (Array.isArray(error.message)) {
          // Nếu là mảng lỗi từ API validation
          errorMessage = error.message.join(', ');
        } else {
          errorMessage = error.message;
        }
      }

      // Xử lý lỗi cụ thể cho slug đã tồn tại
      if (error.status === 400 && errorMessage.includes('Slug')) {
        setErrors(prev => ({ ...prev, slug: errorMessage }));
      } else {
        setAlert({ type: 'error', message: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('organization.createTitle')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('organization.createSubtitle')}
              </p>
            </div>

            {alert.message && (
              <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="mb-6">
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('organization.name')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('organization.namePlaceholder')}
                  required
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('organization.nameHint')}
                </p>
              </div>

              {/* Slug */}
              <div>
                <Label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('organization.slug')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="slug"
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder={t('organization.slugPlaceholder')}
                  required
                  className={errors.slug ? 'border-red-500' : ''}
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('organization.slugHint')}
                </p>
              </div>

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

              {/* Logo Upload */}
              <div className="border-t pt-4">
                <ImageUploader
                  currentImageUrl={formData.logo_url}
                  onImageUploaded={(url) => setFormData(prev => ({ ...prev, logo_url: url || '' }))}
                  label={t('organization.logo') || 'Logo tổ chức'}
                  disabled={loading}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                  disabled={loading}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  {loading ? t('common.loading') : t('organization.createButton')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrganization;

