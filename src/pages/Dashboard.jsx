import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Dashboard redirector component
 * Redirects users to appropriate dashboard based on their role:
 * - PLATFORM_ADMIN → /admin/dashboard
 * - ORGANIZER_ADMIN/EVENT_MANAGER → /dashboard/organizations/:firstOrgId
 * - CUSTOMER → /my-orders (no dashboard access)
 */
const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }

    const platformRole = user.platform_role;
    const organizations = user.organizations || [];

    // PLATFORM_ADMIN → Admin Dashboard
    if (platformRole === "PLATFORM_ADMIN") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    // ORGANIZER_ADMIN or EVENT_MANAGER with organizations → Organization Dashboard
    if (
      (platformRole === "ORGANIZER_ADMIN" || platformRole === "EVENT_MANAGER") &&
      organizations.length > 0
    ) {
      // Navigate to first organization's dashboard
      navigate(`/dashboard/organizations/${organizations[0].id}`, { replace: true });
      return;
    }

    // CUSTOMER or user without organizations → My Orders
    navigate("/my-orders", { replace: true });
  }, [authLoading, isAuthenticated, user, navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">{t('common.redirecting') || 'Redirecting...'}</p>
      </div>
    </div>
  );
};

export default Dashboard;

