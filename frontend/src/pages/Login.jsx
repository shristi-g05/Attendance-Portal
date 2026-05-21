import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanFace, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authService.login(username, password);
      if (response.success) {
        navigate('/');
      } else {
        setError(response.error || 'Authentication failed');
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 
        'Could not connect to Flask Server. Make sure the API backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 px-4">
      {/* Decorative gradient canvas */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/10 blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[35rem] h-[35rem] rounded-full bg-gradient-to-tr from-blue-500/10 to-indigo-500/20 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 page-transition">
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/30 mb-4 animate-pulse-slow">
            <ScanFace className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Attendance Portal</h2>
          <p className="mt-2 text-sm text-slate-400">Admin Control Portal</p>
        </div>

        {/* Login Panel */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200 text-sm flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/20 glow-btn flex items-center justify-center space-x-2 text-sm disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Access Dashboard</span>
                )}
              </button>
            </div>
          </form>

          {/* Quick Tip for easy testing */}
          <div className="mt-6 text-center">
            <span className="text-xs text-slate-500">
              Demo Credentials: <span className="font-semibold text-indigo-400">admin</span> / <span className="font-semibold text-indigo-400">admin123</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
