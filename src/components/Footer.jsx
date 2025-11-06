import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4 md:px-16 lg:px-24 py-12">
        {/* Main Footer Content */}
        <div className="flex flex-col gap-12 mb-12">
          {/* Top Section */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
            {/* Left Section - Logo & About */}
            <div className="flex flex-col gap-14 flex-1">
              {/* Logo & Description */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
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
                </div>
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl font-medium text-gray-900 dark:text-white">
                    {t('footer.whoWeAre')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
                    {t('footer.description')}
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xl font-medium text-gray-900 dark:text-white">
                  {t('footer.contact')}
                </h4>
                <p className="text-base text-gray-500 dark:text-gray-400">
                  Ticketercontacts@gmail.com
                </p>
              </div>
            </div>

            {/* Right Section - Links */}
            <div className="flex flex-1 items-start justify-between gap-8 lg:gap-12">
              {/* TICKETER Column */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-2xl font-medium text-gray-900 dark:text-white">
                    TICKETER
                  </h4>
                  <div className="h-0.5 w-30 bg-gray-300 dark:bg-gray-600"></div>
                </div>
                <Link
                  to="/about"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {t('footer.aboutUs')}
                </Link>
                <Link
                  to="/contact"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {t('footer.contactUs')}
                </Link>
                <Link
                  to="/faqs"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {t('footer.faqs')}
                </Link>
              </div>

              {/* Help Column */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-2xl font-medium text-gray-900 dark:text-white">
                    {t('footer.help')}
                  </h4>
                  <div className="h-0.5 w-16 bg-gray-300 dark:bg-gray-600"></div>
                </div>
                <Link
                  to="/help/concert-ticketing"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {t('footer.concertTicketing')}
                </Link>
                <Link
                  to="/help/account-support"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {t('footer.accountSupport')}
                </Link>
                <Link
                  to="/help/terms-conditions"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {t('footer.termsConditions')}
                </Link>
              </div>

              {/* Legal Column */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-2xl font-medium text-gray-900 dark:text-white">
                    {t('footer.legal')}
                  </h4>
                  <div className="h-0.5 w-16 bg-gray-300 dark:bg-gray-600"></div>
                </div>
                <Link
                  to="/legal/terms"
                  className="text-base text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {t('footer.termsOfUs')}
                </Link>
                <Link
                  to="/legal/acceptable"
                  className="text-base text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {t('footer.acceptable')}
                </Link>
                <Link
                  to="/legal/privacy"
                  className="text-base text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {t('footer.privacyPolicy')}
                </Link>
              </div>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="flex flex-col gap-14">
            <div className="h-0.5 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="flex flex-col gap-2">
                <p className="text-2xl font-medium text-gray-500 dark:text-gray-400">
                  {t('footer.newsletterTitle')}
                </p>
                <p className="text-2xl font-medium text-gray-500 dark:text-gray-400">
                  {t('footer.newsletterSubtitle')}
                </p>
              </div>
              <div className="flex-1 max-w-md w-full">
                <div className="flex items-center justify-between gap-4 p-4 border border-gray-400 dark:border-gray-600 rounded-2xl">
                  <div className="flex items-center gap-2 flex-1">
                    <svg
                      className="w-5 h-5 text-gray-500 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <input
                      type="email"
                      placeholder={t('footer.enterEmail')}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-gray-500 dark:text-gray-400 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label="Subscribe"
                  >
                    <svg
                      className="w-6 h-6 text-gray-500 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="h-0.5 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright */}
          <p className="text-base text-gray-500 dark:text-gray-400 whitespace-nowrap">
            @2024 NOT FULLTIME PVT.LTD.
          </p>

          {/* Links */}
          <div className="flex items-center gap-8">
            <Link
              to="/legal/terms"
              className="text-base font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {t('footer.terms')}
            </Link>
            <Link
              to="/legal/privacy"
              className="text-base font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {t('footer.privacy')}
            </Link>
            <Link
              to="/legal/cookies"
              className="text-base font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {t('footer.cookies')}
            </Link>
          </div>

          {/* Social Media Icons */}
          <div className="flex items-center gap-6">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              aria-label="Twitter"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>
            <a
              href="https://telegram.org"
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              aria-label="Telegram"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              aria-label="Facebook"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

