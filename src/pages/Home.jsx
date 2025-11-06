import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Header from '../components/Header';

const Home = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-4">
            {t('home.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            {t('home.subtitle')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;

