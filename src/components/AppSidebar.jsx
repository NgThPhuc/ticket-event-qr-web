import {
  Settings,
  LogOut,
  LayoutDashboard,
  User,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MENU_CONFIG = [
  {
    key: 'dashboard',
    icon: LayoutDashboard,
    titleKey: 'sidebar.dashboard',
    url: '/dashboard',
  },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { state } = useSidebar();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderMenuItem = (item) => {
    const Icon = item.icon;

    return (
      <SidebarMenuItem key={item.key}>
        <SidebarMenuButton asChild>
          <Link to={item.url}>
            {Icon && <Icon />}
            <span>{t(item.titleKey)}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-4 h-[69px]">
        <div
          className={`flex items-center w-full ${state === 'collapsed'
            ? 'justify-center gap-0'
            : 'justify-start gap-2'
            }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 flex-shrink-0">
            <span className="text-lg font-bold text-white">T</span>
          </div>
          {state !== 'collapsed' && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Ticketer</span>
              <span className="text-xs text-muted-foreground">
                Event Management
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {MENU_CONFIG.map((item) => renderMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

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
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </span>
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
                      <span className="text-xs text-muted-foreground">
                        {user?.email}
                      </span>
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
