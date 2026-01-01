import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    ExternalLink,
    Package,
    Ticket,
    XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { getEventOverview, getEventSales } from "../api/dashboard";
import { DashboardLayout } from "../layouts/DashboardLayout";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00C49F", "#FFBB28"];

const EventDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { eventId } = useParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [overview, setOverview] = useState(null);
    const [salesData, setSalesData] = useState({ by_ticket_type: [], by_date: [] });

    useEffect(() => {
        if (eventId) {
            fetchDashboardData();
        }
    }, [eventId]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError("");
        try {
            const [overviewRes, salesRes] = await Promise.all([
                getEventOverview(eventId),
                getEventSales(eventId),
            ]);

            setOverview(overviewRes);
            setSalesData(salesRes);
        } catch (err) {
            console.error("Error fetching event dashboard:", err);
            setError(err.message || t("analytics.fetchError"));
        } finally {
            setLoading(false);
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
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatChartDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "short",
        });
    };

    const getStatusBadge = (status) => {
        const config = {
            DRAFT: { variant: "secondary", icon: Clock },
            SCHEDULED: { variant: "outline", icon: Clock },
            PUBLISHED: { variant: "default", icon: CheckCircle2 },
            CANCELLED: { variant: "destructive", icon: XCircle },
            COMPLETED: { variant: "success", icon: CheckCircle2 },
        };
        const { variant, icon: Icon } = config[status] || { variant: "secondary", icon: Clock };
        return (
            <Badge variant={variant} className="gap-1">
                <Icon className="h-3 w-3" />
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

    const event = overview?.event || {};
    const sales = overview?.sales || {};
    const checkin = overview?.checkin || {};
    const ticketTypes = overview?.ticket_types || [];

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                {/* Back Button & Header */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-4"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t("common.back") || "Quay lại"}
                    </Button>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-foreground">
                                    {event.title || t("analytics.eventDashboard")}
                                </h1>
                                {getStatusBadge(event.status)}
                            </div>
                            <p className="text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {formatDate(event.start_at)}
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => navigate(`/e/${event.slug}`)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t("analytics.viewEventPage") || "Xem trang sự kiện"}
                        </Button>
                    </div>
                </div>

                {/* Sales & Check-in Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Total Orders */}
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                {t("analytics.orders") || "Đơn hàng"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{sales.total_orders || 0}</div>
                            <div className="flex items-center gap-2 text-xs mt-1">
                                <span className="text-green-600">{sales.paid_orders || 0} {t("analytics.paid") || "đã thanh toán"}</span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-red-600">{sales.cancelled_orders || 0} {t("analytics.cancelled") || "đã hủy"}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tickets Sold */}
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Ticket className="h-4 w-4" />
                                {t("analytics.ticketsSold") || "Vé đã bán"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {sales.tickets_sold || 0}
                                <span className="text-base font-normal text-muted-foreground">
                                    /{sales.tickets_total || 0}
                                </span>
                            </div>
                            <Progress
                                value={
                                    sales.tickets_total > 0
                                        ? (sales.tickets_sold / sales.tickets_total) * 100
                                        : 0
                                }
                                className="h-2 mt-2"
                            />
                        </CardContent>
                    </Card>

                    {/* Total Revenue */}
                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                {t("analytics.revenue") || "Doanh thu"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{formatPrice(sales.total_revenue)}</div>
                        </CardContent>
                    </Card>

                    {/* Check-in Rate */}
                    <Card className="border-l-4 border-l-orange-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                {t("analytics.checkin") || "Check-in"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(checkin.checkin_rate || 0).toFixed(1)}%
                            </div>
                            <div className="flex items-center gap-2 text-xs mt-1">
                                <span className="text-green-600">{checkin.total_checked_in || 0} {t("analytics.checkedIn") || "đã check-in"}</span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground">{checkin.not_checked_in || 0} {t("analytics.notCheckedIn") || "chưa"}</span>
                            </div>
                            <Progress value={checkin.checkin_rate || 0} className="h-2 mt-2" />
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Revenue by Ticket Type */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {t("analytics.revenueByTicketType") || "Doanh thu theo loại vé"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {ticketTypes.length === 0 ? (
                                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                    {t("analytics.noData") || "Chưa có dữ liệu"}
                                </div>
                            ) : (
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={ticketTypes}
                                                dataKey="revenue"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label={({ name, percent }) =>
                                                    `${name} (${(percent * 100).toFixed(0)}%)`
                                                }
                                            >
                                                {ticketTypes.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS[index % COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => formatPrice(value)}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Sales Trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {t("analytics.salesByDate") || "Doanh thu theo ngày"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {salesData.by_date?.length === 0 ? (
                                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                    {t("analytics.noData") || "Chưa có dữ liệu"}
                                </div>
                            ) : (
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={salesData.by_date}>
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
                                                labelFormatter={formatChartDate}
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#8884d8"
                                                strokeWidth={2}
                                                name="Doanh thu"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="orders"
                                                stroke="#82ca9d"
                                                strokeWidth={2}
                                                name="Đơn hàng"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Ticket Types Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {t("analytics.ticketTypesBreakdown") || "Chi tiết loại vé"}
                        </CardTitle>
                        <CardDescription>
                            {t("analytics.soldVsTotal") || "Số vé đã bán và tổng số vé"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {ticketTypes.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                {t("analytics.noTicketTypes") || "Chưa có loại vé nào"}
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {ticketTypes.map((tt, index) => (
                                    <div key={tt.id || index}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                                <span className="font-medium">{tt.name}</span>
                                                <Badge variant="outline">{formatPrice(tt.price)}</Badge>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatPrice(tt.revenue)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {tt.sold || 0}/{tt.total || 0} {t("analytics.sold") || "vé"}
                                                </p>
                                            </div>
                                        </div>
                                        <Progress
                                            value={tt.total > 0 ? (tt.sold / tt.total) * 100 : 0}
                                            className="h-2"
                                        />
                                        {index < ticketTypes.length - 1 && <Separator className="my-4" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sales by Ticket Type Bar Chart */}
                {salesData.by_ticket_type?.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {t("analytics.salesComparison") || "So sánh doanh thu loại vé"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={salesData.by_ticket_type}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="name" className="text-xs" />
                                        <YAxis
                                            tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                                            className="text-xs"
                                        />
                                        <Tooltip formatter={(value) => formatPrice(value)} />
                                        <Bar dataKey="revenue" fill="#8884d8" name="Doanh thu">
                                            {salesData.by_ticket_type.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default EventDashboard;
