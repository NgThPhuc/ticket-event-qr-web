import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

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
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ type: '', message: '' })}
          />
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label={t('register.fullName')}
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              error={errors.full_name}
              placeholder="John Doe"
              required
            />

            <Input
              label={t('register.email')}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="your@email.com"
              required
            />

            <Input
              label={t('register.password')}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="••••••••"
              required
            />

            <Input
              label={t('register.confirmPassword')}
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" loading={loading}>
            {t('register.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Register;

