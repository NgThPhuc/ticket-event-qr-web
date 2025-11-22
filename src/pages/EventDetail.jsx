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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  Edit,
  Globe,
  MapPin,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  cancelEvent,
  completeEvent,
  deleteEvent,
  getEventById,
  publishEvent,
} from "../api/events";
import { getMyOrganizations } from "../api/organizations";
import TicketTypesManager from "../components/TicketTypesManager";
import { useAuth } from "../contexts/AuthContext";
import { DashboardLayout } from "../layouts/DashboardLayout";

const EventDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [event, setEvent] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    eventId: null,
    eventTitle: "",
  });

  // Fetch organizations và event data
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !eventId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        // Fetch organizations của user (để check permissions)
        try {
          const myOrgs = await getMyOrganizations();
          setOrganizations(myOrgs || []);
        } catch (err) {
          console.error("Error fetching organizations:", err);
        }

        // Fetch event data
        const data = await getEventById(eventId, "organization,creator");
        setEvent(data);
      } catch (err) {
        setError(
          err.message ||
            t("event.fetchDetailError") ||
            "Không thể tải thông tin sự kiện"
        );
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
      fetchData();
    }
  }, [isAuthenticated, eventId, navigate, t]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = () => {
    if (event) {
      setDeleteDialog({
        open: true,
        eventId: event.id,
        eventTitle: event.title,
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.eventId) return;

    try {
      await deleteEvent(deleteDialog.eventId);
      setAlert({
        type: "success",
        message: t("event.deleteSuccess") || "Xóa sự kiện thành công",
      });
      setTimeout(() => {
        navigate("/events-management");
      }, 1000);
    } catch (err) {
      setAlert({
        type: "error",
        message:
          err.message || t("event.deleteError") || "Không thể xóa sự kiện",
      });
      setDeleteDialog({ open: false, eventId: null, eventTitle: "" });
      setTimeout(() => {
        setAlert({ type: "", message: "" });
      }, 3000);
    }
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  // Check permissions
  const isPlatformAdmin = user?.platform_role === "PLATFORM_ADMIN";

  // Check user role trong organization của event
  const getEventOrgRole = () => {
    if (!event || !organizations.length) return null;
    const eventOrgId = event.organization_id || event.organization?.id;

    const userOrg = organizations.find((org) => {
      const orgId = org.organization?.id || org.organization_id || org.id;
      return orgId === eventOrgId;
    });

    return userOrg?.role || null;
  };

  const eventOrgRole = getEventOrgRole();
  const isOrganizerAdmin =
    isPlatformAdmin || eventOrgRole === "ORGANIZER_ADMIN";
  const isEventManager = eventOrgRole === "EVENT_MANAGER";

  // Permissions
  const canEdit = isPlatformAdmin || isOrganizerAdmin || isEventManager;
  const canDelete = isPlatformAdmin || isOrganizerAdmin; // EVENT_MANAGER không thể delete
  const canPublish = isPlatformAdmin || isOrganizerAdmin || isEventManager;
  const canCancel = isPlatformAdmin || isOrganizerAdmin; // EVENT_MANAGER không thể cancel
  const canComplete = isPlatformAdmin || isOrganizerAdmin; // EVENT_MANAGER không thể complete

  const handlePublish = async () => {
    if (!event) return;

    try {
      await publishEvent(event.id);
      setAlert({
        type: "success",
        message: t("event.publishSuccess") || "Publish event thành công",
      });
      // Reload event
      const data = await getEventById(eventId, "organization,creator");
      setEvent(data);
      setTimeout(() => {
        setAlert({ type: "", message: "" });
      }, 3000);
    } catch (err) {
      setAlert({
        type: "error",
        message:
          err.message || t("event.publishError") || "Không thể publish event",
      });
      setTimeout(() => {
        setAlert({ type: "", message: "" });
      }, 3000);
    }
  };

  const handleCancel = async () => {
    if (!event) return;

    const confirmed = window.confirm("Bạn có chắc chắn muốn hủy sự kiện này?");
    if (!confirmed) return;

    try {
      await cancelEvent(event.id, { reason: "Cancelled by user" });
      setAlert({
        type: "success",
        message: t("event.cancelSuccess") || "Cancel event thành công",
      });
      // Reload event
      const data = await getEventById(eventId, "organization,creator");
      setEvent(data);
      setTimeout(() => {
        setAlert({ type: "", message: "" });
      }, 3000);
    } catch (err) {
      setAlert({
        type: "error",
        message:
          err.message || t("event.cancelError") || "Không thể cancel event",
      });
      setTimeout(() => {
        setAlert({ type: "", message: "" });
      }, 3000);
    }
  };

  const handleComplete = async () => {
    if (!event) return;

    try {
      await completeEvent(event.id);
      setAlert({
        type: "success",
        message: t("event.completeSuccess") || "Complete event thành công",
      });
      // Reload event
      const data = await getEventById(eventId, "organization,creator");
      setEvent(data);
      setTimeout(() => {
        setAlert({ type: "", message: "" });
      }, 3000);
    } catch (err) {
      setAlert({
        type: "error",
        message:
          err.message || t("event.completeError") || "Không thể complete event",
      });
      setTimeout(() => {
        setAlert({ type: "", message: "" });
      }, 3000);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/events-management')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back') || 'Quay lại'}
            </Button>
          </div> */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t("event.details") || "Chi tiết Sự kiện"}
          </h1>
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

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {t("common.loading") || "Đang tải..."}
              </p>
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : event ? (
          <div className="space-y-6">
            {/* Event Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {event.title}
                    </CardTitle>
                    {event.subtitle && (
                      <CardDescription className="text-base mb-4">
                        {event.subtitle}
                      </CardDescription>
                    )}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge
                        variant={
                          event.status === "PUBLISHED" ? "default" : "secondary"
                        }
                      >
                        {t(`event.${event.status?.toLowerCase()}`) ||
                          event.status}
                      </Badge>
                      <Badge variant="outline">
                        {event.attendance_mode === "OFFLINE"
                          ? t("event.offline")
                          : event.attendance_mode === "ONLINE"
                          ? t("event.online")
                          : t("event.hybrid")}
                      </Badge>
                      {event.visibility && (
                        <Badge variant="outline">
                          {t(`event.${event.visibility?.toLowerCase()}`) ||
                            event.visibility}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex flex-wrap gap-2">
                      {(event.status === "DRAFT" ||
                        event.status === "SCHEDULED") &&
                        canPublish && (
                          <Button
                            variant="default"
                            onClick={handlePublish}
                            className="gap-2"
                          >
                            <Send className="h-4 w-4" />
                            {t("event.publish")}
                          </Button>
                        )}
                      {event.status !== "CANCELLED" &&
                        event.status !== "COMPLETED" &&
                        canCancel && (
                          <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            {t("event.cancel")}
                          </Button>
                        )}
                      {event.status === "PUBLISHED" && canComplete && (
                        <Button
                          variant="outline"
                          onClick={handleComplete}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {t("event.complete")}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/events/${eventId}/edit`)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        {t("event.edit")}
                      </Button>
                      {canDelete && (
                        <Button
                          variant="destructive"
                          onClick={handleDelete}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("event.delete")}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Description */}
                  {event.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        {t("event.description")}
                      </h3>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {event.description}
                      </p>
                    </div>
                  )}

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.start_at && (
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {t("event.startAt")}
                          </p>
                          <p className="text-gray-900 dark:text-white">
                            {formatDate(event.start_at)}
                          </p>
                        </div>
                      </div>
                    )}
                    {event.end_at && (
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {t("event.endAt")}
                          </p>
                          <p className="text-gray-900 dark:text-white">
                            {formatDate(event.end_at)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location/Online */}
                  {(event.attendance_mode === "OFFLINE" ||
                    event.attendance_mode === "HYBRID") &&
                    event.venue_name && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {t("event.venueName")}
                          </p>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {event.venue_name}
                          </p>
                          {event.address_line1 && (
                            <p className="text-gray-900 dark:text-white">
                              {event.address_line1}
                              {event.address_line2 &&
                                `, ${event.address_line2}`}
                              {event.city && `, ${event.city}`}
                              {event.district && `, ${event.district}`}
                              {event.country && `, ${event.country}`}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                  {(event.attendance_mode === "ONLINE" ||
                    event.attendance_mode === "HYBRID") &&
                    event.meeting_url && (
                      <div className="flex items-start gap-3">
                        <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {t("event.meetingUrl")}
                          </p>
                          <a
                            href={event.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {event.meeting_url}
                          </a>
                          {event.stream_platform && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {t("event.streamPlatform")}:{" "}
                              {event.stream_platform}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Organization */}
                  {event.organization && (
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {t("organization.name")}
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          {event.organization.name}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    {event.capacity_total && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {t("event.capacityTotal")}
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          {event.capacity_total.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {event.category && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {t("event.category")}
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          {event.category}
                        </p>
                      </div>
                    )}
                    {event.created_at && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {t("event.createdAt")}
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          {formatDate(event.created_at)}
                        </p>
                      </div>
                    )}
                    {event.updated_at && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {t("event.updatedAt")}
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          {formatDate(event.updated_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Types Manager */}
            <TicketTypesManager
              eventId={eventId}
              eventStartAt={event.start_at}
              canManage={canEdit}
            />
          </div>
        ) : null}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteDialog({ open: false, eventId: null, eventTitle: "" });
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("event.deleteConfirmTitle") || "Xác nhận xóa sự kiện"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("event.deleteConfirmMessage", {
                  title: deleteDialog.eventTitle,
                }) ||
                  `Bạn có chắc chắn muốn xóa sự kiện "${deleteDialog.eventTitle}"? Hành động này không thể hoàn tác.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t("common.cancel") || "Hủy"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {t("event.deleteConfirm") || "Xóa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default EventDetail;
