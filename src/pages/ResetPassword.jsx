import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_new_password: '',
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setAlert({
        type: 'error',
        message: t('resetPassword.invalidToken'),
      });
    }
  }, [token]);

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

    if (!formData.new_password) {
      newErrors.new_password = t('resetPassword.newPasswordRequired');
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = t('resetPassword.passwordMinLength');
    }

    if (!formData.confirm_new_password) {
      newErrors.confirm_new_password = t('resetPassword.confirmPasswordRequired');
    } else if (formData.new_password !== formData.confirm_new_password) {
      newErrors.confirm_new_password = t('resetPassword.confirmPasswordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    if (!token) {
      setAlert({
        type: 'error',
        message: t('resetPassword.invalidToken'),
      });
      return;
    }

    if (!validate()) {
      return;
    }

    setLoading(true);
    const result = await resetPassword(
      token,
      formData.new_password,
      formData.confirm_new_password
    );

    if (result.success) {
      setSuccess(true);
      setAlert({
        type: 'success',
        message: result.data?.message || t('resetPassword.success'),
      });
      
      // Gửi event để thông báo cho tab forgot password
      localStorage.setItem('passwordResetSuccess', 'true');
      window.dispatchEvent(new Event('passwordResetSuccess'));
      
      // Đóng tab sau 1.5 giây
      setTimeout(() => {
        window.close();
        // Nếu không đóng được (không phải window mở bởi script), redirect
        if (!document.hidden) {
          navigate('/login');
        }
      }, 1500);
    } else {
      const errorMessage = result.error?.message || t('resetPassword.error');
      setAlert({ type: 'error', message: errorMessage });
    }

    setLoading(false);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <Alert type="error" message={t('resetPassword.invalidToken')} />
          <Link
            to="/forgot-password"
            className="block text-center text-blue-600 hover:text-blue-500"
          >
            {t('resetPassword.requestNewLink')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('resetPassword.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('resetPassword.subtitle')}
          </p>
        </div>

        {alert.message && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ type: '', message: '' })}
          />
        )}

        {!success ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label={t('resetPassword.newPassword')}
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                error={errors.new_password}
                placeholder="••••••••"
                required
              />

              <Input
                label={t('resetPassword.confirmNewPassword')}
                type="password"
                name="confirm_new_password"
                value={formData.confirm_new_password}
                onChange={handleChange}
                error={errors.confirm_new_password}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" loading={loading}>
              {t('resetPassword.submit')}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {t('resetPassword.backToLogin')}
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              {t('resetPassword.redirecting')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

