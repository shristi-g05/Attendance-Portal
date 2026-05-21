import React from 'react';

const StatsCard = ({ title, value, icon: Icon, description, trend, colorClass = "from-indigo-500 to-purple-600" }) => {
  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 group hover:-translate-y-0.5">
      {/* Decorative background gradient glow */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-gradient-to-br opacity-5 dark:opacity-10 blur-xl group-hover:scale-125 transition-transform duration-500 from-indigo-500 to-purple-600"></div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass} text-white shadow-md shadow-indigo-500/10`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</span>
        {trend && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            {trend}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 flex items-center">
          {description}
        </p>
      )}
    </div>
  );
};

export default StatsCard;
