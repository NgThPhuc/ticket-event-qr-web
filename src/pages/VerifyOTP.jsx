import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const VerifyOTP = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP } = useAuth();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(value);
    if (errors.otpCode) {
      setErrors(prev => ({ ...prev, otpCode: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!otpCode) {
      newErrors.otpCode = t('verifyOTP.otpCodeRequired');
    } else if (otpCode.length !== 6) {
      newErrors.otpCode = t('verifyOTP.otpCodeLength');
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
    const result = await verifyOTP(email, otpCode);

    if (result.success) {
      setAlert({
        type: 'success',
        message: result.data?.message || t('verifyOTP.success'),
      });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      const errorMessage = result.error?.message || t('verifyOTP.error');
      setAlert({ type: 'error', message: errorMessage });
    }

    setLoading(false);
  };

  // Countdown timer cho resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = () => {
    // TODO: Implement resend OTP API call
    setResendCooldown(60);
    setAlert({ type: 'info', message: t('verifyOTP.resendSuccess') });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('verifyOTP.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('verifyOTP.subtitle')}{' '}
            <span className="font-medium text-blue-600">{email}</span>
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
          <div>
            <Input
              label={t('verifyOTP.otpCode')}
              type="text"
              name="otpCode"
              value={otpCode}
              onChange={handleChange}
              error={errors.otpCode}
              placeholder="000000"
              required
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
            />
            <p className="mt-2 text-sm text-gray-500 text-center">
              {t('verifyOTP.enterCode')}
            </p>
          </div>

          <Button type="submit" loading={loading}>
            {t('verifyOTP.verify')}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t('verifyOTP.notReceived')}{' '}
              {resendCooldown > 0 ? (
                <span className="text-gray-400">
                  {t('verifyOTP.resendAfter', { seconds: resendCooldown })}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  {t('verifyOTP.resendCode')}
                </button>
              )}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;

