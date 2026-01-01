import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
    Calendar,
    CreditCard,
    DollarSign,
    Package,
    TrendingUp,
    Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
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
    getOrganizationEvents,
    getOrganizationOverview,
    getOrganizationSales,
} from "../api/dashboard";
import { DashboardLayout } from "../layouts/DashboardLayout";

const OrganizationDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { organizationId } = useParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [overview, setOverview] = useState(null);
    const [events, setEvents] = useState([]);
    const [salesData, setSalesData] = useState({ data: [], total_revenue: 0, total_orders: 0 });
    const [salesPeriod, setSalesPeriod] = useState("month");

    useEffect(() => {
        if (organizationId) {
            fetchDashboardData();
        }
    }, [organizationId]);

    useEffect(() => {
        if (organizationId) {
            fetchSalesData();
        }
    }, [organizationId, salesPeriod]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError("");
        try {
            const [overviewRes, eventsRes] = await Promise.all([
                getOrganizationOverview(organizationId),
                getOrganizationEvents(organizationId),
            ]);

            setOverview(overviewRes);
            setEvents(eventsRes.data || []);
        } catch (err) {
            console.error("Error fetching organization dashboard:", err);
            setError(err.message || t("analytics.fetchError"));
        } finally {
            setLoading(false);
        }
    };

    const fetchSalesData = async () => {
        try {
            const salesRes = await getOrganizationSales(organizationId, salesPeriod);
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
            year: "numeric",
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

    const summary = overview?.summary || {};
    const recent30Days = overview?.recent_30_days || {};

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        {overview?.organization?.name || t("analytics.organizationDashboard")}
                    </h1>
                    <p className="text-muted-foreground">
                        {t("analytics.organizationDashboardDesc") || "Thống kê tổ chức của bạn"}
                    </p>
                </div>

                {/* Summary Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Total Events */}
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {t("analytics.totalEvents") || "Tổng sự kiện"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_events || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {summary.published_events || 0} {t("analytics.published") || "đã xuất bản"} •{" "}
                                {summary.upcoming_events || 0} {t("analytics.upcoming") || "sắp diễn ra"}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Tickets Sold */}
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                {t("analytics.ticketsSold") || "Vé đã bán"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_tickets_sold || 0}</div>
                            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                <TrendingUp className="h-3 w-3" />
                                {recent30Days.orders || 0} {t("analytics.ordersIn30Days") || "đơn trong 30 ngày"}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Revenue */}
                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                {t("analytics.totalRevenue") || "Tổng doanh thu"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{formatPrice(summary.total_revenue)}</div>
                            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                <TrendingUp className="h-3 w-3" />
                                {formatPrice(recent30Days.revenue)} {t("analytics.in30Days") || "trong 30 ngày"}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Balance */}
                    <Card className="border-l-4 border-l-orange-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Wallet className="h-4 w-4" />
                                {t("analytics.availableBalance") || "Số dư khả dụng"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{formatPrice(summary.available_balance)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatPrice(summary.pending_balance)} {t("analytics.pending") || "đang chờ"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatPrice(summary.total_paid_out)} {t("analytics.paidOut") || "đã rút"}
                            </p>
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
                                    {t("analytics.organizationRevenue") || "Doanh thu tổ chức theo thời gian"}
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
                                            <linearGradient id="colorRevenueOrg" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                                            formatter={(value, name) => [
                                                name === "revenue" ? formatPrice(value) : value,
                                                name === "revenue" ? "Doanh thu" : "Đơn hàng",
                                            ]}
                                            labelFormatter={(label) => formatDate(label)}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#10b981"
                                            fillOpacity={1}
                                            fill="url(#colorRevenueOrg)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    {t("analytics.noData") || "Chưa có dữ liệu"}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("analytics.periodRevenue") || "Doanh thu kỳ này"}</p>
                                <p className="text-lg font-bold">{formatPrice(salesData.total_revenue)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t("analytics.periodOrders") || "Đơn hàng kỳ này"}</p>
                                <p className="text-lg font-bold">{salesData.total_orders || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Events List & Recent Orders */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Events with Stats */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        {t("analytics.eventsWithStats") || "Sự kiện"}
                                    </CardTitle>
                                    <CardDescription>
                                        {t("analytics.eventsPerformance") || "Hiệu suất các sự kiện"}
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => navigate("/events-management")}>
                                    {t("common.viewAll") || "Xem tất cả"}
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {events.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    {t("analytics.noEvents") || "Chưa có sự kiện nào"}
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t("analytics.event") || "Sự kiện"}</TableHead>
                                            <TableHead>{t("analytics.status") || "Trạng thái"}</TableHead>
                                            <TableHead className="text-right">{t("analytics.ticketsSold") || "Vé bán"}</TableHead>
                                            <TableHead className="text-right">{t("analytics.revenue") || "Doanh thu"}</TableHead>
                                            <TableHead className="text-right">{t("analytics.checkinRate") || "Check-in"}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {events.slice(0, 5).map((event) => (
                                            <TableRow
                                                key={event.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => navigate(`/dashboard/events/${event.id}`)}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {event.cover_image_url ? (
                                                            <img
                                                                src={event.cover_image_url}
                                                                alt={event.title}
                                                                className="h-10 w-14 rounded object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-14 rounded bg-muted flex items-center justify-center">
                                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="font-medium truncate max-w-[150px]">{event.title}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatDate(event.start_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(event.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    {event.stats?.tickets_sold || 0}/{event.stats?.tickets_total || 0}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatPrice(event.stats?.revenue)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Progress
                                                            value={event.stats?.checkin_rate || 0}
                                                            className="w-16 h-2"
                                                        />
                                                        <span className="text-xs">
                                                            {(event.stats?.checkin_rate || 0).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Orders */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                {t("analytics.recentOrders") || "Đơn hàng gần đây"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {overview?.recent_orders?.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    {t("analytics.noOrders") || "Chưa có đơn hàng nào"}
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {overview?.recent_orders?.slice(0, 5).map((order) => (
                                        <div
                                            key={order.id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/orders/${order.id}`)}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="font-mono text-xs">{order.order_number}</p>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {order.event?.title || "Event"}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatPrice(order.total_amount)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(order.paid_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default OrganizationDashboard;
