import { useTranslation } from 'react-i18next';
import Header from '../components/Header';

const Events = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('pages.events.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {t('pages.events.description')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Events;

