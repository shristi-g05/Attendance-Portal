import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AttendanceChart = ({ data }) => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400">
        <p className="text-sm">No recent attendance trends available</p>
        <p className="text-xs text-slate-500 mt-1">Start recognition sessions to view charts</p>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
            </linearGradient>
            <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1e293b" : "#e2e8f0"} />
          <XAxis 
            dataKey="date" 
            tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
              borderColor: isDarkMode ? '#334155' : '#e2e8f0',
              borderRadius: '12px',
              color: isDarkMode ? '#f8fafc' : '#0f172a',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend />
          <Area 
            type="monotone" 
            name="Present"
            dataKey="present" 
            stroke="#6366f1" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorPresent)" 
          />
          <Area 
            type="monotone" 
            name="Absent"
            dataKey="absent" 
            stroke="#f43f5e" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorAbsent)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;
