import { useState, useEffect } from 'react';
import { Settings, LogOut, UsersRound, LayoutDashboard, User, ChevronRight } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getMyOrganizations } from '../api/organizations';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { state } = useSidebar();
  const [organizations, setOrganizations] = useState([]);

  // Kiểm tra xem có đang ở trang members không để giữ submenu mở
  const isMembersPage = location.pathname.includes('/members');
  const [isOpen, setIsOpen] = useState(isMembersPage);

  // Cập nhật state khi route thay đổi
  useEffect(() => {
    setIsOpen(isMembersPage);
  }, [isMembersPage]);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchOrganizations = async () => {
        try {
          const data = await getMyOrganizations();
          const processedData = (data || []).map((org) => {
            const orgId = org.organization_id || org.id;
            return {
              ...org,
              _organizationId: orgId,
            };
          });
          setOrganizations(processedData);
        } catch (err) {
          console.error('Error fetching organizations:', err);
        }
      };
      fetchOrganizations();
    }
  }, [isAuthenticated]);

  const menuItems = [
    {
      title: t('sidebar.dashboard'),
      url: '/dashboard',
      icon: LayoutDashboard,
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-4 h-[69px]">
        <div className={`flex items-center w-full ${state === 'collapsed' ? 'justify-center gap-0' : 'justify-start gap-2'}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 flex-shrink-0">
            <span className="text-lg font-bold text-white">T</span>
          </div>
          {state !== 'collapsed' && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Ticketer</span>
              <span className="text-xs text-muted-foreground">Event Management</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>{t('sidebar.navigation')}</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <Collapsible asChild open={isOpen} onOpenChange={setIsOpen}>
                <SidebarMenuItem className="group/collapsible">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <UsersRound />
                      <span>{t('sidebar.organizations')}</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-300 ease-in-out group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          {organizations.length > 0 ? (
                            <Link to="/organizations/my-organizations">
                              <span>{t('sidebar.overview') || 'Overviews'}</span>
                            </Link>
                          ) : (
                            <span>{t('sidebar.overview') || 'Overview'}</span>
                          )}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          {organizations.length > 0 ? (
                            <Link to={`/organizations/${organizations[0]?.organization_id || organizations[0]?._organizationId || organizations[0]?.id}/members`}>
                              <span>{t('sidebar.manageMembers') || 'Manage Members'}</span>
                            </Link>
                          ) : (
                            <span>{t('sidebar.manageMembers') || 'Manage Members'}</span>
                          )}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.account')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/create-organization">
                    <Building2 />
                    <span>{t('organization.create')}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings />
                  <span>{t('header.settings')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}
      </SidebarContent>

      {/* <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          {state !== 'collapsed' ? (
            <>
              <SidebarMenuItem>
                <div className="flex items-center gap-3 px-2 py-1.5 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white flex-shrink-0">
                    {user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="font-medium truncate">{user?.full_name}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                  </div>
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut />
                  <span>{t('header.logout')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          ) : (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    {user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user?.full_name}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('header.account')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t('header.settings')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('header.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter> */}

      <SidebarFooter className={`border-t ${state === 'collapsed' ? 'p-2' : 'p-4'}`}>
        <SidebarMenu className={state === 'collapsed' ? 'flex justify-center' : ''}>
          {state !== 'collapsed' ? (
            <>
              <SidebarMenuItem>
                <div className="flex items-center gap-3 px-2 py-1.5 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white flex-shrink-0">
                    {user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="font-medium truncate">{user?.full_name}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                  </div>
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut />
                  <span>{t('header.logout')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          ) : (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    {user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user?.full_name}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('header.account')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t('header.settings')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('header.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

