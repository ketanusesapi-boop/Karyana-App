import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import StatCard from './StatCard';
import TopItemsChart from './TopItemsChart';
import PaymentModeStats from './PaymentModeStats';
import { PeriodStats } from '../../types';

type FilterOption = 'today' | 'week' | 'month' | 'all';

const Dashboard: React.FC = () => {
  const { analyticsSummary, loading } = useData();
  const [filter, setFilter] = useState<FilterOption>('all');

  const filteredStats: PeriodStats = useMemo(() => {
    if (!analyticsSummary) return { revenue: 0, profit: 0 };
    
    const now = new Date();
    const todayKey = now.toISOString().split('T')[0];
    const thisMonthKey = todayKey.substring(0, 7);

    switch (filter) {
      case 'today':
        return analyticsSummary.daily[todayKey] || { revenue: 0, profit: 0 };
      case 'month':
        return analyticsSummary.monthly[thisMonthKey] || { revenue: 0, profit: 0 };
      case 'week':
        const weeklyStats: PeriodStats = { revenue: 0, profit: 0 };
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          const dayKey = d.toISOString().split('T')[0];
          if (analyticsSummary.daily[dayKey]) {
            weeklyStats.revenue += analyticsSummary.daily[dayKey].revenue;
            weeklyStats.profit += analyticsSummary.daily[dayKey].profit;
          }
        }
        return weeklyStats;
      case 'all':
      default:
        return {
          revenue: analyticsSummary.allTime.totalRevenue,
          profit: analyticsSummary.allTime.totalProfit,
        };
    }
  }, [analyticsSummary, filter]);

  if (loading || !analyticsSummary) {
    return <div className="text-center p-10">Loading dashboard...</div>;
  }

  const { allTime } = analyticsSummary;

  const FilterButton: React.FC<{ label: string; value: FilterOption; }> = ({ label, value }) => (
    <button
      onClick={() => setFilter(value)}
      className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        filter === value
          ? 'bg-primary text-white'
          : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-text-light dark:text-text-dark'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="bg-card-light dark:bg-card-dark p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold">Performance Overview</h2>
        <p className="text-sm text-subtle-light dark:text-subtle-dark">
          Select a period to see a performance summary. Main cards show all-time stats.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full mt-4">
          <FilterButton label="Today" value="today" />
          <FilterButton label="This Week" value="week" />
          <FilterButton label="This Month" value="month" />
          <FilterButton label="All Time" value="all" />
        </div>
        <div className="mt-4 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
              <h4 className="text-sm font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">Filtered Revenue</h4>
              <p className="mt-1 text-2xl font-semibold text-text-light dark:text-text-dark">₹{filteredStats.revenue.toFixed(2)}</p>
          </div>
          <div>
              <h4 className="text-sm font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">Filtered Profit</h4>
              <p className="mt-1 text-2xl font-semibold text-text-light dark:text-text-dark">₹{filteredStats.profit.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="All-Time Revenue" value={`₹${allTime.totalRevenue.toFixed(2)}`} />
        <StatCard title="All-Time Profit" value={`₹${allTime.totalProfit.toFixed(2)}`} />
        <StatCard title="Total Products" value={String(allTime.totalProducts)} />
        <StatCard title="Items in Stock" value={String(allTime.totalStock)} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card-light dark:bg-card-dark p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Top 5 Selling Items (All Time)</h3>
          {allTime.topSellingItems.length > 0 ? (
            <TopItemsChart data={allTime.topSellingItems} />
          ) : (
            <p className="text-center py-10 text-subtle-light dark:text-subtle-dark">No sales data available to determine top items.</p>
          )}
        </div>
        <PaymentModeStats stats={allTime.paymentModeStats} />
      </div>
    </div>
  );
};

export default Dashboard;
