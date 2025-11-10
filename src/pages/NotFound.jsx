import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* 404 Number */}
          <div className="mb-6">
            <h1 className="text-9xl font-bold text-blue-600 dark:text-blue-400">404</h1>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
              {t('notFound.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              {t('notFound.message')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('notFound.description')}
            </p>
          </div>

          {/* Illustration */}
          <div className="mb-8 flex justify-center">
            <svg
              className="w-48 h-48 text-gray-300 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link to="/">
              <button>{t('notFound.goHome')}</button>
            </Link>
            <div className="flex gap-4 justify-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
              >
                {t('notFound.login')}
              </Link>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <Link
                to="/register"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
              >
                {t('notFound.register')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

