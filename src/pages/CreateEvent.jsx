import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../api/events";
import { getAllOrganizations, getMyOrganizations } from "../api/organizations";
import ImageUploader from "../components/ImageUploader";
import { useAuth } from "../contexts/AuthContext";
import { DashboardLayout } from "../layouts/DashboardLayout";

const CreateEvent = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [organizations, setOrganizations] = useState([]);
    const [formData, setFormData] = useState({
        organization_id: "",
        title: "",
        subtitle: "",
        description: "",
        attendance_mode: "OFFLINE",
        timezone: "Asia/Ho_Chi_Minh",
        start_at: "",
        end_at: "",
        is_all_day: false,
        venue_name: "",
        address_line1: "",
        address_line2: "",
        city: "",
        district: "",
        country: "Việt Nam",
        postal_code: "",
        meeting_url: "",
        stream_platform: "",
        capacity_total: "",
        category: "",
    });
    const [errors, setErrors] = useState({});
    const [alert, setAlert] = useState({ type: "", message: "" });
    const [loading, setLoading] = useState(false);
    const [loadingOrgs, setLoadingOrgs] = useState(true);

    // Redirect nếu chưa đăng nhập
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate("/login");
        }
    }, [authLoading, isAuthenticated, navigate]);

    // Fetch organizations
    useEffect(() => {
        const fetchOrganizations = async () => {
            if (!isAuthenticated) {
                setLoadingOrgs(false);
                return;
            }

            try {
                // PLATFORM_ADMIN lấy tất cả organizations
                if (user?.platform_role === "PLATFORM_ADMIN") {
                    try {
                        const data = await getAllOrganizations();
                        setOrganizations(data || []);
                        setLoadingOrgs(false);
                        return;
                    } catch (err) {
                        // Nếu không phải PLATFORM_ADMIN, tiếp tục với getMyOrganizations
                    }
                }

                // Các role khác (ORGANIZER_ADMIN, EVENT_MANAGER) lấy organizations của họ
                const myOrgs = await getMyOrganizations();
                // Filter chỉ lấy organizations mà user có quyền ORGANIZER_ADMIN hoặc EVENT_MANAGER
                const allowedOrgs = (myOrgs || []).filter((org) => {
                    const role = org.role;
                    return role === "ORGANIZER_ADMIN" || role === "EVENT_MANAGER";
                });

                // Transform để lấy organization object
                const orgList = allowedOrgs.map((org) => {
                    const orgData = org.organization || {
                        id: org.organization_id || org.id,
                        name: org.organization?.name || t("common.unknown"),
                    };
                    return { ...orgData, userRole: org.role };
                });

                setOrganizations(orgList);
            } catch (err) {
                console.error("Error fetching organizations:", err);
            } finally {
                setLoadingOrgs(false);
            }
        };

        if (isAuthenticated) {
            fetchOrganizations();
        }
    }, [isAuthenticated, user, t]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === "checkbox" ? checked : value;
        setFormData((prev) => ({ ...prev, [name]: newValue }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleSelectChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.organization_id) {
            newErrors.organization_id = t("event.organizationIdRequired");
        }
        if (!formData.title.trim()) {
            newErrors.title = t("event.titleRequired");
        } else if (formData.title.trim().length < 3) {
            newErrors.title = t("event.titleMinLength");
        }
        if (!formData.attendance_mode) {
            newErrors.attendance_mode = t("event.attendanceModeRequired");
        }
        if (!formData.timezone) {
            newErrors.timezone = t("event.timezoneRequired");
        }
        if (!formData.start_at) {
            newErrors.start_at = t("event.startAtRequired");
        }
        if (!formData.end_at) {
            newErrors.end_at = t("event.endAtRequired");
        }
        if (
            formData.start_at &&
            formData.end_at &&
            new Date(formData.start_at) >= new Date(formData.end_at)
        ) {
            newErrors.end_at = t("event.endTimeAfterStartTime");
        }

        // Validate based on attendance_mode
        if (
            formData.attendance_mode === "OFFLINE" ||
            formData.attendance_mode === "HYBRID"
        ) {
            if (!formData.venue_name) {
                newErrors.venue_name = t("event.venueNameRequired");
            }
            if (!formData.address_line1) {
                newErrors.address_line1 = t("event.addressLine1Required");
            }
            if (!formData.city) {
                newErrors.city = t("event.cityRequired");
            }
        }
        if (
            formData.attendance_mode === "ONLINE" ||
            formData.attendance_mode === "HYBRID"
        ) {
            if (!formData.meeting_url) {
                newErrors.meeting_url = t("event.meetingUrlRequired");
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert({ type: "", message: "" });

        if (!validate()) {
            return;
        }

        setLoading(true);
        try {
            // Convert datetime-local to ISO 8601
            const payload = {
                organization_id: formData.organization_id,
                title: formData.title.trim(),
                attendance_mode: formData.attendance_mode,
                timezone: formData.timezone,
                start_at: new Date(formData.start_at).toISOString(),
                end_at: new Date(formData.end_at).toISOString(),
                is_all_day: formData.is_all_day,
            };

            if (formData.subtitle?.trim())
                payload.subtitle = formData.subtitle.trim();
            if (formData.description?.trim())
                payload.description = formData.description.trim();

            if (
                formData.attendance_mode === "OFFLINE" ||
                formData.attendance_mode === "HYBRID"
            ) {
                payload.venue_name = formData.venue_name.trim();
                payload.address_line1 = formData.address_line1.trim();
                payload.city = formData.city.trim();
                if (formData.address_line2?.trim())
                    payload.address_line2 = formData.address_line2.trim();
                if (formData.district?.trim())
                    payload.district = formData.district.trim();
                if (formData.country?.trim()) payload.country = formData.country.trim();
                if (formData.postal_code?.trim())
                    payload.postal_code = formData.postal_code.trim();
            }

            if (
                formData.attendance_mode === "ONLINE" ||
                formData.attendance_mode === "HYBRID"
            ) {
                payload.meeting_url = formData.meeting_url.trim();
                if (formData.stream_platform?.trim())
                    payload.stream_platform = formData.stream_platform.trim();
            }

            if (formData.capacity_total)
                payload.capacity_total = parseInt(formData.capacity_total);
            if (formData.category?.trim())
                payload.category = formData.category.trim();

            const result = await createEvent(payload);

            setAlert({
                type: "success",
                message: t("event.createSuccess"),
            });

            setTimeout(() => {
                navigate("/events-management");
            }, 1000);
        } catch (error) {
            let errorMessage = t("event.createError");

            if (error.message) {
                if (Array.isArray(error.message)) {
                    errorMessage = error.message.join(", ");
                } else {
                    errorMessage = error.message;
                }
            }

            setAlert({ type: "error", message: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loadingOrgs || !isAuthenticated) {
        return (
            <DashboardLayout>
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">
                                {t("common.loading")}
                            </p>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {t("event.createTitle")}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {t("event.createSubtitle")}
                        </p>
                    </div>

                    {alert.message && (
                        <Alert
                            variant={alert.type === "error" ? "destructive" : "default"}
                            className="mb-6"
                        >
                            <AlertDescription>{alert.message}</AlertDescription>
                        </Alert>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8"
                    >
                        {/* Organization */}
                        <div>
                            <Label htmlFor="organization_id">
                                {t("event.organizationId")}{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.organization_id}
                                onValueChange={(value) =>
                                    handleSelectChange("organization_id", value)
                                }
                            >
                                <SelectTrigger
                                    className={errors.organization_id ? "border-red-500" : ""}
                                >
                                    <SelectValue placeholder={t("event.selectOrganization")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizations.length === 0 ? (
                                        <SelectItem value="" disabled>
                                            {t("event.noOrganizations")}
                                        </SelectItem>
                                    ) : (
                                        organizations.map((org) => (
                                            <SelectItem key={org.id} value={org.id}>
                                                {org.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {errors.organization_id && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.organization_id}
                                </p>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <Label htmlFor="title">
                                {t("event.title")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder={t("event.titlePlaceholder")}
                                className={errors.title ? "border-red-500" : ""}
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                            )}
                        </div>

                        {/* Subtitle */}
                        <div>
                            <Label htmlFor="subtitle">{t("event.subtitle")}</Label>
                            <Input
                                id="subtitle"
                                type="text"
                                name="subtitle"
                                value={formData.subtitle}
                                onChange={handleChange}
                                placeholder={t("event.subtitlePlaceholder")}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <Label htmlFor="description">{t("event.description")}</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder={t("event.descriptionPlaceholder")}
                                rows={4}
                            />
                        </div>

                        {/* Cover Image Upload */}
                        <div className="border-t pt-4">
                            <ImageUploader
                                onImageUploaded={(url) => setFormData({...formData, cover_image_url: url})}
                                label={t("event.coverImage") || "Ảnh bìa sự kiện"}
                                disabled={loading}
                            />
                        </div>

                        {/* Attendance Mode */}
                        <div>
                            <Label htmlFor="attendance_mode">
                                {t("event.attendanceMode")}{" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.attendance_mode}
                                onValueChange={(value) =>
                                    handleSelectChange("attendance_mode", value)
                                }
                            >
                                <SelectTrigger
                                    className={errors.attendance_mode ? "border-red-500" : ""}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OFFLINE">{t("event.offline")}</SelectItem>
                                    <SelectItem value="ONLINE">{t("event.online")}</SelectItem>
                                    <SelectItem value="HYBRID">{t("event.hybrid")}</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.attendance_mode && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.attendance_mode}
                                </p>
                            )}
                        </div>

                        {/* Timezone */}
                        <div>
                            <Label htmlFor="timezone">
                                {t("event.timezone")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="timezone"
                                type="text"
                                name="timezone"
                                value={formData.timezone}
                                onChange={handleChange}
                                className={errors.timezone ? "border-red-500" : ""}
                            />
                            {errors.timezone && (
                                <p className="mt-1 text-sm text-red-600">{errors.timezone}</p>
                            )}
                        </div>

                        {/* Start Date & Time */}
                        <div>
                            <Label htmlFor="start_at">
                                {t("event.startAt")} <span className="text-red-500">*</span>
                            </Label>
                            <DateTimePicker
                                date={formData.start_at}
                                setDate={(date) =>
                                    setFormData((prev) => ({ ...prev, start_at: date }))
                                }
                            />
                            {errors.start_at && (
                                <p className="mt-1 text-sm text-red-600">{errors.start_at}</p>
                            )}
                        </div>

                        {/* End Date & Time */}
                        <div>
                            <Label htmlFor="end_at">
                                {t("event.endAt")} <span className="text-red-500">*</span>
                            </Label>
                            <DateTimePicker
                                date={formData.end_at}
                                setDate={(date) =>
                                    setFormData((prev) => ({ ...prev, end_at: date }))
                                }
                            />
                            {errors.end_at && (
                                <p className="mt-1 text-sm text-red-600">{errors.end_at}</p>
                            )}
                        </div>

                        {/* All Day Event */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_all_day"
                                name="is_all_day"
                                checked={formData.is_all_day}
                                onChange={handleChange}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="is_all_day" className="cursor-pointer">
                                {t("event.isAllDay")}
                            </Label>
                        </div>

                        {/* OFFLINE/HYBRID Fields */}
                        {(formData.attendance_mode === "OFFLINE" ||
                            formData.attendance_mode === "HYBRID") && (
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-semibold text-lg">{t("event.venueInfo")}</h3>

                                    <div>
                                        <Label htmlFor="venue_name">
                                            {t("event.venueName")}{" "}
                                            <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="venue_name"
                                            type="text"
                                            name="venue_name"
                                            value={formData.venue_name}
                                            onChange={handleChange}
                                            placeholder={t("event.venueNamePlaceholder")}
                                            className={errors.venue_name ? "border-red-500" : ""}
                                        />
                                        {errors.venue_name && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.venue_name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="address_line1">
                                            {t("event.addressLine1")}{" "}
                                            <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="address_line1"
                                            type="text"
                                            name="address_line1"
                                            value={formData.address_line1}
                                            onChange={handleChange}
                                            placeholder={t("event.addressLine1Placeholder")}
                                            className={errors.address_line1 ? "border-red-500" : ""}
                                        />
                                        {errors.address_line1 && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.address_line1}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="address_line2">
                                            {t("event.addressLine2")}
                                        </Label>
                                        <Input
                                            id="address_line2"
                                            type="text"
                                            name="address_line2"
                                            value={formData.address_line2}
                                            onChange={handleChange}
                                            placeholder={t("event.addressLine2Placeholder")}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="city">
                                                {t("event.city")} <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="city"
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                placeholder={t("event.cityPlaceholder")}
                                                className={errors.city ? "border-red-500" : ""}
                                            />
                                            {errors.city && (
                                                <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="district">{t("event.district")}</Label>
                                            <Input
                                                id="district"
                                                type="text"
                                                name="district"
                                                value={formData.district}
                                                onChange={handleChange}
                                                placeholder={t("event.districtPlaceholder")}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="country">{t("event.country")}</Label>
                                            <Input
                                                id="country"
                                                type="text"
                                                name="country"
                                                value={formData.country}
                                                onChange={handleChange}
                                                placeholder={t("event.countryPlaceholder")}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="postal_code">{t("event.postalCode")}</Label>
                                            <Input
                                                id="postal_code"
                                                type="text"
                                                name="postal_code"
                                                value={formData.postal_code}
                                                onChange={handleChange}
                                                placeholder={t("event.postalCodePlaceholder")}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                        {/* ONLINE/HYBRID Fields */}
                        {(formData.attendance_mode === "ONLINE" ||
                            formData.attendance_mode === "HYBRID") && (
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-semibold text-lg">{t("event.onlineInfo")}</h3>

                                    <div>
                                        <Label htmlFor="meeting_url">
                                            {t("event.meetingUrl")}{" "}
                                            <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="meeting_url"
                                            type="url"
                                            name="meeting_url"
                                            value={formData.meeting_url}
                                            onChange={handleChange}
                                            placeholder={t("event.meetingUrlPlaceholder")}
                                            className={errors.meeting_url ? "border-red-500" : ""}
                                        />
                                        {errors.meeting_url && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.meeting_url}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="stream_platform">
                                            {t("event.streamPlatform")}
                                        </Label>
                                        <Input
                                            id="stream_platform"
                                            type="text"
                                            name="stream_platform"
                                            value={formData.stream_platform}
                                            onChange={handleChange}
                                            placeholder={t("event.streamPlatformPlaceholder")}
                                        />
                                    </div>
                                </div>
                            )}

                        {/* Capacity & Category */}
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div>
                                <Label htmlFor="capacity_total">
                                    {t("event.capacityTotal")}
                                </Label>
                                <Input
                                    id="capacity_total"
                                    type="number"
                                    name="capacity_total"
                                    value={formData.capacity_total}
                                    onChange={handleChange}
                                    placeholder={t("event.capacityTotalPlaceholder")}
                                    min="1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="category">{t("event.category")}</Label>
                                <Input
                                    id="category"
                                    type="text"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    placeholder={t("event.categoryPlaceholder")}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/events-management")}
                                className="flex-1"
                                disabled={loading}
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-1">
                                {loading ? t("common.loading") : t("event.createButton")}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CreateEvent;
