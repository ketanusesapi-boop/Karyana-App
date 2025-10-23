import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
  return (
    <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-md">
      <h3 className="text-sm font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">{title}</h3>
      <p className="mt-1 text-3xl font-semibold text-text-light dark:text-text-dark">{value}</p>
    </div>
  );
};

export default StatCard;
