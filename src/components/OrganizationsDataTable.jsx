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
import { Building2, Users, Eye, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const getRoleLabel = (role, t) => {
  const roleKey = `roles.${role}`;
  return t(roleKey) || role;
};

export function OrganizationsDataTable({ 
  organizations, 
  t 
}) {
  const navigate = useNavigate();
  const { t: translate } = useTranslation();
  const translation = t || translate;

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('organization.name') || 'Name',
        cell: ({ row }) => {
          const org = row.original;
          const orgId = org.organization_id || org._organizationId || org.id;
          const initial = org.name?.charAt(0).toUpperCase() || 'O';
          
          return (
            <div className="flex items-center gap-3">
              {org.logo_url ? (
                <img
                  src={org.logo_url}
                  alt={org.name}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                    {initial}
                  </span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-medium">{org.name || '-'}</span>
                {org.description && (
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {org.description}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'contact_email',
        header: t('organization.email') || 'Email',
        cell: ({ row }) => {
          return (
            <div className="text-muted-foreground">
              {row.original.contact_email || '-'}
            </div>
          );
        },
      },
      {
        accessorKey: 'role',
        header: t('organization.role') || 'Role',
        cell: ({ row }) => {
          const role = row.original.role;
          return (
            <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {getRoleLabel(role, translation)}
            </div>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: t('organization.createdAt') || 'Created',
        cell: ({ row }) => {
          const date = row.original.created_at;
          if (!date) return '-';
          return (
            <div className="text-muted-foreground">
              {new Date(date).toLocaleDateString()}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 gap-1"
                >
                  <Building2 className="h-4 w-4" />
                  {t('organization.create') || 'Organization'}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/create-organization')}>
                  <Building2 className="mr-2 h-4 w-4" />
                  {t('organization.create') || 'Create Organization'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // Navigate to members page of first organization if available
                  const firstOrg = organizations[0];
                  if (firstOrg) {
                    const orgId = firstOrg.organization_id || firstOrg._organizationId || firstOrg.id;
                    navigate(`/organizations/${orgId}/members`);
                  }
                }}>
                  <Users className="mr-2 h-4 w-4" />
                  {t('dashboard.manageMembers') || 'Manage Members'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        cell: ({ row }) => {
          const org = row.original;
          const orgId = org.organization_id || org._organizationId || org.id;
          
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/organizations/${orgId}`)}
                className="h-8 gap-1"
              >
                <Eye className="h-4 w-4" />
                {t('dashboard.viewDetails') || 'View Details'}
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/organizations/${orgId}/members`)}
                className="h-8 gap-1"
              >
                <Users className="h-4 w-4" />
                {t('dashboard.manageMembers') || 'Members'}
              </Button>
            </div>
          );
        },
      },
    ],
    [navigate, t, organizations]
  );

  const table = useReactTable({
    data: organizations,
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
                {t('dashboard.noOrganizations') || 'No organizations found'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

