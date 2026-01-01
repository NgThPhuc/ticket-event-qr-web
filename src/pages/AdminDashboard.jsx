import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertCircle,
    ArrowRight,
    Building2,
    Calendar,
    CreditCard,
    DollarSign,
    TrendingUp,
    Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    getAdminEvents,
    getAdminOrganizations,
    getAdminOverview,
    getAdminSales,
} from "../api/dashboard";
import { DashboardLayout } from "../layouts/DashboardLayout";

const AdminDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [overview, setOverview] = useState(null);
    const [topOrganizations, setTopOrganizations] = useState([]);
    const [topEvents, setTopEvents] = useState([]);
    const [salesData, setSalesData] = useState({ data: [], total: {} });
    const [salesPeriod, setSalesPeriod] = useState("month");

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        fetchSalesData();
    }, [salesPeriod]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError("");
        try {
            const [overviewRes, orgsRes, eventsRes] = await Promise.all([
                getAdminOverview(),
                getAdminOrganizations(10),
                getAdminEvents(10, "month"),
            ]);

            setOverview(overviewRes);
            setTopOrganizations(orgsRes.data || []);
            setTopEvents(eventsRes.data || []);
        } catch (err) {
            console.error("Error fetching admin dashboard:", err);
            setError(err.message || t("analytics.fetchError"));
        } finally {
            setLoading(false);
        }
    };

    const fetchSalesData = async () => {
        try {
            const salesRes = await getAdminSales(salesPeriod);
            setSalesData(salesRes);
        } catch (err) {
            console.error("Error fetching sales data:", err);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(price || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "short",
        });
    };

    const formatChartDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (salesPeriod === "day") {
            return date.toLocaleTimeString("vi-VN", { hour: "2-digit" });
        }
        return date.toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
    };

    if (loading) {
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

    if (error) {
        return (
            <DashboardLayout>
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <p className="text-destructive">{error}</p>
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
                        {t("analytics.adminDashboard") || "Platform Dashboard"}
                    </h1>
                    <p className="text-muted-foreground">
                        {t("analytics.adminDashboardDesc") || "Tổng quan toàn bộ hệ thống"}
                    </p>
                </div>

                {/* Overview Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {/* Users */}
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {t("analytics.totalUsers") || "Người dùng"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overview?.users?.total || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {overview?.users?.verified || 0} {t("analytics.verified") || "đã xác thực"}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                                +{overview?.users?.new_this_month || 0} {t("analytics.thisMonth") || "tháng này"}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Organizations */}
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                {t("analytics.organizations") || "Tổ chức"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overview?.organizations?.total || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {overview?.organizations?.active || 0} {t("analytics.active") || "đang hoạt động"}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Events */}
                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {t("analytics.events") || "Sự kiện"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overview?.events?.total || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {overview?.events?.published || 0} {t("analytics.published") || "đã xuất bản"}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                {overview?.events?.upcoming || 0} {t("analytics.upcoming") || "sắp diễn ra"}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Orders This Month */}
                    <Card className="border-l-4 border-l-orange-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                {t("analytics.ordersThisMonth") || "Đơn hàng tháng này"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overview?.orders?.this_month || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {overview?.orders?.total || 0} {t("analytics.totalOrders") || "tổng cộng"}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Revenue This Month */}
                    <Card className="border-l-4 border-l-pink-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                {t("analytics.revenueThisMonth") || "Doanh thu tháng này"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">
                                {formatPrice(overview?.orders?.revenue_this_month)}
                            </div>
                            {overview?.payouts?.pending > 0 && (
                                <p className="text-xs text-orange-600 mt-1">
                                    {overview?.payouts?.pending} {t("analytics.pendingPayouts") || "payout chờ xử lý"}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sales Chart */}
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    {t("analytics.salesTrend") || "Xu hướng doanh thu"}
                                </CardTitle>
                                <CardDescription>
                                    {t("analytics.platformRevenue") || "Doanh thu toàn nền tảng"}
                                </CardDescription>
                            </div>
                            <Select value={salesPeriod} onValueChange={setSalesPeriod}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="day">{t("analytics.period.day") || "Theo ngày"}</SelectItem>
                                    <SelectItem value="week">{t("analytics.period.week") || "Theo tuần"}</SelectItem>
                                    <SelectItem value="month">{t("analytics.period.month") || "Theo tháng"}</SelectItem>
                                    <SelectItem value="year">{t("analytics.period.year") || "Theo năm"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {salesData.data?.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={salesData.data}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatChartDate}
                                            className="text-xs"
                                        />
                                        <YAxis
                                            tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                                            className="text-xs"
                                        />
                                        <Tooltip
                                            formatter={(value) => [formatPrice(value), "Doanh thu"]}
                                            labelFormatter={(label) => formatDate(label)}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#8884d8"
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    {t("analytics.noData") || "Chưa có dữ liệu"}
                                </div>
                            )}
                        </div>
                        {salesData.total && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t("analytics.totalRevenue") || "Tổng doanh thu"}</p>
                                    <p className="text-lg font-bold">{formatPrice(salesData.total.revenue)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t("analytics.totalOrders") || "Tổng đơn hàng"}</p>
                                    <p className="text-lg font-bold">{salesData.total.orders || 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t("analytics.totalTickets") || "Tổng vé"}</p>
                                    <p className="text-lg font-bold">{salesData.total.tickets || 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t("analytics.platformFee") || "Phí nền tảng"}</p>
                                    <p className="text-lg font-bold">{formatPrice(salesData.total.platform_fee)}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Organizations & Events */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Organizations */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-primary" />
                                        {t("analytics.topOrganizations") || "Top tổ chức"}
                                    </CardTitle>
                                    <CardDescription>
                                        {t("analytics.byRevenue") || "Theo doanh thu"}
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => navigate("/organizations")}>
                                    {t("common.viewAll") || "Xem tất cả"}
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {topOrganizations.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    {t("analytics.noOrganizations") || "Chưa có tổ chức nào"}
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t("analytics.organization") || "Tổ chức"}</TableHead>
                                            <TableHead className="text-right">{t("analytics.events") || "Sự kiện"}</TableHead>
                                            <TableHead className="text-right">{t("analytics.revenue") || "Doanh thu"}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topOrganizations.slice(0, 5).map((org, index) => (
                                            <TableRow
                                                key={org.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => navigate(`/organizations/${org.id}`)}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                                                            {index + 1}
                                                        </Badge>
                                                        <span className="font-medium truncate max-w-[150px]">{org.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{org.total_events || 0}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatPrice(org.total_revenue)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Events */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        {t("analytics.topEvents") || "Top sự kiện"}
                                    </CardTitle>
                                    <CardDescription>
                                        {t("analytics.byRevenue") || "Theo doanh thu"}
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => navigate("/events-management")}>
                                    {t("common.viewAll") || "Xem tất cả"}
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {topEvents.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    {t("analytics.noEvents") || "Chưa có sự kiện nào"}
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t("analytics.event") || "Sự kiện"}</TableHead>
                                            <TableHead className="text-right">{t("analytics.ticketsSold") || "Vé bán"}</TableHead>
                                            <TableHead className="text-right">{t("analytics.revenue") || "Doanh thu"}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topEvents.slice(0, 5).map((event, index) => (
                                            <TableRow
                                                key={event.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => navigate(`/events/${event.id}`)}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                                                            {index + 1}
                                                        </Badge>
                                                        <div className="min-w-0">
                                                            <p className="font-medium truncate max-w-[120px]">{event.title}</p>
                                                            <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                                                                {event.organization_name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{event.tickets_sold || 0}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatPrice(event.revenue)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
