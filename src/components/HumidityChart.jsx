import React from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const HumidityChart = ({ data, timeframe }) => {
  const formatXAxis = (tick) => {
    const date = new Date(tick);
    if (timeframe.includes('week')) {
      return `${date.getDate()}/${date.getMonth()+1} ${date.getHours()}:00`;
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[400px] w-full flex flex-col">
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-4">
          <div className="h-10 w-1 bg-blue-600 rounded-full"></div>
          <div>
            <h3 className="text-base font-black text-gray-900 uppercase tracking-tighter">Tren Kelembaban</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Histogram & Trend Line</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-blue-400 rounded-sm"></div>
            <span className="text-[9px] font-black text-gray-500 uppercase">Average Humidity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-indigo-600"></div>
            <span className="text-[9px] font-black text-gray-500 uppercase">Movement Trend</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full -ml-8">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
              minTickGap={40}
            />
            <YAxis 
              domain={[0, 100]} 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }}
              ticks={[0, 20, 40, 60, 80, 100]}
            />
            <Tooltip 
              cursor={{ fill: '#F8FAFC' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-4 shadow-2xl rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">
                        {new Date(payload[0].payload.timestamp).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                        <p className="text-xl font-black text-gray-900">{payload[0].value}% <span className="text-xs text-gray-400 uppercase">Humidity</span></p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            <Bar 
              dataKey="val" 
              barSize={timeframe.includes('week') ? 40 : 12}
              radius={[8, 8, 8, 8]}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.val < 60 ? '#FDA4AF' : entry.val > 80 ? '#93C5FD' : '#6EE7B7'} 
                />
              ))}
            </Bar>

            <Line 
              type="monotone" 
              dataKey="val" 
              stroke="#4F46E5" 
              strokeWidth={4}
              dot={false}
              activeDot={{ r: 8, strokeWidth: 0, fill: '#4F46E5' }}
              connectNulls={false}
              animationDuration={1500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HumidityChart;