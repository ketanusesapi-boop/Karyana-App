import React, { useState } from 'react';
import { DateRange } from '../../types';

type FilterOption = 'today' | 'week' | 'month' | 'all' | 'custom';

interface DateRangeFilterProps {
  onDateRangeChange: (range: DateRange) => void;
}

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zM3 8.5a.5.5 0 01.5-.5h13a.5.5 0 010 1H3.5a.5.5 0 01-.5-.5z" clipRule="evenodd" />
    </svg>
);


const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onDateRangeChange }) => {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [customDateValue, setCustomDateValue] = useState('');

  const handleFilterChange = (filter: FilterOption) => {
    setActiveFilter(filter);
    setCustomDateValue(''); // Clear custom date when a preset is chosen
    
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
        endDate = new Date();
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
  
  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    setCustomDateValue(dateStr);

    if (dateStr) {
      setActiveFilter('custom');
      const parts = dateStr.split('-').map(p => parseInt(p, 10));
      const startDate = new Date(parts[0], parts[1] - 1, parts[2]);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      onDateRangeChange({ startDate, endDate });
    } else {
      handleFilterChange('all');
    }
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
    <div className="space-y-3">
        <div className="flex justify-between items-center">
            <span className="text-sm font-semibold shrink-0">
                Filter by: {activeFilter === 'custom' && customDateValue && 
                    <span className="font-normal text-subtle-dark ml-2">
                        {new Date(customDateValue.replace(/-/g, '/')).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                        })}
                    </span>
                }
            </span>
            <div className="relative">
                <label
                    htmlFor="custom-date-input"
                    className="p-2 rounded-full transition-colors cursor-pointer text-subtle-dark hover:bg-slate-700"
                >
                    <CalendarIcon />
                </label>
                <input
                    id="custom-date-input"
                    type="date"
                    value={customDateValue}
                    onChange={handleCustomDateChange}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Select a custom date"
                />
            </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
            <FilterButton label="Today" filter="today" />
            <FilterButton label="This Week" filter="week" />
            <FilterButton label="This Month" filter="month" />
            <FilterButton label="All Time" filter="all" />
        </div>
    </div>
  );
};

export default DateRangeFilter;