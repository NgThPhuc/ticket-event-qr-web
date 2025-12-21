import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';

const AuthModal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, register, verifyOTP, forgotPassword, loginWithGoogle } = useAuth();
  const { isOpen, currentView, email: savedEmail, closeAuthModal, setAuthView } = useAuthModal();

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    otpCode: '',
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Reset form khi chuyển view
  useEffect(() => {
    setFormData({
      email: savedEmail || '',
      password: '',
      confirmPassword: '',
      full_name: '',
      otpCode: '',
    });
    setErrors({});
    setAlert({ type: '', message: '' });
  }, [currentView, savedEmail]);

  // Countdown timer cho resend OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Xử lý riêng cho OTP - chỉ cho phép số và tối đa 6 ký tự
    if (name === 'otpCode') {
      const cleanValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: cleanValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ================== LOGIN ==================
  const validateLogin = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = t('login.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('login.emailInvalid');
    }
    if (!formData.password) {
      newErrors.password = t('login.passwordRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });
    if (!validateLogin()) return;

    setLoading(true);
    const result = await login(formData.email, formData.password);

    if (result.success) {
      setAlert({ type: 'success', message: t('login.success') });
      setTimeout(() => {
        closeAuthModal();
      }, 1000);
    } else {
      const errorMessage = result.error?.message || t('login.error');
      setAlert({ type: 'error', message: errorMessage });
    }
    setLoading(false);
  };

  // ================== REGISTER ==================
  const validateRegister = () => {
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });
    if (!validateRegister()) return;

    setLoading(true);
    const result = await register(formData.full_name, formData.email, formData.password);

    if (result.success) {
      setAlert({
        type: 'success',
        message: result.data?.message || t('register.success'),
      });
      setTimeout(() => {
        setAuthView('verify-otp', formData.email);
      }, 1500);
    } else {
      const errorMessage = result.error?.message || t('register.error');
      setAlert({ type: 'error', message: errorMessage });
    }
    setLoading(false);
  };

  // ================== VERIFY OTP ==================
  const validateOTP = () => {
    const newErrors = {};
    if (!formData.otpCode) {
      newErrors.otpCode = t('verifyOTP.otpCodeRequired');
    } else if (formData.otpCode.length !== 6) {
      newErrors.otpCode = t('verifyOTP.otpCodeLength');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });
    if (!validateOTP()) return;

    setLoading(true);
    const emailToVerify = formData.email || savedEmail;
    const result = await verifyOTP(emailToVerify, formData.otpCode);

    if (result.success) {
      setAlert({
        type: 'success',
        message: result.data?.message || t('verifyOTP.success'),
      });
      setTimeout(() => {
        setAuthView('login');
      }, 1500);
    } else {
      const errorMessage = result.error?.message || t('verifyOTP.error');
      setAlert({ type: 'error', message: errorMessage });
    }
    setLoading(false);
  };

  const handleResendOTP = () => {
    setResendCooldown(60);
    setAlert({ type: 'info', message: t('verifyOTP.resendSuccess') });
  };

  // ================== FORGOT PASSWORD ==================
  const validateForgotPassword = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = t('forgotPassword.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('forgotPassword.emailInvalid');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });
    if (!validateForgotPassword()) return;

    setLoading(true);
    const result = await forgotPassword(formData.email);

    if (result.success) {
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

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  // ================== RENDER FUNCTIONS ==================
  const renderLoginForm = () => (
    <form className="space-y-4" onSubmit={handleLogin}>
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('login.email')}
        </label>
        <Input
          id="login-email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          required
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('login.password')}
        </label>
        <Input
          id="login-password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setAuthView('forgot-password')}
          className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          {t('login.forgotPassword')}
        </button>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t('common.loading') || 'Loading...' : t('login.submit')}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">{t('login.or')}</span>
        </div>
      </div>

      <Button type="button" variant="outline" onClick={handleGoogleLogin} className="w-full">
        <div className="flex items-center justify-center">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {t('login.googleLogin')}
        </div>
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {t('login.subtitle')}{' '}
        <button
          type="button"
          onClick={() => setAuthView('register')}
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          {t('login.registerLink')}
        </button>
      </p>
    </form>
  );

  const renderRegisterForm = () => (
    <form className="space-y-4" onSubmit={handleRegister}>
      <div>
        <label htmlFor="register-fullname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('register.fullName')}
        </label>
        <Input
          id="register-fullname"
          type="text"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          placeholder="John Doe"
          required
        />
        {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>}
      </div>

      <div>
        <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('register.email')}
        </label>
        <Input
          id="register-email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          required
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('register.password')}
        </label>
        <Input
          id="register-password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
      </div>

      <div>
        <label htmlFor="register-confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('register.confirmPassword')}
        </label>
        <Input
          id="register-confirm"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />
        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t('common.loading') || 'Loading...' : t('register.submit')}
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {t('register.subtitle')}{' '}
        <button
          type="button"
          onClick={() => setAuthView('login')}
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          {t('register.loginLink')}
        </button>
      </p>
    </form>
  );

  const renderVerifyOTPForm = () => (
    <form className="space-y-4" onSubmit={handleVerifyOTP}>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {t('verifyOTP.subtitle')}{' '}
        <span className="font-medium text-blue-600 dark:text-blue-400">{formData.email || savedEmail}</span>
      </p>

      <div>
        <label htmlFor="otp-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('verifyOTP.otpCode')}
        </label>
        <Input
          id="otp-code"
          type="text"
          name="otpCode"
          value={formData.otpCode}
          onChange={handleChange}
          placeholder="000000"
          required
          maxLength={6}
          className="text-center text-2xl tracking-widest font-mono"
        />
        {errors.otpCode && <p className="mt-1 text-sm text-red-600">{errors.otpCode}</p>}
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
          {t('verifyOTP.enterCode')}
        </p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t('common.loading') || 'Loading...' : t('verifyOTP.verify')}
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('verifyOTP.notReceived')}{' '}
          {resendCooldown > 0 ? (
            <span className="text-gray-400">
              {t('verifyOTP.resendAfter', { seconds: resendCooldown })}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendOTP}
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              {t('verifyOTP.resendCode')}
            </button>
          )}
        </p>
      </div>
    </form>
  );

  const renderForgotPasswordForm = () => (
    <form className="space-y-4" onSubmit={handleForgotPassword}>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
        {t('forgotPassword.subtitle')}
      </p>

      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('forgotPassword.email')}
        </label>
        <Input
          id="forgot-email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          required
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t('common.loading') || 'Loading...' : t('forgotPassword.submit')}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setAuthView('login')}
          className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          {t('forgotPassword.backToLogin')}
        </button>
      </div>
    </form>
  );

  const getTitle = () => {
    switch (currentView) {
      case 'register':
        return t('register.title');
      case 'verify-otp':
        return t('verifyOTP.title');
      case 'forgot-password':
        return t('forgotPassword.title');
      default:
        return t('login.title');
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'register':
        return renderRegisterForm();
      case 'verify-otp':
        return renderVerifyOTPForm();
      case 'forgot-password':
        return renderForgotPasswordForm();
      default:
        return renderLoginForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-xl font-bold text-center">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {alert.message && (
            <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="mb-4">
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          )}

          {renderCurrentView()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
