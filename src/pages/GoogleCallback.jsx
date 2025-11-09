import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';

const GoogleCallback = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [alert, setAlert] = useState({ type: '', message: '' });
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Lưu token vào localStorage
      localStorage.setItem('access_token', token);

      // Lấy thông tin user từ API
      const fetchProfile = async () => {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
          const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const user = await response.json();
            localStorage.setItem('user', JSON.stringify(user));
            setAlert({
              type: 'success',
              message: t('googleCallback.success'),
            });
            setTimeout(() => {
              navigate('/');
              window.location.reload(); // Reload để cập nhật auth state
            }, 1500);
          } else {
            throw new Error(t('googleCallback.fetchError'));
          }
        } catch (error) {
          setAlert({
            type: 'error',
            message: t('googleCallback.error'),
          });
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      };

      fetchProfile();
    } else {
      setAlert({
        type: 'error',
        message: t('googleCallback.noToken'),
      });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('googleCallback.processing')}
          </h2>
          {alert.message && (
            <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="mb-4">
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          )}
          {!alert.message && (
            <div className="mt-4">
              <svg
                className="animate-spin h-8 w-8 text-blue-600 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback;

