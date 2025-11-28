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
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    createTicketType,
    deleteTicketType,
    disableTicketType,
    getTicketTypes,
    updateTicketType,
} from "../api/ticketTypes";

const TicketTypesManager = ({ eventId, eventStartAt, canManage = false }) => {
    const { t } = useTranslation();
    const [ticketTypes, setTicketTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: "", message: "" });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        is_free: false,
        is_donation: false,
        price: "",
        currency: "VND",
        quantity_total: "",
        per_order_min: "1",
        per_order_max: "10",
        sale_start_at: "",
        sale_end_at: "",
        refund_policy_deadline: "",
    });

    useEffect(() => {
        if (eventId) {
            loadTicketTypes();
        }
    }, [eventId]);

    const loadTicketTypes = async () => {
        setLoading(true);
        try {
            const data = await getTicketTypes(eventId, {
                include_inactive: canManage, // Admin có thể xem inactive tickets
            });
            setTicketTypes(data || []);
        } catch (error) {
            console.error("Error loading ticket types:", error);
            showAlert("error", t("ticketTypes.messages.loadError"));
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert({ type: "", message: "" }), 3000);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            is_free: false,
            is_donation: false,
            price: "",
            currency: "VND",
            quantity_total: "",
            per_order_min: "1",
            per_order_max: "10",
            sale_start_at: "",
            sale_end_at: "",
            refund_policy_deadline: "",
        });
        setEditingTicket(null);
    };

    const handleCreate = () => {
        resetForm();
        setDialogOpen(true);
    };

    const handleEdit = (ticket) => {
        setEditingTicket(ticket);
        setFormData({
            name: ticket.name || "",
            description: ticket.description || "",
            is_free: ticket.is_free || false,
            is_donation: ticket.is_donation || false,
            price: ticket.price || "",
            currency: ticket.currency || "VND",
            quantity_total: ticket.quantity_total?.toString() || "",
            per_order_min: ticket.per_order_min?.toString() || "1",
            per_order_max: ticket.per_order_max?.toString() || "10",
            sale_start_at: ticket.sale_start_at
                ? ticket.sale_start_at.slice(0, 16)
                : "",
            sale_end_at: ticket.sale_end_at ? ticket.sale_end_at.slice(0, 16) : "",
            refund_policy_deadline: ticket.refund_policy_deadline
                ? ticket.refund_policy_deadline.slice(0, 16)
                : "",
        });
        setDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                name: formData.name,
                is_free: formData.is_free,
                is_donation: formData.is_donation,
                currency: formData.currency,
                quantity_total: parseInt(formData.quantity_total),
                per_order_min: parseInt(formData.per_order_min),
                per_order_max: parseInt(formData.per_order_max),
                sale_start_at: new Date(formData.sale_start_at).toISOString(),
                sale_end_at: new Date(formData.sale_end_at).toISOString(),
            };

            if (formData.description) payload.description = formData.description;
            if (!formData.is_free && !formData.is_donation)
                payload.price = parseFloat(formData.price);
            if (formData.refund_policy_deadline) {
                payload.refund_policy_deadline = new Date(
                    formData.refund_policy_deadline
                ).toISOString();
            }

            if (editingTicket) {
                await updateTicketType(eventId, editingTicket.id, payload);
                showAlert("success", t("ticketTypes.messages.updateSuccess"));
            } else {
                await createTicketType(eventId, payload);
                showAlert("success", t("ticketTypes.messages.createSuccess"));
            }

            setDialogOpen(false);
            resetForm();
            loadTicketTypes();
        } catch (error) {
            const message =
                error.message ||
                (editingTicket
                    ? t("ticketTypes.messages.updateError")
                    : t("ticketTypes.messages.createError"));
            showAlert("error", message);
        }
    };

    const handleDisable = async (ticketId, currentStatus) => {
        try {
            if (currentStatus) {
                // Enable lại
                await updateTicketType(eventId, ticketId, { is_active: true });
                showAlert("success", t("ticketTypes.messages.activateSuccess"));
            } else {
                // Disable
                await disableTicketType(eventId, ticketId, t("ticketTypes.messages.disabledByAdmin"));
                showAlert("success", t("ticketTypes.messages.deactivateSuccess"));
            }
            loadTicketTypes();
        } catch (error) {
            showAlert("error", t("ticketTypes.messages.statusChangeError"));
        }
    };

    const handleDelete = async (ticketId, ticketName) => {
        if (!window.confirm(t("ticketTypes.messages.deleteConfirm", { name: ticketName }))) {
            return;
        }

        try {
            await deleteTicketType(eventId, ticketId);
            showAlert("success", t("ticketTypes.messages.deleteSuccess"));
            loadTicketTypes();
        } catch (error) {
            showAlert("error", error.message || t("ticketTypes.messages.deleteError"));
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(parseFloat(price));
    };

    const getSaleBadge = (ticket) => {
        if (!ticket.is_active) return <Badge variant="secondary">{t("ticketTypes.status.inactive")}</Badge>;
        if (ticket.is_sold_out) return <Badge variant="destructive">{t("ticketTypes.status.soldOut")}</Badge>;
        if (ticket.is_on_sale) return <Badge variant="default">{t("ticketTypes.status.onSale")}</Badge>;

        const now = new Date();
        const saleStart = new Date(ticket.sale_start_at);
        const saleEnd = new Date(ticket.sale_end_at);

        if (now < saleStart) return <Badge variant="outline">{t("ticketTypes.status.upcoming")}</Badge>;
        if (now > saleEnd) return <Badge variant="secondary">{t("ticketTypes.status.ended")}</Badge>;

        return <Badge variant="outline">{t("ticketTypes.status.unavailable")}</Badge>;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t("ticketTypes.title")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">{t("ticketTypes.loading")}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{t("ticketTypes.title")}</CardTitle>
                        <CardDescription>{t("ticketTypes.subtitle")}</CardDescription>
                    </div>
                    {canManage && (
                        <Button onClick={handleCreate} className="gap-2">
                            <Plus className="h-4 w-4" />
                            {t("ticketTypes.addTicket")}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {alert.message && (
                    <Alert
                        variant={alert.type === "error" ? "destructive" : "default"}
                        className="mb-4"
                    >
                        <AlertDescription>{alert.message}</AlertDescription>
                    </Alert>
                )}

                {ticketTypes.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        {canManage
                            ? t("ticketTypes.noTicketsDescription")
                            : t("ticketTypes.noTickets")}
                    </p>
                ) : (
                    <div className="space-y-4">
                        {ticketTypes.map((ticket) => (
                            <div
                                key={ticket.id}
                                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold">{ticket.name}</h3>
                                            {getSaleBadge(ticket)}
                                        </div>

                                        {ticket.description && (
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                                                {ticket.description}
                                            </p>
                                        )}

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">{t("ticketTypes.labels.price")}</p>
                                                <p className="font-medium">
                                                    {ticket.is_free ? (
                                                        <Badge variant="outline">{t("ticketTypes.labels.free")}</Badge>
                                                    ) : ticket.is_donation ? (
                                                        <Badge variant="outline">{t("ticketTypes.labels.donation")}</Badge>
                                                    ) : (
                                                        `${formatPrice(ticket.price)} ${ticket.currency}`
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-gray-500">{t("ticketTypes.labels.sold")}</p>
                                                <p className="font-medium">
                                                    {ticket.quantity_sold} / {ticket.quantity_total}
                                                    <span className="text-xs text-gray-500 ml-1">
                                                        ({ticket.percentage_sold}%)
                                                    </span>
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-gray-500">{t("ticketTypes.labels.remaining")}</p>
                                                <p className="font-medium">
                                                    {ticket.quantity_available}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-gray-500">{t("ticketTypes.labels.perOrder")}</p>
                                                <p className="font-medium">
                                                    {ticket.per_order_min} - {ticket.per_order_max}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {canManage && (
                                        <div className="flex gap-2 ml-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(ticket)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleDisable(ticket.id, !ticket.is_active)
                                                }
                                                title={ticket.is_active ? t("ticketTypes.actions.deactivate") : t("ticketTypes.actions.activate")}
                                            >
                                                {ticket.is_active ? (
                                                    <ToggleRight className="h-4 w-4" />
                                                ) : (
                                                    <ToggleLeft className="h-4 w-4" />
                                                )}
                                            </Button>
                                            {ticket.quantity_sold === 0 && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(ticket.id, ticket.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create/Edit Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingTicket ? t("ticketTypes.dialog.editTitle") : t("ticketTypes.dialog.createTitle")}
                            </DialogTitle>
                            <DialogDescription>
                                {t("ticketTypes.dialog.description")}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div>
                                <Label htmlFor="name">
                                    {t("ticketTypes.name")} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder={t("ticketTypes.namePlaceholder")}
                                    required
                                    minLength={3}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="description">{t("ticketTypes.description")}</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    placeholder={t("ticketTypes.descriptionPlaceholder")}
                                    rows={3}
                                />
                            </div>

                            {/* Pricing Type */}
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_free}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                is_free: e.target.checked,
                                                is_donation: false,
                                            })
                                        }
                                    />
                                    <span>{t("ticketTypes.isFree")}</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_donation}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                is_donation: e.target.checked,
                                                is_free: false,
                                            })
                                        }
                                    />
                                    <span>{t("ticketTypes.isDonation")}</span>
                                </label>
                            </div>

                            {/* Price */}
                            {!formData.is_free && !formData.is_donation && (
                                <div>
                                    <Label htmlFor="price">
                                        {t("ticketTypes.price")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) =>
                                            setFormData({ ...formData, price: e.target.value })
                                        }
                                        placeholder={t("ticketTypes.pricePlaceholder")}
                                        required
                                        min="0"
                                    />
                                </div>
                            )}

                            {/* Quantity */}
                            <div>
                                <Label htmlFor="quantity_total">
                                    {t("ticketTypes.quantityTotal")} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="quantity_total"
                                    type="number"
                                    value={formData.quantity_total}
                                    onChange={(e) =>
                                        setFormData({ ...formData, quantity_total: e.target.value })
                                    }
                                    placeholder={t("ticketTypes.quantityTotalPlaceholder")}
                                    required
                                    min="1"
                                />
                            </div>

                            {/* Per Order Limits */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="per_order_min">{t("ticketTypes.perOrderMin")}</Label>
                                    <Input
                                        id="per_order_min"
                                        type="number"
                                        value={formData.per_order_min}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                per_order_min: e.target.value,
                                            })
                                        }
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="per_order_max">{t("ticketTypes.perOrderMax")}</Label>
                                    <Input
                                        id="per_order_max"
                                        type="number"
                                        value={formData.per_order_max}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                per_order_max: e.target.value,
                                            })
                                        }
                                        min="1"
                                    />
                                </div>
                            </div>

                            {/* Sale Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="sale_start_at">
                                        {t("ticketTypes.saleStartAt")} <span className="text-red-500">*</span>
                                    </Label>
                                    <DateTimePicker
                                        date={formData.sale_start_at}
                                        setDate={(date) =>
                                            setFormData((prev) => ({ ...prev, sale_start_at: date }))
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="sale_end_at">
                                        {t("ticketTypes.saleEndAt")} <span className="text-red-500">*</span>
                                    </Label>
                                    <DateTimePicker
                                        date={formData.sale_end_at}
                                        setDate={(date) =>
                                            setFormData((prev) => ({ ...prev, sale_end_at: date }))
                                        }
                                    />
                                </div>
                            </div>

                            {/* Refund Deadline */}
                            <div>
                                <Label htmlFor="refund_policy_deadline">
                                    {t("ticketTypes.refundPolicyDeadline")}
                                </Label>
                                <DateTimePicker
                                    date={formData.refund_policy_deadline}
                                    setDate={(date) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            refund_policy_deadline: date,
                                        }))
                                    }
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                >
                                    {t("ticketTypes.actions.cancel")}
                                </Button>
                                <Button type="submit">
                                    {editingTicket ? t("ticketTypes.actions.update") : t("ticketTypes.actions.create")}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default TicketTypesManager;
