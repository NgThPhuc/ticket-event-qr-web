import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ui/ThemeToggle';
import LanguageToggle from './ui/LanguageToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { getMyOrganizations, getAllOrganizations } from '../api/organizations';

const Header = ({ showSidebar = false }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [hasOrganizations, setHasOrganizations] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const menuItems = [
    { label: t('header.home'), path: '/' },
    { label: t('header.events'), path: '/events' },
    { label: t('header.policy'), path: '/policy' },
    { label: t('header.contact'), path: '/contact' },
  ];

  const handleLogout = async () => {
    await logout();
    setHasOrganizations(false);
    setIsPlatformAdmin(false);
    // Vẫn ở lại trang chủ sau khi đăng xuất
  };

  // Kiểm tra xem user có organizations không
  // PLATFORM_ADMIN luôn hiển thị Dashboard, không cần check organizations
  useEffect(() => {
    const checkOrganizations = async () => {
      if (isAuthenticated) {
        // Kiểm tra xem có phải PLATFORM_ADMIN không bằng cách thử gọi API /organizations
        // (chỉ PLATFORM_ADMIN mới có quyền truy cập endpoint này)
        try {
          await getAllOrganizations();
          // Nếu thành công, đây là PLATFORM_ADMIN
          setIsPlatformAdmin(true);
          setHasOrganizations(true);
          return;
        } catch (error) {
          // Nếu lỗi 403, không phải PLATFORM_ADMIN
          setIsPlatformAdmin(false);
          // Tiếp tục check organizations của user
          try {
            const orgs = await getMyOrganizations();
            setHasOrganizations(orgs && orgs.length > 0);
          } catch (err) {
            setHasOrganizations(false);
          }
        }
      } else {
        setIsPlatformAdmin(false);
        setHasOrganizations(false);
      }
    };

    checkOrganizations();
  }, [isAuthenticated, user]);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className={showSidebar ? "px-4" : "container mx-auto px-4"}>
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Sidebar Trigger - chỉ hiển thị khi showSidebar = true */}
          {showSidebar && (
            <SidebarTrigger className="mr-4" />
          )}

          {/* Logo - ẩn khi showSidebar = true */}
          {!showSidebar && (
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
            </div>
              <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Ticketer
              </span>
            </Link>
          )}

          {/* Desktop Menu - ẩn khi showSidebar = true */}
          {!showSidebar && (
            <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-base transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
            </nav>
          )}

          {/* Right Side - Theme Toggle, Language Toggle & Auth Button */}
          <div className={`flex items-center gap-4 md:gap-6 ${showSidebar ? 'ml-auto' : ''}`}>
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Language Toggle */}
            <LanguageToggle />

            {/* Dashboard Button - Hiển thị khi user có organizations hoặc là PLATFORM_ADMIN - ẩn khi showSidebar = true */}
            {!showSidebar && isAuthenticated && (hasOrganizations || isPlatformAdmin) && (
              <Link
                to="/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="text-sm font-medium">{t('header.dashboard')}</span>
              </Link>
            )}

            {/* Create Organizer Button - Hiển thị khi user chưa có organizations và không phải PLATFORM_ADMIN - ẩn khi showSidebar = true */}
            {!showSidebar && isAuthenticated && !hasOrganizations && !isPlatformAdmin && (
              <Link
                to="/create-organization"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="text-sm font-medium">{t('header.createOrganizer')}</span>
              </Link>
            )}

            {/* Auth Button - ẩn khi showSidebar = true */}
            {!showSidebar && isAuthenticated ? (
              <div className="relative group">
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center gap-2 px-4 md:px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 hover:border-blue-600 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 bg-white dark:bg-gray-800"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="hidden md:inline text-sm font-normal">
                    {user?.full_name || t('header.account')}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {accountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      {t('header.myProfile')}
                    </Link>
                    <Link
                      to="/my-tickets"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      {t('header.myTickets')}
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setAccountMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {t('header.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : !showSidebar ? (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 md:px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-sm font-medium">{t('header.loginRegister')}</span>
              </Link>
            ) : null}

            {/* Mobile Menu Toggle - ẩn khi showSidebar = true */}
            {!showSidebar && (
              <button
                className="md:hidden p-2 text-gray-700 dark:text-gray-300"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu - ẩn khi showSidebar = true */}
        {!showSidebar && mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
            <nav className="flex flex-col gap-4">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2 transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {isAuthenticated && (hasOrganizations || isPlatformAdmin) && (
                <Link
                  to="/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium py-2 transition-colors duration-200 flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  {t('header.dashboard')}
                </Link>
              )}
              {isAuthenticated && !hasOrganizations && !isPlatformAdmin && (
                <Link
                  to="/create-organization"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium py-2 transition-colors duration-200 flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {t('header.createOrganizer')}
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

