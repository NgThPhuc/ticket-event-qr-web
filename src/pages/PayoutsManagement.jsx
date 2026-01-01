import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
    Banknote,
    Building2,
    CheckCircle2,
    Clock,
    Loader2,
    RefreshCw,
    XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getAllPayouts, matureShares, processPayout } from "../api/payouts";
import { useAuth } from "../contexts/AuthContext";
import { DashboardLayout } from "../layouts/DashboardLayout";

const STATUS_CONFIG = {
    PENDING: {
        label: "Chờ xử lý",
        labelKey: "payout.status.pending",
        variant: "outline",
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: Clock,
    },
    PROCESSING: {
        label: "Đang xử lý",
        labelKey: "payout.status.processing",
        variant: "outline",
        className: "bg-blue-100 text-blue-800 border-blue-300",
        icon: Loader2,
    },
    COMPLETED: {
        label: "Thành công",
        labelKey: "payout.status.completed",
        variant: "outline",
        className: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle2,
    },
    FAILED: {
        label: "Thất bại",
        labelKey: "payout.status.failed",
        variant: "outline",
        className: "bg-red-100 text-red-800 border-red-300",
        icon: XCircle,
    },
};

const TABS = [
    { key: "all", labelKey: "payout.tabs.all", label: "Tất cả" },
    { key: "PENDING", labelKey: "payout.tabs.pending", label: "Chờ xử lý" },
    { key: "PROCESSING", labelKey: "payout.tabs.processing", label: "Đang xử lý" },
    { key: "COMPLETED", labelKey: "payout.tabs.completed", label: "Thành công" },
    { key: "FAILED", labelKey: "payout.tabs.failed", label: "Thất bại" },
];

const PayoutsManagement = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("PENDING");
    const [processingId, setProcessingId] = useState(null);
    const [maturingShares, setMaturingShares] = useState(false);
    const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, total_pages: 1 });
    const [stats, setStats] = useState({
        PENDING: 0,
        PROCESSING: 0,
        COMPLETED: 0,
        FAILED: 0
    });

    // Check admin permission
    const isPlatformAdmin = user?.platform_role === "PLATFORM_ADMIN";

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !isPlatformAdmin)) {
            navigate("/dashboard");
        }
    }, [authLoading, isAuthenticated, isPlatformAdmin, navigate]);

    // Fetch stats cho mỗi trạng thái
    const fetchStats = async () => {
        try {
            const statuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"];
            const newStats = {};
            
            for (const status of statuses) {
                const result = await getAllPayouts({ status, limit: 1 });
                newStats[status] = result.meta?.total || 0;
            }
            
            setStats(newStats);
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    const fetchPayouts = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page: meta.page,
                limit: 20,
            };
            if (activeTab !== "all") {
                params.status = activeTab;
            }
            const result = await getAllPayouts(params);
            setPayouts(result.data || []);
            setMeta(result.meta || { total: 0, page: 1, limit: 20, total_pages: 1 });
        } catch (err) {
            setError(err.message || t("payout.fetchError") || "Không thể tải danh sách payout");
        } finally {
            setLoading(false);
        }
    };

    // Fetch stats khi component mount
    useEffect(() => {
        if (isAuthenticated && isPlatformAdmin) {
            fetchStats();
        }
    }, [isAuthenticated, isPlatformAdmin]);

    useEffect(() => {
        if (isAuthenticated && isPlatformAdmin) {
            fetchPayouts();
        }
    }, [isAuthenticated, isPlatformAdmin, activeTab, meta.page]);

    const handleProcess = async (payoutId) => {
        if (!confirm(t("payout.processConfirm") || "Xác nhận thanh toán cho yêu cầu này?")) {
            return;
        }

        setProcessingId(payoutId);
        try {
            await processPayout(payoutId);
            await fetchPayouts();
            await fetchStats(); // Cập nhật lại stats
        } catch (err) {
            setError(err.message || t("payout.processError") || "Không thể xử lý thanh toán");
        } finally {
            setProcessingId(null);
        }
    };

    const handleMatureShares = async () => {
        setMaturingShares(true);
        try {
            const result = await matureShares();
            alert(t("payout.matureSuccess", { count: result.matured }) || `Đã mature ${result.matured} revenue shares`);
            await fetchPayouts();
            await fetchStats(); // Cập nhật lại stats
        } catch (err) {
            setError(err.message || "Không thể mature shares");
        } finally {
            setMaturingShares(false);
        }
    };

    const formatVND = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const maskBankAccount = (account) => {
        if (!account || account.length <= 4) return account || "-";
        return "*".repeat(account.length - 4) + account.slice(-4);
    };

    if (authLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            {t("payout.management.title") || "Quản Lý Payouts"}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {t("payout.management.subtitle") || "Xử lý các yêu cầu rút tiền từ tổ chức"}
                        </p>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                        <Button
                            variant="outline"
                            onClick={handleMatureShares}
                            disabled={maturingShares}
                        >
                            {maturingShares ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            {t("payout.matureButton") || "Mature Shares"}
                        </Button>
                        <Button variant="outline" onClick={fetchPayouts} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            {t("common.refresh") || "Làm mới"}
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                    {TABS.slice(1).map((tab) => {
                        const config = STATUS_CONFIG[tab.key];
                        const Icon = config?.icon || Clock;
                        return (
                            <Card
                                key={tab.key}
                                className={`cursor-pointer transition-all ${activeTab === tab.key ? "ring-2 ring-primary" : "hover:shadow-md"}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${config?.className || ""}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {t(tab.labelKey) || tab.label}
                                        </p>
                                        <p className="text-xl font-bold">
                                            {stats[tab.key] || 0}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {TABS.map((tab) => (
                        <Button
                            key={tab.key}
                            variant={activeTab === tab.key ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                setActiveTab(tab.key);
                                setMeta(prev => ({ ...prev, page: 1 }));
                            }}
                        >
                            {t(tab.labelKey) || tab.label}
                        </Button>
                    ))}
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Banknote className="h-5 w-5" />
                            {t("payout.list.title") || "Danh sách yêu cầu rút tiền"}
                        </CardTitle>
                        <CardDescription>
                            {t("payout.list.description") || `Hiển thị ${payouts.length} / ${meta.total} yêu cầu`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : payouts.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>{t("payout.noPayouts") || "Không có yêu cầu nào"}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t("payout.table.organization") || "Tổ chức"}</TableHead>
                                            <TableHead>{t("payout.table.amount") || "Số tiền"}</TableHead>
                                            <TableHead>{t("payout.table.bank") || "Ngân hàng"}</TableHead>
                                            <TableHead>{t("payout.table.status") || "Trạng thái"}</TableHead>
                                            <TableHead>{t("payout.table.createdAt") || "Ngày tạo"}</TableHead>
                                            <TableHead>{t("payout.table.transactionCode") || "Mã GD"}</TableHead>
                                            <TableHead className="text-right">{t("payout.table.actions") || "Thao tác"}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payouts.map((payout) => {
                                            const statusConfig = STATUS_CONFIG[payout.status] || STATUS_CONFIG.PENDING;
                                            const StatusIcon = statusConfig.icon;
                                            return (
                                                <TableRow key={payout.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <p className="font-medium">{payout.organization?.name || "-"}</p>
                                                                <p className="text-xs text-muted-foreground">{payout.account_holder}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-primary">
                                                        {formatVND(payout.amount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{payout.bank_name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {maskBankAccount(payout.bank_account)}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={statusConfig.className}>
                                                            <StatusIcon className="h-3 w-3 mr-1" />
                                                            {t(statusConfig.labelKey) || statusConfig.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {formatDate(payout.created_at)}
                                                    </TableCell>
                                                    <TableCell className="text-xs font-mono">
                                                        {payout.transaction_code || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {payout.status === "PENDING" && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleProcess(payout.id)}
                                                                disabled={processingId === payout.id}
                                                            >
                                                                {processingId === payout.id ? (
                                                                    <>
                                                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                                        {t("payout.processing") || "Đang xử lý..."}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                                                        {t("payout.processButton") || "Thanh toán"}
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Pagination */}
                        {meta.total_pages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={meta.page <= 1}
                                    onClick={() => setMeta(prev => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    {t("common.prev") || "Trước"}
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {meta.page} / {meta.total_pages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={meta.page >= meta.total_pages}
                                    onClick={() => setMeta(prev => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    {t("common.next") || "Sau"}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default PayoutsManagement;
