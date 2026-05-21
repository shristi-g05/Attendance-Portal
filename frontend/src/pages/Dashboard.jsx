import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Percent, 
  Calendar, 
  RefreshCw, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import AttendanceChart from '../components/AttendanceChart';
import { attendanceService } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_students: 0,
    present_today: 0,
    absent_today: 0,
    attendance_rate: 0,
    trends: []
  });
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const todayDateStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const fetchData = async () => {
    try {
      const statsRes = await attendanceService.getStats();
      if (statsRes.success) {
        setStats({
          total_students: statsRes.total_students,
          present_today: statsRes.present_today,
          absent_today: statsRes.absent_today,
          attendance_rate: statsRes.attendance_rate,
          trends: statsRes.trends
        });
      }
      
      const todayIsoStr = new Date().toISOString().split('T')[0];
      const recordsRes = await attendanceService.getRecords(todayIsoStr);
      if (recordsRes.success) {
        setRecentRecords(recordsRes.records.slice(0, 5)); // show latest 5
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border-2 border-indigo-500 border-t-transparent animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading Dashboard Metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition space-y-8">
      {/* Dashboard Top Heading */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <span>{todayDateStr}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-300 shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/webcam-session"
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/10 glow-btn flex items-center space-x-2"
          >
            <span>Start Session</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Students"
          value={stats.total_students}
          icon={Users}
          colorClass="from-blue-500 to-indigo-600"
          description="Registered profiles in AI database"
        />
        <StatsCard 
          title="Present Today"
          value={stats.present_today}
          icon={UserCheck}
          colorClass="from-emerald-500 to-teal-600"
          description="Students recognized today"
        />
        <StatsCard 
          title="Absent Today"
          value={stats.absent_today}
          icon={UserX}
          colorClass="from-rose-500 to-pink-600"
          description="Pending/unmarked students"
        />
        <StatsCard 
          title="Attendance Rate"
          value={`${stats.attendance_rate}%`}
          icon={Percent}
          colorClass="from-amber-500 to-orange-600"
          description="Average daily compliance rate"
        />
      </div>

      {/* Analytics Section & Live Presence logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Recharts) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                <span>Attendance Compliance Curves</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Analysis logs over the last 7 sessions</p>
            </div>
          </div>
          <AttendanceChart data={stats.trends} />
        </div>

        {/* Present Logs Card */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Live Check-ins</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Most recent scans checked in today</p>
            
            <div className="space-y-4">
              {recentRecords.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center text-slate-400">
                  <span className="text-sm font-medium">No check-ins today yet</span>
                  <span className="text-xs text-slate-500 mt-1">Open camera to record logs</span>
                </div>
              ) : (
                recentRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/20">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{record.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{record.roll_number}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
                        {record.time}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {recentRecords.length > 0 && (
            <Link
              to="/attendance"
              className="mt-6 text-center text-xs font-semibold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center space-x-1 hover:underline"
            >
              <span>View Full Attendance Sheet</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
