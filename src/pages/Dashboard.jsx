import React from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '../layouts/DashboardLayout';

const Dashboard = () => {
  const { t } = useTranslation();
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('dashboard.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('dashboard.subtitle')}
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;