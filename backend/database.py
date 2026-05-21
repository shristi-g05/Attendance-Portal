import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'attendance.db')

def get_db_connection():
    """Establish a connection to the SQLite database and return it with Row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create students table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            roll_number TEXT UNIQUE NOT NULL,
            image_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create attendance table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
            UNIQUE(student_id, date) -- Prevent duplicate attendance for the same day
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully.")

def add_student(name, roll_number, image_path):
    """Insert a new student into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO students (name, roll_number, image_path) VALUES (?, ?, ?)',
            (name, roll_number, image_path)
        )
        conn.commit()
        student_id = cursor.lastrowid
        return student_id, None
    except sqlite3.IntegrityError:
        return None, f"Student with roll number {roll_number} already exists."
    finally:
        conn.close()

def get_all_students():
    """Retrieve all students from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM students ORDER BY name ASC')
    students = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return students

def get_student_by_roll(roll_number):
    """Retrieve a single student by their roll number."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM students WHERE roll_number = ?', (roll_number,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def delete_student(student_id):
    """Delete a student from the database. Cascade will automatically delete their attendance."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM students WHERE id = ?', (student_id,))
        conn.commit()
        affected = cursor.rowcount > 0
        return affected, None
    except Exception as e:
        return False, str(e)
    finally:
        conn.close()

def mark_attendance(student_id, date_str=None, time_str=None, status="Present"):
    """
    Mark a student's attendance.
    Prevents duplicate entries for the same date using INSERT OR IGNORE.
    """
    if not date_str:
        date_str = datetime.now().strftime('%Y-%m-%d')
    if not time_str:
        time_str = datetime.now().strftime('%H:%M:%S')
        
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # INSERT OR IGNORE will skip if unique constraint (student_id, date) is violated
        cursor.execute(
            'INSERT OR IGNORE INTO attendance (student_id, date, time, status) VALUES (?, ?, ?, ?)',
            (student_id, date_str, time_str, status)
        )
        conn.commit()
        # Check if row was actually inserted
        affected = cursor.rowcount > 0
        return affected, None
    except Exception as e:
        return False, str(e)
    finally:
        conn.close()

def get_attendance_records(date_filter=None):
    """
    Retrieve attendance records joined with student information.
    Optional date_filter in YYYY-MM-DD format.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = '''
        SELECT 
            a.id,
            a.student_id,
            s.name,
            s.roll_number,
            a.date,
            a.time,
            a.status
        FROM attendance a
        JOIN students s ON a.student_id = s.id
    '''
    
    params = []
    if date_filter:
        query += ' WHERE a.date = ?'
        params.append(date_filter)
        
    query += ' ORDER BY a.date DESC, a.time DESC'
    
    cursor.execute(query, params)
    records = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return records

def get_dashboard_stats():
    """Calculate and return key dashboard metrics."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    today_str = datetime.now().strftime('%Y-%m-%d')
    
    # 1. Total Students
    cursor.execute('SELECT COUNT(*) FROM students')
    total_students = cursor.fetchone()[0]
    
    # 2. Present Today
    cursor.execute('SELECT COUNT(*) FROM attendance WHERE date = ? AND status = "Present"', (today_str,))
    present_today = cursor.fetchone()[0]
    
    # 3. Absent Today (Total - Present)
    absent_today = max(0, total_students - present_today)
    
    # 4. Overall Attendance Percentage (Attendance logs count vs (total students * days with logs))
    cursor.execute('SELECT COUNT(DISTINCT date) FROM attendance')
    distinct_days = cursor.fetchone()[0] or 1
    
    cursor.execute('SELECT COUNT(*) FROM attendance WHERE status = "Present"')
    total_presents = cursor.fetchone()[0]
    
    expected_total_presents = total_students * distinct_days
    attendance_rate = 0.0
    if expected_total_presents > 0:
        attendance_rate = round((total_presents / expected_total_presents) * 100, 1)
        
    # 5. Last 7 Days Trends for Chart
    cursor.execute('''
        SELECT date, COUNT(*) as present_count 
        FROM attendance 
        WHERE status = "Present" 
        GROUP BY date 
        ORDER BY date DESC 
        LIMIT 7
    ''')
    raw_trends = cursor.fetchall()
    trends = [{"date": row['date'], "present": row['present_count'], "absent": max(0, total_students - row['present_count'])} for row in reversed(raw_trends)]
    
    conn.close()
    
    return {
        "total_students": total_students,
        "present_today": present_today,
        "absent_today": absent_today,
        "attendance_rate": attendance_rate,
        "trends": trends
    }

if __name__ == "__main__":
    init_db()
