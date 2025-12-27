import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
    createCategory,
    deleteCategory,
    getAllCategories,
    toggleCategoryActive,
    updateCategory,
} from "../api/categories";
import { useAuth } from "../contexts/AuthContext";
import { DashboardLayout } from "../layouts/DashboardLayout";

const CategoriesManagement = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ type: "", message: "" });

    // Dialog states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deletingCategory, setDeletingCategory] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        icon: "",
        color: "#6B7280",
        order: 0,
        is_active: true,
    });

    // Check permission
    useEffect(() => {
        if (!authLoading && (!isAuthenticated || user?.platform_role !== "PLATFORM_ADMIN")) {
            navigate("/dashboard");
        }
    }, [authLoading, isAuthenticated, user, navigate]);

    // Fetch categories
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await getAllCategories();
            setCategories(response || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
            setAlert({ type: "error", message: error.message || t("common.error") });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user?.platform_role === "PLATFORM_ADMIN") {
            fetchCategories();
        }
    }, [isAuthenticated, user]);

    // Reset form
    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            icon: "",
            color: "#6B7280",
            order: 0,
            is_active: true,
        });
        setEditingCategory(null);
    };

    // Open create form
    const handleCreate = () => {
        resetForm();
        setIsFormOpen(true);
    };

    // Open edit form
    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name || "",
            description: category.description || "",
            icon: category.icon || "",
            color: category.color || "#6B7280",
            order: category.order || 0,
            is_active: category.is_active ?? true,
        });
        setIsFormOpen(true);
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setAlert({ type: "error", message: t("categoriesManagement.nameRequired") || "Tên danh mục là bắt buộc" });
            return;
        }

        setFormLoading(true);
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, formData);
                setAlert({ type: "success", message: t("categoriesManagement.updateSuccess") || "Cập nhật thành công" });
            } else {
                await createCategory(formData);
                setAlert({ type: "success", message: t("categoriesManagement.createSuccess") || "Tạo thành công" });
            }
            setIsFormOpen(false);
            resetForm();
            fetchCategories();
        } catch (error) {
            setAlert({ type: "error", message: error.message || t("common.error") });
        } finally {
            setFormLoading(false);
        }
    };

    // Toggle active
    const handleToggle = async (category) => {
        try {
            await toggleCategoryActive(category.id);
            fetchCategories();
            setAlert({
                type: "success",
                message: category.is_active
                    ? t("categoriesManagement.deactivated") || "Đã vô hiệu hóa"
                    : t("categoriesManagement.activated") || "Đã kích hoạt",
            });
        } catch (error) {
            setAlert({ type: "error", message: error.message || t("common.error") });
        }
    };

    // Delete
    const handleDelete = async () => {
        if (!deletingCategory) return;

        try {
            await deleteCategory(deletingCategory.id);
            setAlert({ type: "success", message: t("categoriesManagement.deleteSuccess") || "Xóa thành công" });
            setIsDeleteOpen(false);
            setDeletingCategory(null);
            fetchCategories();
        } catch (error) {
            setAlert({ type: "error", message: error.message || t("common.error") });
        }
    };

    if (authLoading || !isAuthenticated || user?.platform_role !== "PLATFORM_ADMIN") {
        return (
            <DashboardLayout>
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
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
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {t("categoriesManagement.title") || "Quản lý danh mục"}
                        </h1>
                        <p className="text-muted-foreground">
                            {t("categoriesManagement.subtitle") || "Quản lý các danh mục sự kiện"}
                        </p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t("categoriesManagement.createTitle") || "Tạo danh mục"}
                    </Button>
                </div>

                {/* Alert */}
                {alert.message && (
                    <Alert
                        variant={alert.type === "error" ? "destructive" : "default"}
                        className="mb-6"
                    >
                        <AlertDescription>{alert.message}</AlertDescription>
                    </Alert>
                )}

                {/* Table */}
                <div className="bg-card rounded-lg shadow-sm border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">{t("categoriesManagement.order") || "TT"}</TableHead>
                                <TableHead>{t("categoriesManagement.name") || "Tên"}</TableHead>
                                <TableHead>{t("categoriesManagement.icon") || "Icon"}</TableHead>
                                <TableHead>{t("categoriesManagement.color") || "Màu"}</TableHead>
                                <TableHead>{t("categoriesManagement.status") || "Trạng thái"}</TableHead>
                                <TableHead className="text-right">{t("categoriesManagement.table.actions") || "Thao tác"}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                    </TableCell>
                                </TableRow>
                            ) : categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        {t("categoriesManagement.noCategories") || "Chưa có danh mục nào"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories
                                    .sort((a, b) => a.order - b.order)
                                    .map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell className="font-medium">{category.order}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{category.name}</div>
                                                    {category.description && (
                                                        <div className="text-sm text-muted-foreground line-clamp-1">
                                                            {category.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-2xl">{category.icon || "—"}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-6 w-6 rounded border"
                                                        style={{ backgroundColor: category.color || "#6B7280" }}
                                                    />
                                                    <span className="text-sm text-muted-foreground">
                                                        {category.color}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={category.is_active ? "default" : "secondary"}>
                                                    {category.is_active
                                                        ? t("categoriesManagement.active") || "Hoạt động"
                                                        : t("categoriesManagement.inactive") || "Vô hiệu"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleToggle(category)}
                                                        title={category.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                                                    >
                                                        {category.is_active ? (
                                                            <ToggleRight className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(category)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setDeletingCategory(category);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory
                                ? t("categoriesManagement.editTitle") || "Sửa danh mục"
                                : t("categoriesManagement.createTitle") || "Tạo danh mục"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">
                                {t("categoriesManagement.name") || "Tên"} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="VD: Âm nhạc"
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">{t("categoriesManagement.description") || "Mô tả"}</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="VD: Các sự kiện âm nhạc, concert..."
                                rows={2}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="icon">{t("categoriesManagement.icon") || "Icon (emoji)"}</Label>
                                <Input
                                    id="icon"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    placeholder="🎵"
                                />
                            </div>
                            <div>
                                <Label htmlFor="color">{t("categoriesManagement.color") || "Màu"}</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="color"
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="w-14 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        placeholder="#EF4444"
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="order">{t("categoriesManagement.order") || "Thứ tự"}</Label>
                            <Input
                                id="order"
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                min={0}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsFormOpen(false)}
                                disabled={formLoading}
                            >
                                {t("common.cancel") || "Hủy"}
                            </Button>
                            <Button type="submit" disabled={formLoading}>
                                {formLoading
                                    ? t("common.loading") || "Đang xử lý..."
                                    : editingCategory
                                        ? t("common.save") || "Lưu"
                                        : t("common.create") || "Tạo"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("categoriesManagement.deleteConfirm") || "Xác nhận xóa"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("categoriesManagement.deleteWarning") ||
                                `Bạn có chắc muốn xóa danh mục "${deletingCategory?.name}"? Hành động này không thể hoàn tác.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel") || "Hủy"}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            {t("common.delete") || "Xóa"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
};

export default CategoriesManagement;
