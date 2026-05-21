import os
import csv
from io import StringIO
from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS
from datetime import datetime
from database import (
    init_db,
    add_student,
    get_all_students,
    get_attendance_records,
    get_dashboard_stats,
    mark_attendance,
    delete_student,
    get_db_connection
)
from face_recognition_module import register_student_face, generate_video_stream, remove_student_face_data

app = Flask(__name__)
# Enable CORS for Vite frontend running on standard localhost ports
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Ensure upload/dataset directories are configured correctly
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, 'dataset')
os.makedirs(DATASET_DIR, exist_ok=True)

# Simple secure session key
ADMIN_TOKEN = "admin-secret-session-token"

# Helper middleware to verify admin token
def verify_admin_auth():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    token = auth_header.split(' ')[1]
    return token == ADMIN_TOKEN

@app.before_request
def before_request_hook():
    """Bypass token check for preflight OPTIONS, login, and public video feed."""
    if request.method == 'OPTIONS':
        return
    if request.path == '/api/login' or request.path == '/api/video_feed':
        return
    # Optional authorization bypass for development or ease-of-run
    # If the request header doesn't match the token, we can return 401. Let's make it secure but allow easy API access.
    # For robust production design, we will enforce it on modifications
    if request.path.startswith('/api/register-student'):
        if not verify_admin_auth():
            return jsonify({"success": False, "error": "Unauthorized admin access."}), 401

@app.route('/api/login', methods=['POST'])
def login():
    """Validate admin credentials."""
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    
    # Hardcoded clean credentials for immediate beginner setup
    if username == "admin" and password == "admin123":
        return jsonify({
            "success": True,
            "message": "Login successful",
            "token": ADMIN_TOKEN,
            "admin": {"username": "admin", "role": "Super Admin"}
        })
    else:
        return jsonify({
            "success": False,
            "error": "Invalid username or password"
        }), 401

@app.route('/api/register-student', methods=['POST'])
def register_student():
    """Register a new student, upload face photos, and compile face encodings."""
    if 'name' not in request.form or 'roll_number' not in request.form:
        return jsonify({"success": False, "error": "Missing student Name or Roll Number"}), 400
        
    name = request.form['name'].strip()
    roll_number = request.form['roll_number'].strip()
    
    if not name or not roll_number:
        return jsonify({"success": False, "error": "Name and Roll Number cannot be empty"}), 400
        
    uploaded_files = request.files.getlist('images')
    if not uploaded_files or len(uploaded_files) == 0 or uploaded_files[0].filename == '':
        return jsonify({"success": False, "error": "At least one face image must be uploaded"}), 400

    # 1. Create a subfolder inside dataset for this student
    student_folder_name = f"{roll_number}_{name.replace(' ', '_')}"
    student_dataset_path = os.path.join(DATASET_DIR, student_folder_name)
    os.makedirs(student_dataset_path, exist_ok=True)

    # 2. Add student to database
    # Construct a path placeholder or list of paths
    image_path_placeholder = os.path.join('dataset', student_folder_name)
    student_id, err = add_student(name, roll_number, image_path_placeholder)
    
    if err:
        return jsonify({"success": False, "error": err}), 400

    # 3. Save files to disk and capture local absolute paths
    saved_file_paths = []
    for idx, file in enumerate(uploaded_files):
        # Generate clean file names
        ext = os.path.splitext(file.filename)[1] or '.jpg'
        file_name = f"face_{idx + 1}{ext}"
        target_path = os.path.join(student_dataset_path, file_name)
        file.save(target_path)
        saved_file_paths.append(target_path)

    # 4. Generate AI Face Encodings using the module
    success, ai_message = register_student_face(student_id, name, roll_number, saved_file_paths)
    
    if success:
        return jsonify({
            "success": True,
            "message": f"Student '{name}' registered successfully! {ai_message}",
            "student": {"id": student_id, "name": name, "roll_number": roll_number}
        })
    else:
        # Fallback or warning if AI libraries are missing (still let registration happen in DB for UI demonstration)
        return jsonify({
            "success": True,
            "message": f"Student registered in database, but face encoding failed: {ai_message}. System will run in manual demo mode.",
            "student": {"id": student_id, "name": name, "roll_number": roll_number}
        })

@app.route('/api/students', methods=['GET'])
def get_students():
    """Retrieve all students."""
    students = get_all_students()
    return jsonify({
        "success": True,
        "students": students
    })

@app.route('/api/students/<int:student_id>', methods=['DELETE'])
def delete_student_profile(student_id):
    """Delete a student profile, including local images, pickle face encodings, and database records."""
    if not verify_admin_auth():
        return jsonify({"success": False, "error": "Unauthorized admin access."}), 401
        
    # 1. Fetch student info from DB first (needed for folder cleanup by name/roll)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM students WHERE id = ?', (student_id,))
    student = cursor.fetchone()
    conn.close()
    
    if not student:
        return jsonify({"success": False, "error": "Student not found."}), 404
        
    student_dict = dict(student)
    roll_number = student_dict['roll_number']
    name = student_dict['name']
    
    # 2. Delete local image files and remove face encodings from Pickle database
    remove_student_face_data(student_id, roll_number, name)
    
    # 3. Delete student row from SQLite database (cascade deletes their attendance history automatically)
    success, err = delete_student(student_id)
    
    if success:
        return jsonify({
            "success": True,
            "message": f"Student '{name}' and all associated attendance records deleted successfully."
        })
    else:
        return jsonify({
            "success": False,
            "error": err or "Failed to delete student database entry."
        }), 400

@app.route('/api/video_feed')
def video_feed():
    """Stream live webcam video with overlay face boxes directly inside <img /> tags."""
    return Response(
        generate_video_stream(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

@app.route('/api/attendance', methods=['GET'])
def get_attendance():
    """Fetch attendance records. Optional date filter."""
    date_filter = request.args.get('date') # Format: YYYY-MM-DD
    records = get_attendance_records(date_filter)
    return jsonify({
        "success": True,
        "records": records
    })

@app.route('/api/attendance', methods=['POST'])
def manual_mark_attendance():
    """Manually mark attendance for a student (admin override)."""
    data = request.json or {}
    student_id = data.get('student_id')
    status = data.get('status', 'Present')
    date_str = data.get('date') # optional
    time_str = data.get('time') # optional
    
    if not student_id:
        return jsonify({"success": False, "error": "Missing student ID"}), 400
        
    success, err = mark_attendance(student_id, date_str, time_str, status)
    if success:
        return jsonify({
            "success": True, 
            "message": "Attendance marked successfully"
        })
    else:
        return jsonify({
            "success": False, 
            "error": err or "Student already checked in for today."
        }), 400

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Fetch analytics, total counts, and present/absent counts for dashboard."""
    stats = get_dashboard_stats()
    return jsonify({
        "success": True,
        **stats
    })

@app.route('/api/download-csv', methods=['GET'])
def download_csv():
    """Generate and return attendance reports in CSV format."""
    date_filter = request.args.get('date') # Format: YYYY-MM-DD
    records = get_attendance_records(date_filter)
    
    # Create an in-memory CSV string
    si = StringIO()
    cw = csv.writer(si)
    
    # Write header
    cw.writerow(['ID', 'Roll Number', 'Student Name', 'Date', 'Time', 'Status'])
    
    # Write row data
    for row in records:
        cw.writerow([
            row['id'],
            row['roll_number'],
            row['name'],
            row['date'],
            row['time'],
            row['status']
        ])
        
    output = si.getvalue()
    si.close()
    
    # Setup response headers for attachment download
    filename = f"attendance_{date_filter or 'all'}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-disposition": f"attachment; filename={filename}"}
    )

if __name__ == '__main__':
    # Make sure DB tables exist prior to starting
    init_db()
    print("Starting Smart Attendance API server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
