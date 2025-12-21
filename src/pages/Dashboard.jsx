import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Activity,
    ArrowRight,
    Building2,
    Calendar,
    DollarSign,
    Package,
    Plus,
    Ticket,
    TrendingUp
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getEvents } from "../api/events";
import { getMyOrders } from "../api/orders";
import { useAuth } from "../contexts/AuthContext";
import { DashboardLayout } from "../layouts/DashboardLayout";

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    totalEvents: 0,
    publishedEvents: 0,
    upcomingEvents: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalTicketsSold: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const hasFetched = useRef(false);

  // Sử dụng user.organizations từ profile thay vì gọi API
  const organizations = user?.organizations || [];

  useEffect(() => {
    // Tránh duplicate call trong StrictMode
    if (hasFetched.current) return;

    const fetchDashboardData = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      hasFetched.current = true;

      try {
        setLoading(true);

        // Fetch events
        let events = [];
        try {
          const eventsResponse = await getEvents({ limit: 100, sort: "start_at:desc" });
          events = eventsResponse.data || [];
          setRecentEvents(events.slice(0, 5));
        } catch (err) {
          console.error("Error fetching events:", err);
        }

        // Fetch orders
        let orders = [];
        try {
          const ordersResponse = await getMyOrders({ limit: 100 });
          orders = ordersResponse.data || [];
          setRecentOrders(orders.slice(0, 5));
        } catch (err) {
          console.error("Error fetching orders:", err);
        }

        // Calculate stats
        const now = new Date();
        const publishedEvents = events.filter((e) => e.status === "PUBLISHED");
        const upcomingEvents = events.filter((e) => {
          if (!e.start_at) return false;
          return new Date(e.start_at) > now && e.status !== "CANCELLED";
        });

        const paidOrders = orders.filter((o) => o.payment_status === "PAID");
        const totalRevenue = paidOrders.reduce(
          (sum, o) => sum + parseFloat(o.total_amount || 0),
          0
        );
        const totalTicketsSold = paidOrders.reduce(
          (sum, o) => sum + (o.quantity || 0),
          0
        );

        setStats({
          totalOrganizations: organizations.length,
          totalEvents: events.length,
          publishedEvents: publishedEvents.length,
          upcomingEvents: upcomingEvents.length,
          totalOrders: orders.length,
          totalRevenue,
          totalTicketsSold,
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, organizations.length]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      DRAFT: "secondary",
      SCHEDULED: "outline",
      PUBLISHED: "default",
      CANCELLED: "destructive",
      COMPLETED: "success",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {t(`event.${status?.toLowerCase()}`) || status}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const variants = {
      UNPAID: "destructive",
      PAID: "success",
      REFUNDED: "secondary",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {t(`order.paymentStatus.${status}`) || status}
      </Badge>
    );
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("dashboard.welcome") || "Xin chào"}, {user?.full_name || "User"}! 👋
          </h1>
          <p className="text-muted-foreground">
            {t("dashboard.subtitle") || "Đây là tổng quan hoạt động của bạn"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Organizations */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t("dashboard.stats.organizations") || "Tổ chức"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{stats.totalOrganizations}</span>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Events */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t("dashboard.stats.events") || "Sự kiện"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold">{stats.totalEvents}</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.publishedEvents} {t("dashboard.stats.published") || "đã xuất bản"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Tickets Sold */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                {t("dashboard.stats.ticketsSold") || "Vé đã bán"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold">{stats.totalTicketsSold}</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.totalOrders} {t("dashboard.stats.orders") || "đơn hàng"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Ticket className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t("dashboard.stats.revenue") || "Doanh thu"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</span>
                  <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    {t("dashboard.stats.allTime") || "Tất cả thời gian"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Recent Events */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      {t("dashboard.upcomingEvents") || "Sự kiện sắp tới"}
                    </CardTitle>
                    <CardDescription>
                      {stats.upcomingEvents} {t("dashboard.eventsComingUp") || "sự kiện sắp diễn ra"}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate("/events-management")}>
                    {t("common.viewAll") || "Xem tất cả"}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {t("dashboard.noEvents") || "Chưa có sự kiện nào"}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate("/create-event")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("dashboard.createEvent") || "Tạo sự kiện mới"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        {event.cover_image_url ? (
                          <img
                            src={event.cover_image_url}
                            alt={event.title}
                            className="h-16 w-24 rounded object-cover"
                          />
                        ) : (
                          <div className="h-16 w-24 rounded bg-muted flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{event.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(event.start_at)}</span>
                          </div>
                        </div>
                        {getStatusBadge(event.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      {t("dashboard.recentOrders") || "Đơn hàng gần đây"}
                    </CardTitle>
                    <CardDescription>
                      {t("dashboard.recentOrdersDesc") || "Các đơn hàng mới nhất của bạn"}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate("/orders")}>
                    {t("common.viewAll") || "Xem tất cả"}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {t("dashboard.noOrders") || "Chưa có đơn hàng nào"}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate("/events")}
                    >
                      {t("dashboard.browseEvents") || "Khám phá sự kiện"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {order.event?.title || "Event"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(order.total_amount)}</p>
                          {getPaymentStatusBadge(order.payment_status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Actions & Organizations */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("dashboard.quickActions") || "Thao tác nhanh"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/create-event")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("dashboard.createEvent") || "Tạo sự kiện mới"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/create-organization")}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  {t("dashboard.createOrganization") || "Tạo tổ chức mới"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/events")}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {t("dashboard.browseEvents") || "Khám phá sự kiện"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/orders")}
                >
                  <Package className="h-4 w-4 mr-2" />
                  {t("dashboard.myOrders") || "Đơn hàng của tôi"}
                </Button>
              </CardContent>
            </Card>

            {/* My Organizations */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {t("dashboard.myOrganizations") || "Tổ chức của tôi"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {organizations.length === 0 ? (
                  <div className="text-center py-6">
                    <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">
                      {t("dashboard.noOrganizations") || "Bạn chưa có tổ chức nào"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/create-organization")}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t("dashboard.createOrganization") || "Tạo tổ chức"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {organizations.slice(0, 3).map((org) => {
                      return (
                        <div
                          key={org.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/organizations/${org.id}`)}
                        >
                          {org.logo_url ? (
                            <img
                              src={org.logo_url}
                              alt={org.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{org.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {org.role?.toLowerCase().replace("_", " ") || "Member"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {organizations.length > 3 && (
                      <Button
                        variant="ghost"
                        className="w-full text-sm"
                        onClick={() => navigate("/organizations")}
                      >
                        {t("common.viewAll") || "Xem tất cả"} ({organizations.length})
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t("dashboard.activitySummary") || "Tổng kết hoạt động"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Events Progress */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      {t("dashboard.eventsPublished") || "Sự kiện đã xuất bản"}
                    </span>
                    <span className="font-medium">
                      {stats.publishedEvents}/{stats.totalEvents}
                    </span>
                  </div>
                  <Progress
                    value={
                      stats.totalEvents > 0
                        ? (stats.publishedEvents / stats.totalEvents) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                {/* Orders Status */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      {t("dashboard.upcomingEventsRatio") || "Sự kiện sắp tới"}
                    </span>
                    <span className="font-medium">
                      {stats.upcomingEvents}/{stats.totalEvents}
                    </span>
                  </div>
                  <Progress
                    value={
                      stats.totalEvents > 0
                        ? (stats.upcomingEvents / stats.totalEvents) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
