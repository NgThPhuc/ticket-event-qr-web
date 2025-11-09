import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import Header from '../components/Header';

export function DashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <Header showSidebar={true} />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

