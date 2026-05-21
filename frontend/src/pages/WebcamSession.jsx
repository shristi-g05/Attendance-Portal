import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  Play, 
  Square, 
  Loader2, 
  CheckCircle,
  AlertTriangle,
  History,
  Scan,
  Search,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { attendanceService, studentService } from '../services/api';

const WebcamSession = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [loadingStream, setLoadingStream] = useState(false);
  const pollTimerRef = useRef(null);

  const [activeTab, setActiveTab] = useState('live'); // 'live' or 'manual'
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [manualSuccess, setManualSuccess] = useState(null);
  const [manualError, setManualError] = useState(null);
  const [markingId, setMarkingId] = useState(null);

  const fetchSessionLogs = async () => {
    try {
      const todayIsoStr = new Date().toISOString().split('T')[0];
      const response = await attendanceService.getRecords(todayIsoStr);
      if (response.success) {
        setSessionLogs(response.records);
      }
    } catch (err) {
      console.error("Error fetching session logs:", err);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentService.getAll();
      if (response.success) {
        setStudents(response.students);
      }
    } catch (err) {
      console.error("Error fetching students directory:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleManualMark = async (studentId, studentName) => {
    setManualError(null);
    setManualSuccess(null);
    setMarkingId(studentId);

    try {
      const response = await attendanceService.markManual(studentId);
      if (response.success) {
        setManualSuccess(response.message || `Successfully checked in "${studentName}" manually.`);
        fetchSessionLogs(); // Immediately reload logs in background
        setSearchQuery(''); // clear query
      } else {
        setManualError(response.error || "Failed to check-in student.");
      }
    } catch (err) {
      console.error("Error marking manual attendance:", err);
      setManualError(
        err.response?.data?.error || 
        "Student already checked in for today or server offline."
      );
    } finally {
      setMarkingId(null);
      // Automatically clear alerts after 4 seconds
      setTimeout(() => {
        setManualSuccess(null);
        setManualError(null);
      }, 4000);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Start polling when stream is active
  useEffect(() => {
    if (isStreaming) {
      fetchSessionLogs(); // initial load
      pollTimerRef.current = setInterval(fetchSessionLogs, 2500); // poll every 2.5 seconds
    } else {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [isStreaming]);

  const handleStartSession = () => {
    setLoadingStream(true);
    // Add small delay to simulate loading/initializing camera
    setTimeout(() => {
      setIsStreaming(true);
      setLoadingStream(false);
    }, 1200);
  };

  const handleStopSession = () => {
    setIsStreaming(false);
  };

  return (
    <div className="page-transition space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Real-time Recognition</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Launch face recognition session to automatically capture attendance.</p>
        </div>

        <div className="flex items-center gap-3">
          {!isStreaming ? (
            <button
              onClick={handleStartSession}
              disabled={loadingStream}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/10 glow-btn flex items-center space-x-2 disabled:opacity-70"
            >
              {loadingStream ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Activating Camera...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" />
                  <span>Start Attendance Session</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleStopSession}
              className="px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-lg shadow-rose-600/10 glow-btn flex items-center space-x-2"
            >
              <Square className="h-4 w-4 fill-white" />
              <span>Stop Attendance Session</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Webcam View Container */}
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video w-full rounded-3xl bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-4">
            
            {/* Live MJPEG Feed from Python Backend */}
            {isStreaming ? (
              <img
                src={attendanceService.getVideoFeedUrl()}
                alt="Webcam Face Recognition Feed"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                onError={(e) => {
                  console.error("MJPEG feed error:", e);
                  // stop stream and show error
                  handleStopSession();
                  alert("Could not connect to webcam stream. Ensure Flask server is running and camera permissions are allowed.");
                }}
              />
            ) : (
              <div className="flex flex-col items-center text-center space-y-4 text-slate-500 select-none page-transition">
                <div className="p-5 rounded-full bg-slate-800/40 border border-slate-800 text-slate-400">
                  <CameraOff className="h-10 w-10 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Camera Offline</h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">Ready to check-in students. Make sure the webcam is plugged in and allowed.</p>
                </div>
              </div>
            )}

            {/* Glowing Scan Indicator Overlay */}
            {isStreaming && (
              <div className="absolute inset-x-6 top-6 flex items-center justify-between pointer-events-none">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-semibold animate-pulse shadow-lg shadow-emerald-500/5">
                  <Scan className="h-3.5 w-3.5 animate-[spin_3s_linear_infinite]" />
                  <span>Scanning Face Database...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick instructions alert */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-amber-700 dark:text-amber-300 text-xs flex gap-3">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-500" />
            <div className="space-y-1">
              <h5 className="font-bold">Anti-Spoofing & Placement Guideline</h5>
              <p className="leading-relaxed">Keep the face inside the screen box, well-lit, and look straight into the camera. The neural net processes matching models dynamically to prevent matching duplicates in a single session.</p>
            </div>
          </div>
        </div>

        {/* Real-time Session Check-in Sheet & Manual Override */}
        <div className="glass-panel rounded-3xl p-6 h-[500px] flex flex-col">
          {/* Tab selectors */}
          <div className="flex items-center justify-between mb-4 border-b border-slate-200/40 dark:border-slate-800/20 pb-4 shrink-0">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('live')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all duration-300 flex items-center space-x-1.5 ${
                  activeTab === 'live' 
                    ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>Live Logs</span>
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('manual');
                  fetchStudents();
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all duration-300 flex items-center space-x-1.5 ${
                  activeTab === 'manual' 
                    ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Manual Override</span>
              </button>
            </div>
            
            {activeTab === 'live' && isStreaming && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-[10px] font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-50"></span>
                <span>Active</span>
              </span>
            )}
          </div>

          {activeTab === 'live' ? (
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {sessionLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                  <CheckCircle className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                  <span className="text-sm font-semibold">No logs in this session</span>
                  <span className="text-xs text-slate-500 mt-0.5">Students will show here in real-time as they are detected.</span>
                </div>
              ) : (
                sessionLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/20 page-transition">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{log.name}</h4>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{log.roll_number}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200/30 dark:border-emerald-800/30 text-center">
                        Present
                      </span>
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {log.time}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Manual Override tab */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Feedback banners */}
              {manualError && (
                <div className="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/40 dark:border-rose-800/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1.5 shrink-0 animate-fade-in">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{manualError}</span>
                </div>
              )}
              {manualSuccess && (
                <div className="mb-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-800/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5 shrink-0 animate-fade-in">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{manualSuccess}</span>
                </div>
              )}

              {/* Search search input */}
              <div className="relative mb-4 shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  placeholder="Search student to check-in..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/40 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 text-xs"
                />
              </div>

              {/* Scrollable list of students */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {filteredStudents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                    <Search className="h-7 w-7 text-slate-300 dark:text-slate-700 mb-1.5" />
                    <span className="text-xs font-semibold">No students match</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Ensure the student is registered.</span>
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/35 dark:border-slate-800/20 hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-100/40 dark:hover:bg-slate-800/50 transition-all duration-200 group">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{student.name}</h4>
                        <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{student.roll_number}</p>
                      </div>
                      <button
                        onClick={() => handleManualMark(student.id, student.name)}
                        disabled={markingId === student.id}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:bg-indigo-500 text-white font-semibold text-[10px] shadow-sm transition-all duration-300 flex items-center space-x-1"
                      >
                        {markingId === student.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Marking...</span>
                          </>
                        ) : (
                          <span>+ Check In</span>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebcamSession;
