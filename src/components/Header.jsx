import { SidebarTrigger } from '@/components/ui/sidebar';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { Breadcrumb } from './Breadcrumb';
import LanguageToggle from './ui/LanguageToggle';
import ThemeToggle from './ui/ThemeToggle';

const Header = ({ showSidebar = false }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Kiểm tra PLATFORM_ADMIN trực tiếp từ user object
  const isPlatformAdmin = user?.platform_role === 'PLATFORM_ADMIN';
  
  // Sử dụng user.organizations từ profile thay vì gọi API
  const hasOrganizations = isPlatformAdmin || (user?.organizations && user.organizations.length > 0);

  const menuItems = [
    { label: t('header.home'), path: '/' },
    { label: t('header.events'), path: '/events' },
    { label: t('header.policy'), path: '/policy' },
    { label: t('header.contact'), path: '/contact' },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className={showSidebar ? "px-4" : "container mx-auto px-4"}>
        {/* <div className="flex items-center justify-between h-16 md:h-20"> */}
        <div className="flex items-center justify-between h-[60px] md:h-[68px] relative">
          {/* Left side - Sidebar Trigger và Breadcrumb (khi có sidebar) hoặc Logo (khi không có sidebar) */}
          {showSidebar ? (
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <SidebarTrigger className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Breadcrumb />
              </div>
            </div>
          ) : (
            <>
              {/* Logo - bên trái */}
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

              {/* Desktop Menu - căn giữa */}
              <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
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
            </>
          )}

          {/* Right Side - Theme Toggle, Language Toggle & Auth Button */}
          <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
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
                      to="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      {t('header.myTickets')}
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      {t('header.settings')}
                    </Link>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
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
              <button
                onClick={() => openAuthModal('login')}
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
              </button>
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
              {/* Nút đăng nhập cho mobile menu */}
              {!isAuthenticated && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2 transition-colors duration-200 flex items-center gap-2"
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {t('header.loginRegister')}
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header >
  );
};

export default Header;

