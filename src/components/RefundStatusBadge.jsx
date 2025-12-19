import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Ban, Loader2 } from 'lucide-react';

const statusConfig = {
  PENDING: {
    label: 'Chờ xử lý',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Clock,
  },
  PROCESSING: {
    label: 'Đang xử lý',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Loader2,
  },
  COMPLETED: {
    label: 'Đã hoàn tiền',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle,
  },
  FAILED: {
    label: 'Thất bại',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle,
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    icon: Ban,
  },
};

export const RefundStatusBadge = ({ status, className = '' }) => {
  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} ${className} flex items-center gap-1.5`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </Badge>
  );
};

