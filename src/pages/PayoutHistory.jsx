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
    ArrowLeft,
    Banknote,
    CheckCircle2,
    Clock,
    Loader2,
    RefreshCw,
    XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { getOrganizationPayouts } from "../api/payouts";
import { useAuth } from "../contexts/AuthContext";
import { DashboardLayout } from "../layouts/DashboardLayout";

const STATUS_CONFIG = {
    PENDING: {
        label: "Chờ xử lý",
        labelKey: "payout.status.pending",
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: Clock,
    },
    PROCESSING: {
        label: "Đang xử lý",
        labelKey: "payout.status.processing",
        className: "bg-blue-100 text-blue-800 border-blue-300",
        icon: Loader2,
    },
    COMPLETED: {
        label: "Thành công",
        labelKey: "payout.status.completed",
        className: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle2,
    },
    FAILED: {
        label: "Thất bại",
        labelKey: "payout.status.failed",
        className: "bg-red-100 text-red-800 border-red-300",
        icon: XCircle,
    },
};

const PayoutHistory = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { organizationId } = useParams();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate("/login");
        }
    }, [authLoading, isAuthenticated, navigate]);

    const fetchPayouts = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getOrganizationPayouts(organizationId);
            setPayouts(result || []);
        } catch (err) {
            setError(err.message || t("payout.fetchError") || "Không thể tải lịch sử rút tiền");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && organizationId) {
            fetchPayouts();
        }
    }, [isAuthenticated, organizationId]);

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

    // Stats
    const totalWithdrawn = payouts
        .filter((p) => p.status === "COMPLETED")
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingCount = payouts.filter((p) => p.status === "PENDING").length;

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
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/organizations/${organizationId}`)}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">
                                {t("payout.history.title") || "Lịch Sử Rút Tiền"}
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                {t("payout.history.subtitle") || "Theo dõi các yêu cầu rút tiền của bạn"}
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={fetchPayouts} disabled={loading} className="mt-4 md:mt-0">
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        {t("common.refresh") || "Làm mới"}
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">
                                {t("payout.history.totalWithdrawn") || "Tổng đã rút"}
                            </p>
                            <p className="text-2xl font-bold text-green-600">{formatVND(totalWithdrawn)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">
                                {t("payout.history.totalRequests") || "Tổng yêu cầu"}
                            </p>
                            <p className="text-2xl font-bold">{payouts.length}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">
                                {t("payout.history.pending") || "Đang chờ xử lý"}
                            </p>
                            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Banknote className="h-5 w-5" />
                            {t("payout.history.listTitle") || "Danh sách yêu cầu"}
                        </CardTitle>
                        <CardDescription>
                            {t("payout.history.listDescription") || "Tất cả yêu cầu rút tiền của tổ chức"}
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
                                <p>{t("payout.history.noPayouts") || "Chưa có yêu cầu rút tiền nào"}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t("payout.table.createdAt") || "Ngày tạo"}</TableHead>
                                            <TableHead>{t("payout.table.amount") || "Số tiền"}</TableHead>
                                            <TableHead>{t("payout.table.bank") || "Ngân hàng"}</TableHead>
                                            <TableHead>{t("payout.table.status") || "Trạng thái"}</TableHead>
                                            <TableHead>{t("payout.table.transactionCode") || "Mã GD"}</TableHead>
                                            <TableHead>{t("payout.table.processedAt") || "Ngày xử lý"}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payouts.map((payout) => {
                                            const statusConfig = STATUS_CONFIG[payout.status] || STATUS_CONFIG.PENDING;
                                            const StatusIcon = statusConfig.icon;
                                            return (
                                                <TableRow key={payout.id}>
                                                    <TableCell className="text-sm">
                                                        {formatDate(payout.created_at)}
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
                                                    <TableCell className="text-xs font-mono">
                                                        {payout.transaction_code || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {formatDate(payout.processed_at)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default PayoutHistory;
