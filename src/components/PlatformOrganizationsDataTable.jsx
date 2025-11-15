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
import { Eye, Pencil, Users, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function PlatformOrganizationsDataTable({ 
  organizations, 
  onView,
  onEdit,
  onMembers,
  onDelete,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const columns = useMemo(
    () => [
      {
        accessorKey: 'organization',
        header: t('organizationsManagement.table.organization') || 'ORGANIZATION',
        cell: ({ row }) => {
          const org = row.original;
          const initial = org.name?.charAt(0).toUpperCase() || 'O';
          
          return (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-gray-900 dark:text-white">
                {org.name || '-'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {org.slug || '-'}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'owner',
        header: t('organizationsManagement.table.owner') || 'OWNER',
        cell: ({ row }) => {
          const owner = row.original.owner;
          return (
            <div className="text-muted-foreground">
              {owner?.email || '-'}
            </div>
          );
        },
      },
      {
        accessorKey: 'members',
        header: t('organizationsManagement.table.members') || 'MEMBERS',
        cell: ({ row }) => {
          const count = row.original._count?.members || 0;
          return (
            <div className="text-muted-foreground">
              {count} {count === 1 ? t('organizationsManagement.table.member') || 'member' : t('organizationsManagement.table.members') || 'members'}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('organizationsManagement.table.status') || 'STATUS',
        cell: ({ row }) => {
          const isActive = row.original.is_active;
          return (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              isActive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {isActive 
                ? t('organization.active') || 'Active' 
                : t('organization.inactive') || 'Inactive'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: t('organizationsManagement.table.actions') || 'ACTIONS',
        cell: ({ row }) => {
          const org = row.original;
          const orgId = org.id;
          
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onView) {
                    onView(orgId);
                  } else {
                    navigate(`/organizations/${orgId}`);
                  }
                }}
                className="h-8 gap-1"
              >
                <Eye className="h-4 w-4" />
                {t('organizationsManagement.actions.view') || 'View'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onEdit) {
                    onEdit(orgId);
                  } else {
                    navigate(`/organizations/${orgId}/edit`);
                  }
                }}
                className="h-8 gap-1"
              >
                <Pencil className="h-4 w-4" />
                {t('organizationsManagement.actions.edit') || 'Edit'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onMembers) {
                    onMembers(orgId);
                  } else {
                    navigate(`/organizations/${orgId}/members`);
                  }
                }}
                className="h-8 gap-1"
              >
                <Users className="h-4 w-4" />
                {t('organizationsManagement.actions.members') || 'Members'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (onDelete) {
                    onDelete(orgId, org.name);
                  }
                }}
                className="h-8 gap-1"
              >
                <Trash2 className="h-4 w-4" />
                {t('organizationsManagement.actions.delete') || 'Delete'}
              </Button>
            </div>
          );
        },
      },
    ],
    [navigate, t, onView, onEdit, onMembers, onDelete]
  );

  const table = useReactTable({
    data: organizations || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border bg-white dark:bg-gray-800">
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
                {t('organizationsManagement.noOrganizations') || 'No organizations found'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

