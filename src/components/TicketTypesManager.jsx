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
      showAlert("error", "Không thể tải danh sách vé");
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
        showAlert("success", "Cập nhật loại vé thành công");
      } else {
        await createTicketType(eventId, payload);
        showAlert("success", "Tạo loại vé thành công");
      }

      setDialogOpen(false);
      resetForm();
      loadTicketTypes();
    } catch (error) {
      const message =
        error.message ||
        (editingTicket
          ? "Không thể cập nhật loại vé"
          : "Không thể tạo loại vé");
      showAlert("error", message);
    }
  };

  const handleDisable = async (ticketId, currentStatus) => {
    try {
      if (currentStatus) {
        // Enable lại
        await updateTicketType(eventId, ticketId, { is_active: true });
        showAlert("success", "Đã kích hoạt lại loại vé");
      } else {
        // Disable
        await disableTicketType(eventId, ticketId, "Disabled by admin");
        showAlert("success", "Đã vô hiệu hóa loại vé");
      }
      loadTicketTypes();
    } catch (error) {
      showAlert("error", "Không thể thay đổi trạng thái");
    }
  };

  const handleDelete = async (ticketId, ticketName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa loại vé "${ticketName}"?`)) {
      return;
    }

    try {
      await deleteTicketType(eventId, ticketId);
      showAlert("success", "Xóa loại vé thành công");
      loadTicketTypes();
    } catch (error) {
      showAlert("error", error.message || "Không thể xóa loại vé");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(parseFloat(price));
  };

  const getSaleBadge = (ticket) => {
    if (!ticket.is_active) return <Badge variant="secondary">Inactive</Badge>;
    if (ticket.is_sold_out) return <Badge variant="destructive">Hết vé</Badge>;
    if (ticket.is_on_sale) return <Badge variant="default">Đang bán</Badge>;

    const now = new Date();
    const saleStart = new Date(ticket.sale_start_at);
    const saleEnd = new Date(ticket.sale_end_at);

    if (now < saleStart) return <Badge variant="outline">Sắp mở bán</Badge>;
    if (now > saleEnd) return <Badge variant="secondary">Kết thúc</Badge>;

    return <Badge variant="outline">Không khả dụng</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loại Vé</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Đang tải...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Loại Vé</CardTitle>
            <CardDescription>Quản lý các loại vé cho sự kiện</CardDescription>
          </div>
          {canManage && (
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm Loại Vé
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
              ? 'Chưa có loại vé nào. Nhấn "Thêm Loại Vé" để tạo mới.'
              : "Chưa có loại vé"}
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
                        <p className="text-gray-500">Giá</p>
                        <p className="font-medium">
                          {ticket.is_free ? (
                            <Badge variant="outline">MIỄN PHÍ</Badge>
                          ) : ticket.is_donation ? (
                            <Badge variant="outline">TỰ NGUYỆN</Badge>
                          ) : (
                            `${formatPrice(ticket.price)} ${ticket.currency}`
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Đã bán</p>
                        <p className="font-medium">
                          {ticket.quantity_sold} / {ticket.quantity_total}
                          <span className="text-xs text-gray-500 ml-1">
                            ({ticket.percentage_sold}%)
                          </span>
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Còn lại</p>
                        <p className="font-medium">
                          {ticket.quantity_available}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Số lượng/đơn</p>
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
                        title={ticket.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
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
                {editingTicket ? "Chỉnh Sửa Loại Vé" : "Thêm Loại Vé Mới"}
              </DialogTitle>
              <DialogDescription>
                Điền thông tin loại vé cho sự kiện
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <Label htmlFor="name">
                  Tên loại vé <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="VIP, Standard, Early Bird..."
                  required
                  minLength={3}
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Mô tả về loại vé này..."
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
                  <span>Miễn phí</span>
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
                  <span>Tự nguyện</span>
                </label>
              </div>

              {/* Price */}
              {!formData.is_free && !formData.is_donation && (
                <div>
                  <Label htmlFor="price">
                    Giá vé (VNĐ) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="500000"
                    required
                    min="0"
                  />
                </div>
              )}

              {/* Quantity */}
              <div>
                <Label htmlFor="quantity_total">
                  Tổng số lượng vé <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity_total"
                  type="number"
                  value={formData.quantity_total}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity_total: e.target.value })
                  }
                  placeholder="100"
                  required
                  min="1"
                />
              </div>

              {/* Per Order Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="per_order_min">Tối thiểu/đơn</Label>
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
                  <Label htmlFor="per_order_max">Tối đa/đơn</Label>
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
                    Bắt đầu bán <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sale_start_at"
                    type="datetime-local"
                    value={formData.sale_start_at}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sale_start_at: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sale_end_at">
                    Kết thúc bán <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sale_end_at"
                    type="datetime-local"
                    value={formData.sale_end_at}
                    onChange={(e) =>
                      setFormData({ ...formData, sale_end_at: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Refund Deadline */}
              <div>
                <Label htmlFor="refund_policy_deadline">
                  Hạn hoàn tiền (tùy chọn)
                </Label>
                <Input
                  id="refund_policy_deadline"
                  type="datetime-local"
                  value={formData.refund_policy_deadline}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      refund_policy_deadline: e.target.value,
                    })
                  }
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit">
                  {editingTicket ? "Cập Nhật" : "Tạo Loại Vé"}
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
