import { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as authAPI from '../api/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isInitialized = useRef(false);

  // Kiểm tra authentication khi component mount
  useEffect(() => {
    // Tránh duplicate call trong StrictMode
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initAuth = async () => {
      const token = authAPI.getToken();
      const savedUser = authAPI.getCurrentUser();

      if (token && savedUser) {
        setIsAuthenticated(true);
        setUser(savedUser);
        
        // Verify token bằng cách lấy profile
        try {
          const profile = await authAPI.getProfile();
          setUser(profile);
          localStorage.setItem('user', JSON.stringify(profile));
        } catch (error) {
          // Token không hợp lệ, xóa khỏi localStorage
          authAPI.logout();
          setIsAuthenticated(false);
          setUser(null);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const result = await authAPI.login({ email, password });
      setUser(result.user);
      setIsAuthenticated(true);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  };

  const register = async (fullName, email, password) => {
    try {
      const result = await authAPI.register({ full_name: fullName, email, password });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  };

  const verifyOTP = async (email, otpCode) => {
    try {
      const result = await authAPI.verifyOTP({ email, otp_code: otpCode });
      if (result.user) {
        setUser(result.user);
      }
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const result = await authAPI.forgotPassword({ email });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  };

  const resetPassword = async (token, newPassword, confirmPassword) => {
    try {
      const result = await authAPI.resetPassword({
        token,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const loginWithGoogle = () => {
    authAPI.loginWithGoogle();
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    verifyOTP,
    forgotPassword,
    resetPassword,
    logout,
    loginWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

