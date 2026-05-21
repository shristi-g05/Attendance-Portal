import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto attach authorization token to each request if available in storage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/login', { username, password });
    if (response.data.success && response.data.token) {
      localStorage.setItem('admin_token', response.data.token);
      localStorage.setItem('admin_user', JSON.stringify(response.data.admin));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('admin_token');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  }
};

export const studentService = {
  getAll: async () => {
    const response = await api.get('/students');
    return response.data;
  },
  register: async (name, rollNumber, imageFiles) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('roll_number', rollNumber);
    
    for (let i = 0; i < imageFiles.length; i++) {
      formData.append('images', imageFiles[i]);
    }

    const response = await api.post('/register-student', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  }
};

export const attendanceService = {
  getRecords: async (date) => {
    const response = await api.get('/attendance', {
      params: { date },
    });
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  },
  getDownloadUrl: (date) => {
    let url = `${API_BASE_URL}/download-csv`;
    if (date) {
      url += `?date=${date}`;
    }
    return url;
  },
  getVideoFeedUrl: () => {
    return `http://127.0.0.1:5000/api/video_feed`;
  },
  markManual: async (studentId, date = null, time = null, status = 'Present') => {
    const response = await api.post('/attendance', {
      student_id: studentId,
      date,
      time,
      status
    });
    return response.data;
  }
};

export default api;
