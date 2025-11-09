import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

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

    if (!formData.full_name.trim()) {
      newErrors.full_name = t('register.fullNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('register.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('register.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('register.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('register.passwordMinLength');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('register.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('register.confirmPasswordMismatch');
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
    const result = await register(formData.full_name, formData.email, formData.password);

    if (result.success) {
      setAlert({
        type: 'success',
        message: result.data?.message || t('register.success'),
      });
      // Chuyển đến trang verify OTP với email
      setTimeout(() => {
        navigate('/verify-otp', { state: { email: formData.email } });
      }, 2000);
    } else {
      const errorMessage = result.error?.message || t('register.error');
      setAlert({ type: 'error', message: errorMessage });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('register.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('register.subtitle')}{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              {t('register.loginLink')}
            </Link>
          </p>
        </div>

        {alert.message && (
          <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="mb-4">
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                {t('register.fullName')}
              </label>
              <Input
                id="full_name"
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('register.email')}
              </label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('register.password')}
              </label>
              <Input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('register.confirmPassword')}
              </label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t('common.loading') || 'Loading...' : t('register.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Register;

