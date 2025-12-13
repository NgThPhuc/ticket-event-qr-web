import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Bell, 
  Check, 
  Eye, 
  EyeOff, 
  Globe, 
  Key, 
  Loader2, 
  Moon, 
  Palette, 
  Shield, 
  Sun, 
  Trash2, 
  User 
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { changePassword } from "../api/auth";
import Header from "../components/Header";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const Settings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_new_password: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Delete account dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePassword = () => {
    const errors = {};

    if (!passwordData.current_password) {
      errors.current_password = t('settings.currentPasswordRequired') || 'Vui lòng nhập mật khẩu hiện tại';
    }

    if (!passwordData.new_password) {
      errors.new_password = t('settings.newPasswordRequired') || 'Vui lòng nhập mật khẩu mới';
    } else if (passwordData.new_password.length < 6) {
      errors.new_password = t('settings.newPasswordMinLength') || 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }

    if (!passwordData.confirm_new_password) {
      errors.confirm_new_password = t('settings.confirmPasswordRequired') || 'Vui lòng xác nhận mật khẩu mới';
    } else if (passwordData.new_password !== passwordData.confirm_new_password) {
      errors.confirm_new_password = t('settings.passwordMismatch') || 'Mật khẩu xác nhận không khớp';
    }

    if (passwordData.current_password === passwordData.new_password) {
      errors.new_password = t('settings.newPasswordSameAsOld') || 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_new_password: passwordData.confirm_new_password
      });

      toast.success(t('settings.passwordChangeSuccess') || 'Đổi mật khẩu thành công');
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_new_password: ""
      });
    } catch (err) {
      console.error('Error changing password:', err);
      const errorMessage = err.message || t('settings.passwordChangeError') || 'Không thể đổi mật khẩu';
      
      // Handle specific errors
      if (errorMessage.toLowerCase().includes('current') || errorMessage.toLowerCase().includes('incorrect')) {
        setPasswordErrors({ current_password: t('settings.currentPasswordIncorrect') || 'Mật khẩu hiện tại không đúng' });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    toast.success(t('settings.languageChanged') || 'Đã thay đổi ngôn ngữ');
  };

  const handleThemeToggle = () => {
    toggleTheme();
    toast.success(
      isDark 
        ? (t('settings.switchedToLight') || 'Đã chuyển sang giao diện sáng')
        : (t('settings.switchedToDark') || 'Đã chuyển sang giao diện tối')
    );
  };

  const handleDeleteAccount = async () => {
    // TODO: Implement delete account API
    toast.error(t('settings.deleteNotImplemented') || 'Tính năng xóa tài khoản chưa được hỗ trợ. Vui lòng liên hệ hỗ trợ.');
    setShowDeleteDialog(false);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('settings.title') || 'Cài đặt'}</h1>
            <p className="text-muted-foreground">
              {t('settings.subtitle') || 'Quản lý cài đặt tài khoản và ứng dụng'}
            </p>
          </div>

          <div className="space-y-6">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle>{t('settings.changePassword') || 'Đổi mật khẩu'}</CardTitle>
                </div>
                <CardDescription>
                  {t('settings.changePasswordDesc') || 'Cập nhật mật khẩu để bảo vệ tài khoản của bạn'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPassword} className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="current_password">
                      {t('settings.currentPassword') || 'Mật khẩu hiện tại'} <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        name="current_password"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.current_password}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                        className={passwordErrors.current_password ? 'border-destructive pr-10' : 'pr-10'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {passwordErrors.current_password && (
                      <p className="text-sm text-destructive">{passwordErrors.current_password}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="new_password">
                      {t('settings.newPassword') || 'Mật khẩu mới'} <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        name="new_password"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.new_password}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                        className={passwordErrors.new_password ? 'border-destructive pr-10' : 'pr-10'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {passwordErrors.new_password && (
                      <p className="text-sm text-destructive">{passwordErrors.new_password}</p>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm_new_password">
                      {t('settings.confirmNewPassword') || 'Xác nhận mật khẩu mới'} <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm_new_password"
                        name="confirm_new_password"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirm_new_password}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                        className={passwordErrors.confirm_new_password ? 'border-destructive pr-10' : 'pr-10'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {passwordErrors.confirm_new_password && (
                      <p className="text-sm text-destructive">{passwordErrors.confirm_new_password}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={changingPassword} className="w-full sm:w-auto">
                    {changingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('common.saving') || 'Đang lưu...'}
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {t('settings.updatePassword') || 'Cập nhật mật khẩu'}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <CardTitle>{t('settings.appearance') || 'Giao diện'}</CardTitle>
                </div>
                <CardDescription>
                  {t('settings.appearanceDesc') || 'Tùy chỉnh giao diện ứng dụng'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Theme */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    <div>
                      <p className="font-medium">{t('settings.theme') || 'Chế độ giao diện'}</p>
                      <p className="text-sm text-muted-foreground">
                        {isDark 
                          ? (t('settings.darkMode') || 'Giao diện tối')
                          : (t('settings.lightMode') || 'Giao diện sáng')
                        }
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleThemeToggle}>
                    {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                    {isDark 
                      ? (t('settings.switchToLight') || 'Chuyển sang sáng')
                      : (t('settings.switchToDark') || 'Chuyển sang tối')
                    }
                  </Button>
                </div>

                {/* Language */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{t('settings.language') || 'Ngôn ngữ'}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.languageDesc') || 'Chọn ngôn ngữ hiển thị'}
                      </p>
                    </div>
                  </div>
                  <Select value={i18n.language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="vn">Tiếng Việt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-destructive">{t('settings.dangerZone') || 'Vùng nguy hiểm'}</CardTitle>
                </div>
                <CardDescription>
                  {t('settings.dangerZoneDesc') || 'Các hành động không thể hoàn tác'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                  <div>
                    <p className="font-medium">{t('settings.deleteAccount') || 'Xóa tài khoản'}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.deleteAccountDesc') || 'Xóa vĩnh viễn tài khoản và tất cả dữ liệu'}
                    </p>
                  </div>
                  <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('settings.deleteAccount') || 'Xóa tài khoản'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Back to Profile */}
            <div className="text-center pt-4">
              <Button variant="link" onClick={() => navigate('/profile')}>
                <User className="h-4 w-4 mr-2" />
                {t('settings.backToProfile') || 'Quay lại trang cá nhân'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {t('settings.confirmDeleteTitle') || 'Xác nhận xóa tài khoản'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.confirmDeleteDesc') || 
                'Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn bao gồm đơn hàng, vé và thông tin cá nhân sẽ bị xóa vĩnh viễn.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel') || 'Hủy'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('settings.confirmDelete') || 'Xóa tài khoản'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;

