# Attendance Portal - AI Face Recognition Attendance System

An elegant, modern, full-stack **Smart Attendance System** featuring real-time face recognition, administrative database control, and high-end compliance analytics.

The application is split into two components:
1. **Frontend**: A gorgeous React.js Single Page Application built with Vite, Tailwind CSS, Recharts, and Lucide Icons.
2. **Backend**: A robust Python Flask API integrated with OpenCV, NumPy, the `face_recognition` library, and SQLite.

---

## 📸 Key Design Features
- **Integrated Live Stream**: Streams real-time webcam processing directly inside the React dashboard as an **MJPEG Stream** (no separate annoying OpenCV GUI windows).
- **Auto check-ins**: Matches face encodings with registered database profiles, automatically logging attendance and checking for duplicates.
- **Visual Analytics**: Interactive Recharts graphs showing 7-day attendance curves, active widgets, and real-time session dashboards.
- **Premium Aesthetics**: curating a smooth, glassy dark-mode adaptive theme with fluid micro-interactions and transitions.

---

## 📁 Repository Structure
```text
SmartAttendance/
├── backend/
│   ├── app.py                     # Primary Flask REST API Server
│   ├── face_recognition_module.py # Face Recognition and OpenCV Stream handler
│   ├── database.py                # SQLite schema and data access operations
│   ├── dataset/                   # Stored raw image files of students (auto-created)
│   ├── encodings/                 # Serialized face encodings pickle (auto-created)
│   ├── attendance/                # Output location for exported CSV files
│   ├── requirements.txt           # Backend python packages
│   └── .env.example               # Backend environment options
│
└── frontend/
    ├── index.html                 # HTML entry point (loads google fonts)
    ├── vite.config.js             # Vite configuration
    ├── tailwind.config.js         # Tailwind specifications
    ├── postcss.config.js          # PostCSS processing setup
    └── src/
        ├── main.jsx               # React mount root
        ├── App.jsx                # Layout orchestrator and protected router
        ├── index.css              # Core custom scrollbars and dark variable sheets
        ├── services/
        │   └── api.js             # Axios API service client with token interceptors
        ├── components/
        │   ├── Sidebar.jsx        # Navigation panel
        │   ├── StatsCard.jsx      # Summary metrics widget
        │   ├── ThemeToggle.jsx    # Smooth theme control
        │   └── AttendanceChart.jsx# Gorgeous Recharts analytics
        └── pages/
            ├── Login.jsx          # Secure admin gate
            ├── Dashboard.jsx      # Analytical overview
            ├── Students.jsx       # Registry and face upload panel
            ├── WebcamSession.jsx  # Face detection scanner center
            └── Attendance.jsx     # Sheets explorer and CSV exporter
```

---

## 🛠️ Step-by-Step Local Setup

Follow these commands to get the application running on your Windows system.

### Phase 1: Backend (Python Flask & SQLite)

1. **Install Python 3.11**:
   If not already installed, open PowerShell and run:
   ```powershell
   winget install Python.Python.3.11
   ```
   *Note: Close and reopen your terminal to update PATH environment.*

2. **Navigate to the Backend directory**:
   ```powershell
   cd backend
   ```

3. **Install CMake & Visual Studio C++ Compiler (Required for face-recognition/dlib)**:
   Building the `dlib` library natively on Windows requires C++ compilation tools. Run:
   ```powershell
   winget install Microsoft.VisualStudio.2022.BuildTools --override "--passive --add Microsoft.VisualStudio.Workload.VCTools"
   ```
   *Alternative: If you want to skip compiler compilation, install a **pre-compiled dlib wheel** for Python 3.11:*
   ```powershell
   pip install https://github.com/z-mahmud22/Dlib-Wheels/raw/main/dlib-19.24.1-cp311-cp311-win_amd64.whl
   ```

4. **Install Python Packages**:
   ```powershell
   pip install -r requirements.txt
   ```

5. **Start Flask Server**:
   ```powershell
   python app.py
   ```
   The backend will launch at `http://localhost:5000` and automatically create the SQLite tables.

---

### Phase 2: Frontend (React + Vite + Tailwind CSS)

1. **Install Node.js (LTS)**:
   If not already installed, open PowerShell and run:
   ```powershell
   winget install OpenJS.NodeJS.LTS
   ```

2. **Navigate to the Frontend directory**:
   ```powershell
   cd ../frontend
   ```

3. **Install Node Modules**:
   ```powershell
   npm install
   ```

4. **Start Development Server**:
   ```powershell
   npm run dev
   ```
   The dashboard will spin up at `http://localhost:5173`. Open this URL in your web browser.

---

## 🔑 Administrative Sign-in
Use the secure demo administrator credentials to access the panel:
- **Username**: `admin`
- **Password**: `admin123`

---

## 🚀 Deployment Instructions

### 1. Frontend (Vercel)
The React app is built as a static site and deployed seamlessly.
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Settings**: Configure Vercel to route all paths to `index.html` (Single Page Application configuration).

### 2. Backend (Render / VPS)
- **Environment**: Render Web Service.
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app`
- **Storage**: Since SQLite and Pickle are file-based, deploy on a persistent disk mount or migrate database to PostgreSQL (by modifying `database.py` connection to use `psycopg2`).
