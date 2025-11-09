import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Lắng nghe event khi reset password thành công
  useEffect(() => {
    const handlePasswordResetSuccess = () => {
      // Xóa flag trong localStorage
      localStorage.removeItem('passwordResetSuccess');
      // Redirect đến trang login
      navigate('/login');
    };

    // Kiểm tra localStorage khi component mount
    if (localStorage.getItem('passwordResetSuccess') === 'true') {
      handlePasswordResetSuccess();
      return;
    }

    // Lắng nghe event từ window
    window.addEventListener('passwordResetSuccess', handlePasswordResetSuccess);

    // Lắng nghe thay đổi trong localStorage (cho cross-tab communication)
    const handleStorageChange = (e) => {
      if (e.key === 'passwordResetSuccess' && e.newValue === 'true') {
        handlePasswordResetSuccess();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('passwordResetSuccess', handlePasswordResetSuccess);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = t('forgotPassword.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('forgotPassword.emailInvalid');
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
    const result = await forgotPassword(email);

    if (result.success) {
      setSubmitted(true);
      setAlert({
        type: 'success',
        message: result.data?.message || t('forgotPassword.success'),
      });
    } else {
      const errorMessage = result.error?.message || t('forgotPassword.error');
      setAlert({ type: 'error', message: errorMessage });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('forgotPassword.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('forgotPassword.subtitle')}
          </p>
        </div>

        {alert.message && (
          <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="mb-4">
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        {!submitted ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('forgotPassword.email')}
              </label>
              <Input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('common.loading') || 'Loading...' : t('forgotPassword.submit')}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {t('forgotPassword.backToLogin')}
              </Link>
            </div>
          </form>
        ) : (
          <div className="mt-8 text-center space-y-4">
            <div className="text-green-600">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              {t('forgotPassword.checkEmail')} <span className="font-medium">{email}</span> {t('forgotPassword.toResetPassword')}
            </p>
            <Link
              to="/login"
              className="inline-block text-sm text-blue-600 hover:text-blue-500"
            >
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

