import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Edit2, 
  Loader2, 
  Mail, 
  Package, 
  Phone, 
  Save, 
  Shield, 
  Ticket, 
  User, 
  X 
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getProfile, updateProfile } from "../api/auth";
import { getMyOrders } from "../api/orders";
import Header from "../components/Header";
import ImageUploader from "../components/ImageUploader";
import { useAuth } from "../contexts/AuthContext";

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalTickets: 0,
    upcomingEvents: 0
  });

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    avatar_url: ""
  });
  const [errors, setErrors] = useState({});
  const hasFetched = useRef(false);

  // Fetch profile và stats
  useEffect(() => {
    // Tránh duplicate call trong StrictMode
    if (hasFetched.current) return;

    const fetchData = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      hasFetched.current = true;

      try {
        setLoading(true);
        
        // Fetch profile
        const profileData = await getProfile();
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          avatar_url: profileData.avatar_url || ""
        });

        // Fetch orders for stats
        try {
          const ordersData = await getMyOrders({ limit: 100 });
          const orders = ordersData.data || [];
          
          const totalTickets = orders.reduce((sum, order) => sum + (order.quantity || 0), 0);
          const upcomingEvents = orders.filter(order => {
            if (!order.event?.start_at) return false;
            return new Date(order.event.start_at) > new Date() && order.status !== 'CANCELLED';
          }).length;

          setStats({
            totalOrders: orders.length,
            totalTickets,
            upcomingEvents
          });
        } catch (err) {
          console.error('Error fetching orders stats:', err);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast.error(t('profile.fetchError') || 'Không thể tải thông tin profile');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, t]);

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = t('profile.fullNameRequired') || 'Họ tên không được để trống';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = t('profile.fullNameMinLength') || 'Họ tên phải có ít nhất 2 ký tự';
    }

    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = t('profile.phoneInvalid') || 'Số điện thoại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      const result = await updateProfile({
        full_name: formData.full_name.trim(),
        phone: formData.phone?.trim() || null,
        avatar_url: formData.avatar_url || null
      });
      
      setProfile(result);
      setEditing(false);
      toast.success(t('profile.updateSuccess') || 'Cập nhật thông tin thành công');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.message || t('profile.updateError') || 'Không thể cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
      avatar_url: profile?.avatar_url || ""
    });
    setErrors({});
    setEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role) => {
    const variants = {
      PLATFORM_ADMIN: { variant: 'destructive', label: 'Platform Admin' },
      ORGANIZER_ADMIN: { variant: 'default', label: 'Organizer Admin' },
      EVENT_MANAGER: { variant: 'secondary', label: 'Event Manager' },
      CHECKIN_STAFF: { variant: 'outline', label: 'Check-in Staff' },
      CUSTOMER: { variant: 'outline', label: 'Customer' }
    };
    const config = variants[role] || { variant: 'outline', label: role };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (authLoading || loading) {
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
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('profile.title') || 'Thông tin cá nhân'}</h1>
            <p className="text-muted-foreground">
              {t('profile.subtitle') || 'Quản lý thông tin tài khoản của bạn'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('profile.personalInfo') || 'Thông tin cá nhân'}</CardTitle>
                      <CardDescription>
                        {t('profile.personalInfoDesc') || 'Cập nhật thông tin cá nhân của bạn'}
                      </CardDescription>
                    </div>
                    {!editing && (
                      <Button variant="outline" onClick={() => setEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        {t('common.edit') || 'Chỉnh sửa'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Avatar */}
                      <div className="flex justify-center mb-6">
                        <div className="text-center">
                          <ImageUploader
                            currentImageUrl={formData.avatar_url}
                            onImageUploaded={(url) => setFormData(prev => ({ ...prev, avatar_url: url }))}
                            label={t('profile.avatar') || 'Ảnh đại diện'}
                            disabled={saving}
                          />
                        </div>
                      </div>

                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label htmlFor="full_name">
                          {t('profile.fullName') || 'Họ và tên'} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          placeholder={t('profile.fullNamePlaceholder') || 'Nhập họ và tên'}
                          className={errors.full_name ? 'border-destructive' : ''}
                        />
                        {errors.full_name && (
                          <p className="text-sm text-destructive">{errors.full_name}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t('profile.phone') || 'Số điện thoại'}</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder={t('profile.phonePlaceholder') || '0987654321'}
                          className={errors.phone ? 'border-destructive' : ''}
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone}</p>
                        )}
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                          <X className="h-4 w-4 mr-2" />
                          {t('common.cancel') || 'Hủy'}
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {saving ? t('common.saving') || 'Đang lưu...' : t('common.save') || 'Lưu thay đổi'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      {/* Avatar Display */}
                      <div className="flex justify-center">
                        <div className="relative">
                          {profile?.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt={profile.full_name}
                              className="h-24 w-24 rounded-full object-cover border-4 border-primary/20"
                            />
                          ) : (
                            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                              <User className="h-12 w-12 text-primary" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info Display */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">{t('profile.fullName') || 'Họ và tên'}</p>
                            <p className="font-medium">{profile?.full_name || '-'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">{t('profile.email') || 'Email'}</p>
                            <p className="font-medium">{profile?.email || '-'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Phone className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">{t('profile.phone') || 'Số điện thoại'}</p>
                            <p className="font-medium">{profile?.phone || t('profile.notProvided') || 'Chưa cung cấp'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">{t('profile.joinedAt') || 'Ngày tham gia'}</p>
                            <p className="font-medium">{formatDate(profile?.created_at)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Shield className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">{t('profile.role') || 'Vai trò'}</p>
                            <div className="mt-1">
                              {getRoleBadge(profile?.platform_role || 'CUSTOMER')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security Section */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('profile.security') || 'Bảo mật'}</CardTitle>
                  <CardDescription>
                    {t('profile.securityDesc') || 'Quản lý mật khẩu và bảo mật tài khoản'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{t('profile.password') || 'Mật khẩu'}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('profile.passwordDesc') || 'Đổi mật khẩu để bảo vệ tài khoản'}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/settings')}>
                      {t('profile.changePassword') || 'Đổi mật khẩu'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Stats */}
            <div className="space-y-6">
              {/* Stats Cards */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('profile.stats') || 'Thống kê'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-blue-600" />
                      <span className="text-sm">{t('profile.totalOrders') || 'Tổng đơn hàng'}</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">{stats.totalOrders}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                    <div className="flex items-center gap-3">
                      <Ticket className="h-5 w-5 text-green-600" />
                      <span className="text-sm">{t('profile.totalTickets') || 'Tổng vé'}</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">{stats.totalTickets}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <span className="text-sm">{t('profile.upcomingEvents') || 'Sự kiện sắp tới'}</span>
                    </div>
                    <span className="text-xl font-bold text-purple-600">{stats.upcomingEvents}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('profile.quickActions') || 'Truy cập nhanh'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/orders')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    {t('profile.viewOrders') || 'Xem đơn hàng'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/events')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {t('profile.browseEvents') || 'Khám phá sự kiện'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/settings')}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {t('profile.settings') || 'Cài đặt'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

