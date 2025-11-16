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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

const getRoleLabel = (role, t) => {
  const roleKey = `roles.${role}`;
  return t(roleKey) || role;
};

export function MembersDataTable({
  members,
  roles,
  currentUserId,
  onUpdateRole,
  onRemoveMember,
  onAddMember,
  t
}) {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('members.name'),
        cell: ({ row }) => {
          const member = row.original;
          const name = member.user?.full_name || t('members.unknown');
          const initial = name.charAt(0).toUpperCase();
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                  {initial}
                </span>
              </div>
              <span className="font-medium">{name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'email',
        header: t('members.email'),
        cell: ({ row }) => {
          return (
            <div className="text-muted-foreground">
              {row.original.user?.email || '-'}
            </div>
          );
        },
      },
      {
        accessorKey: 'role',
        header: t('members.role'),
        cell: ({ row }) => {
          const member = row.original;
          const isCurrentUser = member.user_id === currentUserId;
          const isAdmin = member.role === 'ORGANIZER_ADMIN';
          // Chỉ cho phép chỉnh sửa nếu không phải current user và không phải admin
          const canEdit = !isCurrentUser && !isAdmin;

          if (!canEdit) {
            return (
              <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                {getRoleLabel(member.role, t)}
              </div>
            );
          }

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 gap-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 border-blue-300 dark:border-blue-700"
                >
                  {getRoleLabel(member.role, t)}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {roles.map((role) => (
                  <DropdownMenuItem
                    key={role.value}
                    onClick={() => onUpdateRole(member.id, role.value)}
                  >
                    {role.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
      {
        accessorKey: 'joined_at',
        header: t('members.joined'),
        cell: ({ row }) => {
          const date = row.original.joined_at;
          if (!date) return '-';

          const d = new Date(date);

          return (
            <div className="text-muted-foreground">
              {d.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          );
        },
      },

      {
        id: 'actions',
        header: () => (
          <div className="flex justify-end">
            {t('members.actions') || 'Actions'}
          </div>
        ),
        cell: ({ row }) => {
          const member = row.original;
          const isCurrentUser = member.user_id === currentUserId;

          if (isCurrentUser) {
            return null;
          }

          return (
            <div className="flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemoveMember(member.id)}
                className="h-8"
              >
                {t('members.remove')}
              </Button>
            </div>
          );
        },
      },
    ],
    [roles, currentUserId, onUpdateRole, onRemoveMember, onAddMember, t]
  );

  const table = useReactTable({
    data: members,
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
                {t('members.noMembers')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

