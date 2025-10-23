import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  quantity: number;
}

interface TopItemsChartProps {
  data: ChartData[];
}

const TopItemsChart: React.FC<TopItemsChartProps> = ({ data }) => {
  const isDark = true;
  const tickColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <BarChart
                data={data}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                layout="vertical"
            >
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(100, 116, 139, 0.3)" : "rgba(128, 128, 128, 0.2)"} />
                <XAxis type="number" stroke={tickColor} />
                <YAxis dataKey="name" type="category" width={80} stroke={tickColor} tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.5)'}}
                  contentStyle={{
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    borderRadius: '0.5rem'
                  }}
                />
                <Legend />
                <Bar dataKey="quantity" fill="#0284c7" name="Units Sold" />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};

export default TopItemsChart;