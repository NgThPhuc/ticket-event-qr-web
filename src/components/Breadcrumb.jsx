import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';

export function Breadcrumb() {
  const location = useLocation();
  const { t } = useTranslation();
  const params = useParams();

  const getBreadcrumbItems = () => {
    const path = location.pathname;
    const items = [];

    // Dashboard
    if (path === '/dashboard') {
      items.push({ label: t('sidebar.dashboard') || 'Dashboard', path: '/dashboard' });
    }
    // Organizations
    else if (path.startsWith('/organizations')) {
      items.push({ label: t('sidebar.organizations') || 'Organizations', path: '/organizations' });
      
      // My Organizations (Overview)
      if (path === '/organizations/my-organizations') {
        items.push({ label: t('sidebar.overview') || 'Overview', path: null });
      }
      // Organization Detail
      else if (params.organizationId && !path.includes('/members')) {
        items.push({ label: t('organization.details') || 'Details', path: null });
      }
      // Manage Members
      else if (path.includes('/members')) {
        if (params.organizationId) {
          items.push({ label: t('organization.details') || 'Details', path: `/organizations/${params.organizationId}` });
        }
        items.push({ label: t('sidebar.manageMembers') || 'Manage Members', path: null });
      }
    }
    // Create Organization
    else if (path === '/create-organization') {
      items.push({ label: t('organization.create') || 'Create Organization', path: null });
    }
    // Events
    else if (path.startsWith('/events-management') || path.startsWith('/events/') || path === '/create-event') {
      items.push({ label: t('sidebar.events') || 'Events', path: '/events-management' });
      
      // Create Event
      if (path === '/create-event') {
        items.push({ label: t('event.createTitle') || 'Create Event', path: null });
      }
      // Event Detail
      else if (params.eventId && !path.includes('/edit')) {
        items.push({ label: t('event.details') || 'Details', path: null });
      }
      // Edit Event
      else if (path.includes('/edit')) {
        if (params.eventId) {
          items.push({ label: t('event.details') || 'Details', path: `/events/${params.eventId}` });
        }
        items.push({ label: t('event.editTitle') || 'Edit Event', path: null });
      }
      // Events Management/List (default)
      else if (path === '/events-management') {
        // Không thêm item thứ 2, chỉ hiển thị "Events"
      }
    }
    // Orders
    else if (path.startsWith('/orders')) {
      items.push({ label: t('sidebar.orders') || 'Đơn hàng', path: '/orders' });
      
      // Order Detail
      if (params.orderId) {
        items.push({ label: t('order.orderDetail') || 'Chi tiết đơn hàng', path: null });
      }
    }
    // Check-in
    else if (path.startsWith('/check-in')) {
      items.push({ label: t('sidebar.checkin') || 'Check-in', path: '/check-in' });
    }
    // Categories
    else if (path.startsWith('/admin/categories')) {
      items.push({ label: t('sidebar.categories') || 'Danh mục', path: '/admin/categories' });
    }
    // Payouts
    else if (path.startsWith('/admin/payouts')) {
      items.push({ label: t('sidebar.payouts') || 'Thanh toán', path: '/admin/payouts' });
    }
    // Refunds
    else if (path.startsWith('/refunds') || path.startsWith('/admin/refunds')) {
      items.push({ label: t('sidebar.refunds') || 'Hoàn tiền', path: path.startsWith('/admin') ? '/admin/refunds' : '/refunds' });
    }

    return items;
  };

  const items = getBreadcrumbItems();

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          {item.path ? (
            <Link
              to={item.path}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

