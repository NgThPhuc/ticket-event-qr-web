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
import {
    Calendar,
    Check,
    ChevronLeft,
    ChevronRight,
    Image,
    Info,
    MapPin,
    Save,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { getEventById, patchEvent } from "../api/events";
import { getAllOrganizations } from "../api/organizations";
import CategoryMultiSelect from "../components/CategoryMultiSelect";
import ImageUploader from "../components/ImageUploader";
import { useAuth } from "../contexts/AuthContext";
import { DashboardLayout } from "../layouts/DashboardLayout";

const STEPS = [
    { id: 0, key: "general", icon: Info, labelKey: "event.tabs.general" },
    { id: 1, key: "time", icon: Calendar, labelKey: "event.tabs.time" },
    { id: 2, key: "location", icon: MapPin, labelKey: "event.tabs.location" },
    { id: 3, key: "media", icon: Image, labelKey: "event.tabs.media" },
];

const EditEvent = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { eventId } = useParams();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [organizations, setOrganizations] = useState([]);
    const [event, setEvent] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
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
        category_ids: [],
        cover_image_url: "",
    });
    const [errors, setErrors] = useState({});
    const [alert, setAlert] = useState({ type: "", message: "" });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
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
                if (user?.platform_role === "PLATFORM_ADMIN") {
                    try {
                        const data = await getAllOrganizations();
                        setOrganizations(data || []);
                        setLoadingOrgs(false);
                        return;
                    } catch (err) {
                        console.error("Error fetching all organizations:", err);
                    }
                }

                const userOrgs = user?.organizations || [];
                const allowedOrgs = userOrgs.filter((org) => {
                    return org.role === "ORGANIZER_ADMIN" || org.role === "EVENT_MANAGER";
                });

                setOrganizations(allowedOrgs);
            } catch (err) {
                console.error("Error fetching organizations:", err);
            } finally {
                setLoadingOrgs(false);
            }
        };

        if (isAuthenticated && !authLoading) {
            fetchOrganizations();
        }
    }, [isAuthenticated, authLoading, user]);

    // Fetch event data
    useEffect(() => {
        const fetchEvent = async () => {
            if (!isAuthenticated || !eventId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setAlert({ type: "", message: "" });
            try {
                const data = await getEventById(eventId, "organization");
                setEvent(data);

                const isPlatformAdmin = user?.platform_role === "PLATFORM_ADMIN";

                if (!isPlatformAdmin) {
                    const userOrgs = user?.organizations || [];
                    const eventOrgId = data.organization_id || data.organization?.id;
                    const userOrg = userOrgs.find((org) => org.id === eventOrgId);
                    const userRole = userOrg?.role;

                    if (
                        !userRole ||
                        (userRole !== "ORGANIZER_ADMIN" && userRole !== "EVENT_MANAGER")
                    ) {
                        setAlert({
                            type: "error",
                            message: t("event.noPermissionToEdit"),
                        });
                        setTimeout(() => {
                            navigate("/events-management");
                        }, 2000);
                        setLoading(false);
                        return;
                    }
                }

                const formatDateTimeLocal = (isoString) => {
                    if (!isoString) return "";
                    const date = new Date(isoString);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    const hours = String(date.getHours()).padStart(2, "0");
                    const minutes = String(date.getMinutes()).padStart(2, "0");
                    return `${year}-${month}-${day}T${hours}:${minutes}`;
                };

                setFormData({
                    organization_id: data.organization_id || "",
                    title: data.title || "",
                    subtitle: data.subtitle || "",
                    description: data.description || "",
                    attendance_mode: data.attendance_mode || "OFFLINE",
                    timezone: data.timezone || "Asia/Ho_Chi_Minh",
                    start_at: formatDateTimeLocal(data.start_at),
                    end_at: formatDateTimeLocal(data.end_at),
                    is_all_day: data.is_all_day || false,
                    venue_name: data.venue_name || "",
                    address_line1: data.address_line1 || "",
                    address_line2: data.address_line2 || "",
                    city: data.city || "",
                    district: data.district || "",
                    country: data.country || "Việt Nam",
                    postal_code: data.postal_code || "",
                    meeting_url: data.meeting_url || "",
                    stream_platform: data.stream_platform || "",
                    capacity_total: data.capacity_total?.toString() || "",
                    category_ids: data.categories ? data.categories.map(c => c.id).filter(Boolean) : [],
                    cover_image_url: data.cover_image_url || "",
                });
            } catch (err) {
                setAlert({
                    type: "error",
                    message: err.message || t("event.fetchDetailError"),
                });
                if (err.status === 404) {
                    setTimeout(() => {
                        navigate("/events-management");
                    }, 2000);
                }
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated && eventId) {
            fetchEvent();
        }
    }, [isAuthenticated, eventId, navigate, t, user]);

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

    // Validate current step
    const validateCurrentStep = () => {
        const newErrors = {};

        if (currentStep === 0) {
            // General tab validation
            if (!formData.title.trim()) {
                newErrors.title = t("event.titleRequired");
            } else if (formData.title.trim().length < 3) {
                newErrors.title = t("event.titleMinLength");
            }
        } else if (currentStep === 1) {
            // Time tab validation
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
        } else if (currentStep === 2) {
            // Location tab validation
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
        }
        // Step 3 (Media) has no required fields

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = (e) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (validateCurrentStep()) {
            setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
        }
    };

    const handlePrevious = (e) => {
        e?.preventDefault();
        e?.stopPropagation();
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert({ type: "", message: "" });

        if (!validateCurrentStep()) {
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                title: formData.title.trim(),
                attendance_mode: formData.attendance_mode,
                timezone: formData.timezone,
                start_at: new Date(formData.start_at).toISOString(),
                end_at: new Date(formData.end_at).toISOString(),
                is_all_day: formData.is_all_day,
            };

            // organization_id không được phép gửi khi update event
            // Backend sẽ trả về lỗi "property organization_id should not exist"
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
            // Luôn gửi category_ids (kể cả array rỗng) để backend có thể cập nhật/xóa categories
            // Filter để loại bỏ null/undefined
            payload.category_ids = (formData.category_ids || []).filter(id => id && typeof id === 'string');
            if (formData.cover_image_url)
                payload.cover_image_url = formData.cover_image_url;

            await patchEvent(eventId, payload);

            setAlert({
                type: "success",
                message: t("event.updateSuccess"),
            });

            setTimeout(() => {
                navigate(`/events/${eventId}`);
            }, 1000);
        } catch (error) {
            let errorMessage = t("event.updateError");

            if (error.message) {
                if (Array.isArray(error.message)) {
                    errorMessage = error.message.join(", ");
                } else {
                    errorMessage = error.message;
                }
            }

            setAlert({ type: "error", message: errorMessage });
        } finally {
            setSubmitting(false);
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

    if (loading) {
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

    if (!event) {
        return (
            <DashboardLayout>
                <div className="container mx-auto px-4 py-8">
                    <Alert variant="destructive">
                        <AlertDescription>
                            {alert.message || t("event.notFound")}
                        </AlertDescription>
                    </Alert>
                </div>
            </DashboardLayout>
        );
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 gap-y-5">
                            {/* Organization */}
                            <div>
                                <Label htmlFor="organization_id">
                                    {t("event.organizationId")}
                                </Label>
                                <Select
                                    value={formData.organization_id}
                                    onValueChange={(value) =>
                                        handleSelectChange("organization_id", value)
                                    }
                                >
                                    <SelectTrigger className="mt-1">
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
                                    className={`mt-1 ${errors.title ? "border-red-500" : ""}`}
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
                                    className="mt-1"
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
                                    className="mt-1"
                                />
                            </div>

                            {/* Capacity & Category */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="category_ids">{t("event.categories") || "Danh mục"}</Label>
                                    <div className="mt-1">
                                        <CategoryMultiSelect
                                            value={formData.category_ids}
                                            onChange={(value) =>
                                                setFormData((prev) => ({ ...prev, category_ids: value }))
                                            }
                                            placeholder={t("event.selectCategories") || "Chọn danh mục"}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 gap-y-5">
                            {/* Attendance Mode */}
                            <div>
                                <Label htmlFor="attendance_mode">
                                    {t("event.attendanceMode")} <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.attendance_mode}
                                    onValueChange={(value) =>
                                        handleSelectChange("attendance_mode", value)
                                    }
                                >
                                    <SelectTrigger
                                        className={`mt-1 ${errors.attendance_mode ? "border-red-500" : ""}`}
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
                                    className={`mt-1 ${errors.timezone ? "border-red-500" : ""}`}
                                />
                                {errors.timezone && (
                                    <p className="mt-1 text-sm text-red-600">{errors.timezone}</p>
                                )}
                            </div>

                            {/* Start & End Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="start_at">
                                        {t("event.startAt")} <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="mt-1">
                                        <DateTimePicker
                                            date={formData.start_at}
                                            setDate={(date) =>
                                                setFormData((prev) => ({ ...prev, start_at: date }))
                                            }
                                        />
                                    </div>
                                    {errors.start_at && (
                                        <p className="mt-1 text-sm text-red-600">{errors.start_at}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="end_at">
                                        {t("event.endAt")} <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="mt-1">
                                        <DateTimePicker
                                            date={formData.end_at}
                                            setDate={(date) =>
                                                setFormData((prev) => ({ ...prev, end_at: date }))
                                            }
                                        />
                                    </div>
                                    {errors.end_at && (
                                        <p className="mt-1 text-sm text-red-600">{errors.end_at}</p>
                                    )}
                                </div>
                            </div>

                            {/* All Day Event */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_all_day"
                                    name="is_all_day"
                                    checked={formData.is_all_day}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="is_all_day" className="cursor-pointer">
                                    {t("event.isAllDay")}
                                </Label>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                        {/* OFFLINE/HYBRID Fields */}
                        {(formData.attendance_mode === "OFFLINE" ||
                            formData.attendance_mode === "HYBRID") && (
                                <div className="grid grid-cols-1 gap-y-5 mb-6">
                                    <div>
                                        <Label htmlFor="venue_name">
                                            {t("event.venueName")} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="venue_name"
                                            type="text"
                                            name="venue_name"
                                            value={formData.venue_name}
                                            onChange={handleChange}
                                            placeholder={t("event.venueNamePlaceholder")}
                                            className={`mt-1 ${errors.venue_name ? "border-red-500" : ""}`}
                                        />
                                        {errors.venue_name && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.venue_name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="address_line1">
                                            {t("event.addressLine1")} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="address_line1"
                                            type="text"
                                            name="address_line1"
                                            value={formData.address_line1}
                                            onChange={handleChange}
                                            placeholder={t("event.addressLine1Placeholder")}
                                            className={`mt-1 ${errors.address_line1 ? "border-red-500" : ""}`}
                                        />
                                        {errors.address_line1 && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.address_line1}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="address_line2">{t("event.addressLine2")}</Label>
                                        <Input
                                            id="address_line2"
                                            type="text"
                                            name="address_line2"
                                            value={formData.address_line2}
                                            onChange={handleChange}
                                            placeholder={t("event.addressLine2Placeholder")}
                                            className="mt-1"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                className={`mt-1 ${errors.city ? "border-red-500" : ""}`}
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
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="country">{t("event.country")}</Label>
                                            <Input
                                                id="country"
                                                type="text"
                                                name="country"
                                                value={formData.country}
                                                onChange={handleChange}
                                                placeholder={t("event.countryPlaceholder")}
                                                className="mt-1"
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
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                        {/* ONLINE/HYBRID Fields */}
                        {(formData.attendance_mode === "ONLINE" ||
                            formData.attendance_mode === "HYBRID") && (
                                <div className="grid grid-cols-1 gap-y-5">
                                    {formData.attendance_mode === "HYBRID" && (
                                        <h4 className="font-medium text-foreground">
                                            {t("event.onlineInfo")}
                                        </h4>
                                    )}
                                    <div>
                                        <Label htmlFor="meeting_url">
                                            {t("event.meetingUrl")} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="meeting_url"
                                            type="url"
                                            name="meeting_url"
                                            value={formData.meeting_url}
                                            onChange={handleChange}
                                            placeholder={t("event.meetingUrlPlaceholder")}
                                            className={`mt-1 ${errors.meeting_url ? "border-red-500" : ""}`}
                                        />
                                        {errors.meeting_url && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.meeting_url}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="stream_platform">{t("event.streamPlatform")}</Label>
                                        <Input
                                            id="stream_platform"
                                            type="text"
                                            name="stream_platform"
                                            value={formData.stream_platform}
                                            onChange={handleChange}
                                            placeholder={t("event.streamPlatformPlaceholder")}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            )}

                        {formData.attendance_mode === "ONLINE" && (
                            <p className="text-sm text-muted-foreground mt-4">
                                {t("event.onlineOnlyNote") || "Sự kiện trực tuyến không yêu cầu địa điểm vật lý."}
                            </p>
                        )}
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                        <ImageUploader
                            currentImageUrl={formData.cover_image_url}
                            onImageUploaded={(url) => setFormData({ ...formData, cover_image_url: url })}
                            label={t("event.coverImage") || "Ảnh bìa sự kiện"}
                            disabled={submitting}
                        />

                        {formData.cover_image_url && (
                            <div className="mt-6">
                                <Label className="mb-2 block">{t("event.preview") || "Xem trước"}</Label>
                                <div className="w-full h-48 rounded-lg overflow-hidden border">
                                    <img
                                        src={formData.cover_image_url}
                                        alt="Cover preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    const isLastStep = currentStep === STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    return (
        <DashboardLayout>
            <div className="min-h-screen p-4 md:p-6 lg:p-10">
                <div className="max-w-4xl mx-auto">
                    {/* Title Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground">
                            {t("event.editTitle")}
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            {t("event.editSubtitle")}
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

                    {/* Steps Indicator */}
                    <div className="mb-8">
                        <div className="flex items-center justify-center">
                            {STEPS.map((step, index) => {
                                const Icon = step.icon;
                                const isCompleted = index < currentStep;
                                const isCurrent = index === currentStep;

                                return (
                                    <div key={step.id} className="flex items-center">
                                        {/* Step Circle */}
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : isCurrent
                                                        ? "border-primary text-primary bg-primary/10"
                                                        : "border-muted-foreground/30 text-muted-foreground"
                                                    }`}
                                            >
                                                {isCompleted ? (
                                                    <Check className="w-5 h-5" />
                                                ) : (
                                                    <Icon className="w-5 h-5" />
                                                )}
                                            </div>
                                            <span
                                                className={`mt-2 text-xs font-medium ${isCurrent
                                                    ? "text-primary"
                                                    : isCompleted
                                                        ? "text-foreground"
                                                        : "text-muted-foreground"
                                                    }`}
                                            >
                                                {t(step.labelKey)}
                                            </span>
                                        </div>

                                        {/* Connector Line */}
                                        {index < STEPS.length - 1 && (
                                            <div
                                                className={`w-16 md:w-24 h-0.5 mx-2 ${index < currentStep
                                                    ? "bg-primary"
                                                    : "bg-muted-foreground/30"
                                                    }`}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Form Content */}
                    <form
                        onSubmit={handleSubmit}
                        onKeyDown={(e) => {
                            // Ngăn Enter key tự động submit form
                            // Chỉ cho phép submit khi focus vào nút submit
                            if (e.key === 'Enter' && e.target.type !== 'submit') {
                                e.preventDefault();
                            }
                        }}
                    >
                        <div className="bg-card rounded-xl shadow-lg border p-6 md:p-8 min-h-[400px]">
                            <h3 className="text-lg font-semibold text-foreground mb-6 border-b pb-3">
                                {t(STEPS[currentStep].labelKey + "Title") || t(STEPS[currentStep].labelKey)}
                            </h3>
                            {renderStepContent()}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="mt-6 flex justify-between items-center">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate(`/events/${eventId}`)}
                                disabled={submitting}
                            >
                                <X className="w-4 h-4 mr-2" />
                                {t("common.cancel")}
                            </Button>

                            <div className="flex gap-3">
                                {!isFirstStep && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handlePrevious}
                                        disabled={submitting}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" />
                                        {t("event.previous") || "Quay lại"}
                                    </Button>
                                )}

                                {isLastStep ? (
                                    <Button type="submit" disabled={submitting}>
                                        <Save className="w-4 h-4 mr-2" />
                                        {submitting ? t("common.loading") : t("event.updateButton") || "Cập nhật"}
                                    </Button>
                                ) : (
                                    <Button type="button" onClick={handleNext} disabled={submitting}>
                                        {t("event.next") || "Tiếp theo"}
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EditEvent;
