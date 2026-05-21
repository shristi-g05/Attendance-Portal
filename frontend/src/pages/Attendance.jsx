import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Calendar, 
  Search, 
  Download, 
  RefreshCw, 
  Loader2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { attendanceService } from '../services/api';

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Date filter (defaults to today)
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await attendanceService.getRecords(dateFilter);
      if (response.success) {
        setRecords(response.records);
      }
    } catch (err) {
      console.error("Error fetching attendance logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [dateFilter]);

  const handleRefresh = () => {
    fetchRecords();
  };

  // Filter records in memory based on SearchQuery (case-insensitive search by name or roll_number)
  const filteredRecords = records.filter(record => 
    record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-transition space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Attendance Sheets</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search and export daily student attendance logs.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-300 shadow-sm active:scale-95"
            title="Refresh logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Download CSV Button */}
          <a
            href={attendanceService.getDownloadUrl(dateFilter)}
            download
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-500/10 glow-btn flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV Sheet</span>
          </a>
        </div>
      </div>

      {/* Filters Bar Card */}
      <div className="glass-panel rounded-3xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Date Selector */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Calendar className="h-4 w-4" />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/40 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 text-sm"
          />
        </div>

        {/* Text Filter Input */}
        <div className="relative md:col-span-2">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/40 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 text-sm"
          />
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="glass-panel rounded-3xl p-6">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Loading attendance sheets...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
            <ClipboardList className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
            <span className="text-base font-semibold">No records found</span>
            <span className="text-xs text-slate-500 mt-1 max-w-xs">There are no face recognition logs recorded on this date matching your search query.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="pb-3 pl-2">Record ID</th>
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Roll Number</th>
                  <th className="pb-3">Log Date</th>
                  <th className="pb-3">Log Time</th>
                  <th className="pb-3 text-right pr-2">Aesthetic Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200">
                    <td className="py-4 pl-2 font-mono text-slate-400 dark:text-slate-500 text-xs">
                      #{record.id}
                    </td>
                    <td className="py-4 font-semibold text-slate-800 dark:text-slate-200">
                      {record.name}
                    </td>
                    <td className="py-4 font-mono text-slate-500 dark:text-slate-400 text-xs">
                      {record.roll_number}
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">
                      {record.date}
                    </td>
                    <td className="py-4 text-slate-500 dark:text-slate-400 font-medium">
                      {record.time}
                    </td>
                    <td className="py-4 text-right pr-2">
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/30 dark:border-emerald-800/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{record.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
