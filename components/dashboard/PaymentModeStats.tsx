import React, { useState } from 'react';
import { PaymentMode } from '../../types';

interface PaymentModeStatsProps {
  stats: { [key in PaymentMode]: number };
}

const PaymentModeStats: React.FC<PaymentModeStatsProps> = ({ stats }) => {
  const [selectedMode, setSelectedMode] = useState<PaymentMode>(PaymentMode.Cash);

  const paymentModes = Object.values(PaymentMode);

  return (
    <div className="bg-card-dark p-4 sm:p-6 rounded-lg shadow-md h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4">Revenue by Payment</h3>
      <div className="flex-grow flex flex-col justify-center items-center">
        <p className="text-5xl font-bold text-text-dark">
          ₹{stats[selectedMode].toFixed(2)}
        </p>
        <p className="mt-2 text-lg text-subtle-dark">
          from {selectedMode}
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        {paymentModes.map(mode => (
          <button
            key={mode}
            onClick={() => setSelectedMode(mode)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedMode === mode
                ? 'bg-primary text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-subtle-dark'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PaymentModeStats;
