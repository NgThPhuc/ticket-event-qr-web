import { createContext, useCallback, useContext, useState } from 'react';

const AuthModalContext = createContext(null);

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return context;
};

export const AuthModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'register' | 'verify-otp' | 'forgot-password'
  const [email, setEmail] = useState(''); // Lưu email cho verify-otp flow

  const openAuthModal = useCallback((view = 'login', emailForOtp = '') => {
    setCurrentView(view);
    if (emailForOtp) {
      setEmail(emailForOtp);
    }
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
    // Reset về login sau khi đóng
    setTimeout(() => {
      setCurrentView('login');
      setEmail('');
    }, 300); // Delay để animation đóng xong
  }, []);

  const setAuthView = useCallback((view, emailForOtp = '') => {
    setCurrentView(view);
    if (emailForOtp) {
      setEmail(emailForOtp);
    }
  }, []);

  const value = {
    isOpen,
    currentView,
    email,
    openAuthModal,
    closeAuthModal,
    setAuthView,
  };

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  );
};
