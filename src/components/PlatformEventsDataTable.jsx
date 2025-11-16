import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const getStatusBadgeVariant = (status) => {
  const variantMap = {
    'DRAFT': 'secondary',
    'SCHEDULED': 'default',
    'PUBLISHED': 'default',
    'POSTPONED': 'outline',
    'CANCELLED': 'destructive',
    'COMPLETED': 'default',
  };
  return variantMap[status] || 'outline';
};

const getAttendanceModeLabel = (mode) => {
  const modeMap = {
    'OFFLINE': 'Offline',
    'ONLINE': 'Online',
    'HYBRID': 'Hybrid',
  };
  return modeMap[mode] || mode;
};

export function PlatformEventsDataTable({ 
  events, 
  onView,
  onEdit,
  onDelete,
}) {
  const { t } = useTranslation();

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: t('eventsManagement.table.event') || 'EVENT',
        cell: ({ row }) => {
          const event = row.original;
          
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{event.title || '-'}</span>
                {event.subtitle && (
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {event.subtitle}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'organization',
        header: t('eventsManagement.table.organization') || 'ORGANIZATION',
        cell: ({ row }) => {
          const org = row.original.organization;
          if (!org) return '-';
          
          return (
            <div className="text-muted-foreground">
              {org.name || '-'}
            </div>
          );
        },
      },
      {
        accessorKey: 'attendance_mode',
        header: t('eventsManagement.table.attendanceMode') || 'MODE',
        cell: ({ row }) => {
          const mode = row.original.attendance_mode;
          return (
            <Badge variant="outline">
              {getAttendanceModeLabel(mode)}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('eventsManagement.table.status') || 'STATUS',
        cell: ({ row }) => {
          const status = row.original.status;
          const statusKey = `event.${status.toLowerCase()}`;
          return (
            <Badge variant={getStatusBadgeVariant(status)}>
              {t(statusKey) || status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'start_at',
        header: t('eventsManagement.table.startAt') || 'START DATE',
        cell: ({ row }) => {
          const date = row.original.start_at;
          if (!date) return '-';
          const startDate = new Date(date);
          return (
            <div className="text-muted-foreground">
              {startDate.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })} {startDate.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => (
          <div className="flex justify-end">
            {t('eventsManagement.table.actions') || 'ACTIONS'}
          </div>
        ),
        cell: ({ row }) => {
          const event = row.original;
          
          return (
            <div className="flex justify-end gap-2">
              {onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(event.id)}
                  className="h-8 gap-1"
                >
                  <Eye className="h-4 w-4" />
                  {t('eventsManagement.actions.view') || 'View'}
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(event.id)}
                  className="h-8 gap-1"
                >
                  <Edit className="h-4 w-4" />
                  {t('eventsManagement.actions.edit') || 'Edit'}
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(event.id, event.title)}
                  className="h-8 gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('eventsManagement.actions.delete') || 'Delete'}
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [t, onView, onEdit, onDelete]
  );

  const table = useReactTable({
    data: events,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                {t('eventsManagement.noEvents') || 'No events found'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

