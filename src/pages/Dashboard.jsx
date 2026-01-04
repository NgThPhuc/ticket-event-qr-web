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

    // DEBUG: Log user data
    console.log("=== Dashboard Redirect Debug ===");
    console.log("User:", user);
    console.log("Platform Role:", user.platform_role);
    console.log("Organizations:", user.organizations);
    console.log("Organizations length:", user.organizations?.length);

    const platformRole = user.platform_role;
    const organizations = user.organizations || [];

    // PLATFORM_ADMIN → Admin Dashboard
    if (platformRole === "PLATFORM_ADMIN") {
      console.log("→ Redirecting to /admin/dashboard");
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    // Check if user has organizations
    if (organizations.length > 0) {
      // Check platform_role OR organization role
      const orgRole = organizations[0].role;
      const isOrgAdmin = platformRole === "ORGANIZER_ADMIN" || 
                         platformRole === "EVENT_MANAGER" ||
                         orgRole === "ORGANIZER_ADMIN" ||
                         orgRole === "EVENT_MANAGER";
      
      if (isOrgAdmin) {
        console.log("→ Redirecting to /dashboard/organizations/" + organizations[0].id);
        navigate(`/dashboard/organizations/${organizations[0].id}`, { replace: true });
        return;
      }
    }

    // CUSTOMER or user without organizations → My Orders
    console.log("→ Redirecting to /my-orders (fallback)");
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

