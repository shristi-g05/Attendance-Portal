import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Users, 
  Upload, 
  Trash2, 
  ScanFace, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { studentService } from '../services/api';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchStudents = async () => {
    try {
      const response = await studentService.getAll();
      if (response.success) {
        setStudents(response.students);
      }
    } catch (err) {
      console.error("Error fetching student list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setImageFiles(prev => [...prev, ...files]);

    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...urls]);
  };

  const removeSelectedImage = (index) => {
    setImageFiles(prev => prev.filter((_, idx) => idx !== index));
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (imageFiles.length === 0) {
      setError("Please select at least one face photo for registration.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await studentService.register(name, rollNumber, imageFiles);
      if (response.success) {
        setSuccess(response.message || "Student registered successfully!");
        setName('');
        setRollNumber('');
        setImageFiles([]);
        setPreviewUrls([]);
        fetchStudents(); // refresh list
      } else {
        setError(response.error || "Registration failed.");
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 
        "An error occurred. Check if Flask API server is running."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    setError(null);
    setSuccess(null);

    const confirmDelete = window.confirm(
      `Are you sure you want to delete student "${studentName}"?\nThis will permanently erase their facial database encodings, local dataset images, and all historical attendance sheets.`
    );

    if (!confirmDelete) return;

    try {
      const response = await studentService.delete(studentId);
      if (response.success) {
        setSuccess(response.message || `Student "${studentName}" deleted successfully.`);
        fetchStudents(); // refresh list
      } else {
        setError(response.error || "Failed to delete student.");
      }
    } catch (err) {
      console.error("Error deleting student:", err);
      setError(
        err.response?.data?.error || 
        "An error occurred while deleting the student profile."
      );
    }
  };

  return (
    <div className="page-transition space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Student Management</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Register new students and view face data profiles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Registration Form Card */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-500" />
            <span>Register Face Profile</span>
          </h2>

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Student Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/40 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Roll Number / ID</label>
              <input
                type="text"
                required
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. CS202604"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/40 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Face Encodings (Photos)</label>
              <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700/60 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors duration-300 p-6 flex flex-col items-center justify-center text-center cursor-pointer group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 text-slate-400 group-hover:text-indigo-500 transition-colors duration-300 mb-3" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Upload Face Images</span>
                <span className="text-xs text-slate-400 mt-1">Accepts multiple PNG, JPG photos</span>
              </div>
            </div>

            {/* Thumbnail previews */}
            {previewUrls.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Selected ({previewUrls.length}):</span>
                <div className="grid grid-cols-4 gap-2.5">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                      <img src={url} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeSelectedImage(idx)}
                        className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-md shadow-indigo-500/10 glow-btn flex items-center justify-center space-x-2 text-sm disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing encodings...</span>
                </>
              ) : (
                <>
                  <ScanFace className="h-4 w-4" />
                  <span>Generate Encodings & Save</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Directory Listing Table */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            <span>Student Profiles Directory</span>
          </h2>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Loading profile list...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
              <ScanFace className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
              <span className="text-base font-semibold">No students registered</span>
              <span className="text-xs text-slate-500 mt-1 max-w-xs">Enter a student's name and upload their photos to start recognizing them in webcam sessions.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                    <th className="pb-3 pl-2">Profile</th>
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">Roll Number</th>
                    <th className="pb-3">Registration Date</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200 group">
                      <td className="py-4 pl-2">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      </td>
                      <td className="py-4 font-semibold text-slate-800 dark:text-slate-200">
                        {student.name}
                      </td>
                      <td className="py-4 font-mono text-slate-500 dark:text-slate-400 text-xs">
                        {student.roll_number}
                      </td>
                      <td className="py-4 text-slate-400 dark:text-slate-500 text-xs">
                        {new Date(student.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-4 text-right pr-2">
                        <button
                          onClick={() => handleDeleteStudent(student.id, student.name)}
                          className="p-2 rounded-xl text-rose-500 hover:text-white hover:bg-rose-500 dark:hover:bg-rose-600 transition-all duration-300 border border-rose-200/40 dark:border-rose-900/30 hover:border-transparent active:scale-90"
                          title="Delete Student"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Students;
