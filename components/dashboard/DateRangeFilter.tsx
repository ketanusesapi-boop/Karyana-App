import React, { useState } from 'react';
import { DateRange } from '../../types';

type FilterOption = 'today' | 'week' | 'month' | 'all';

interface DateRangeFilterProps {
  onDateRangeChange: (range: DateRange) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onDateRangeChange }) => {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  const handleFilterChange = (filter: FilterOption) => {
    setActiveFilter(filter);
    const now = new Date();
    let startDate: Date | null = new Date();
    let endDate: Date | null = new Date();

    switch (filter) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(); // Today is the end of the week so far
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'all':
      default:
        startDate = null;
        endDate = null;
        break;
    }
    onDateRangeChange({ startDate, endDate });
  };
  
  const FilterButton: React.FC<{
    label: string;
    filter: FilterOption;
  }> = ({ label, filter }) => (
     <button
        onClick={() => handleFilterChange(filter)}
        className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activeFilter === filter
            ? 'bg-primary text-white'
            : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-text-light dark:text-text-dark'
        }`}
      >
        {label}
      </button>
  );

  return (
    <div className="bg-card-light dark:bg-card-dark p-4 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="text-sm font-semibold shrink-0">Filter by:</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
            <FilterButton label="Today" filter="today" />
            <FilterButton label="This Week" filter="week" />
            <FilterButton label="This Month" filter="month" />
            <FilterButton label="All Time" filter="all" />
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;