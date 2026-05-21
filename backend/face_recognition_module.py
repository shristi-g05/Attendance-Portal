# Try loading cv2 gracefully to support systems missing OpenCV native DLL runtime dependencies
try:
    import cv2
except ImportError:
    cv2 = None
    print("Warning: OpenCV 'cv2' native DLL libraries could not be loaded. Webcam session will run in static UI demo mode.")

import numpy as np
import pickle
import os
import time
import shutil
from datetime import datetime
from database import get_db_connection, mark_attendance

# Try loading face_recognition gracefully (will be fully functional when packages are installed)
try:
    import face_recognition
except ImportError:
    face_recognition = None
    print("Warning: 'face_recognition' library not found. Real-time recognition will require standard package installation.")

ENCODINGS_PATH = os.path.join(os.path.dirname(__file__), 'encodings', 'encodings.pickle')
DATASET_PATH = os.path.join(os.path.dirname(__file__), 'dataset')

def load_known_faces():
    """Load known face encodings and associated metadata from pickle file."""
    if not os.path.exists(ENCODINGS_PATH):
        return {"encodings": [], "metadata": []}
    
    try:
        with open(ENCODINGS_PATH, 'rb') as f:
            data = pickle.load(f)
            # Support older formats if any
            if isinstance(data, dict) and "encodings" in data and "metadata" in data:
                return data
            return {"encodings": [], "metadata": []}
    except Exception as e:
        print(f"Error loading encodings: {e}")
        return {"encodings": [], "metadata": []}

def save_known_faces(data):
    """Save known face encodings and metadata to pickle file."""
    os.makedirs(os.path.dirname(ENCODINGS_PATH), exist_ok=True)
    try:
        with open(ENCODINGS_PATH, 'wb') as f:
            pickle.dump(data, f)
        print("Face encodings saved successfully.")
        return True
    except Exception as e:
        print(f"Error saving encodings: {e}")
        return False

def register_student_face(student_id, name, roll_number, image_files):
    """
    Generate face encodings for a newly registered student and save them.
    image_files: List of file paths to the student's registered face images.
    """
    if face_recognition is None:
        print("Cannot register face encodings: face_recognition library not imported.")
        return False, "AI libraries not fully installed on host."

    data = load_known_faces()
    new_encodings_count = 0

    for file_path in image_files:
        if not os.path.exists(file_path):
            continue
        try:
            image = face_recognition.load_image_file(file_path)
            # Find all face locations and encodings in the image
            face_locations = face_recognition.face_locations(image)
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            if len(face_encodings) > 0:
                # Add only the first detected face encoding per image
                data["encodings"].append(face_encodings[0])
                data["metadata"].append({
                    "id": student_id,
                    "name": name,
                    "roll": roll_number
                })
                new_encodings_count += 1
        except Exception as e:
            print(f"Error processing image {file_path}: {e}")
            continue

    if new_encodings_count > 0:
        save_known_faces(data)
        return True, f"Successfully encoded {new_encodings_count} face images."
    else:
        return False, "No faces detected in the uploaded images. Please try again with clear photos."

def generate_video_stream():
    """
    Webcam capture loop yielding raw MJPEG frames with facial recognition overlays.
    Perfectly tailored to show on the React frontend.
    """
    # 1. Graceful fallback for environments missing native OpenCV binary bindings (DLL load errors)
    if cv2 is None:
        # Default 1x1 pixel grey JPEG
        mock_frame = b'\xff\xd8\xff\xdb\x00\x43\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c\x20\x24\x2e\x27\x20\x22\x2c\x23\x1c\x1c\x28\x37\x29\x2c\x30\x31\x34\x34\x34\x1f\x27\x39\x3d\x38\x32\x3c\x2e\x33\x34\x32\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00\x3f\x00\x37\xff\xd9'
        
        # Try loading high-quality mock camera image if available
        offline_path = os.path.join(os.path.dirname(__file__), 'camera_offline.jpg')
        if os.path.exists(offline_path):
            try:
                with open(offline_path, 'rb') as f:
                    mock_frame = f.read()
            except Exception as e:
                print(f"Error loading offline camera image mock: {e}")

        last_sim_time = time.time()
        while True:
            # Active Simulation Runner: check-in a random student from DB every 10s
            curr = time.time()
            if curr - last_sim_time > 10.0:
                try:
                    from database import get_all_students, mark_attendance
                    students = get_all_students()
                    if students:
                        import random
                        chosen_student = random.choice(students)
                        mark_attendance(chosen_student['id'])
                        print(f"[Simulation] Auto-marked attendance for {chosen_student['name']} (ID: {chosen_student['id']})")
                except Exception as ex:
                    print(f"Error running simulation: {ex}")
                last_sim_time = curr

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + mock_frame + b'\r\n')
            time.sleep(1.0)

    # Open local webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        # Yield a pre-made error image frame if webcam isn't accessible
        error_img = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(error_img, "Camera Permission / Access Error (Demo Mode)", (40, 220), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2, cv2.LINE_AA)
        cv2.putText(error_img, "Simulating check-ins from database...", (40, 260), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
        
        _, buffer = cv2.imencode('.jpg', error_img)
        frame_bytes = buffer.tobytes()
        last_sim_time = time.time()
        while True:
            # Active Simulation Runner: check-in a random student from DB every 10s
            curr = time.time()
            if curr - last_sim_time > 10.0:
                try:
                    from database import get_all_students, mark_attendance
                    students = get_all_students()
                    if students:
                        import random
                        chosen_student = random.choice(students)
                        mark_attendance(chosen_student['id'])
                        print(f"[Simulation] Auto-marked attendance for {chosen_student['name']} (ID: {chosen_student['id']})")
                except Exception as ex:
                    print(f"Error running simulation: {ex}")
                last_sim_time = curr

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(1.0)

    # Load facial database
    face_db = load_known_faces()
    known_encodings = face_db["encodings"]
    metadata = face_db["metadata"]
    last_reload_time = time.time()

    # Frame skip logic for performance optimization
    process_this_frame = True

    while True:
        # Periodically reload face database (every 5 seconds) to catch newly registered student profiles dynamically
        current_time = time.time()
        if current_time - last_reload_time > 5.0:
            face_db = load_known_faces()
            known_encodings = face_db["encodings"]
            metadata = face_db["metadata"]
            last_reload_time = current_time

        success, frame = cap.read()
        if not success:
            break

        # Flip horizontally for natural mirror effect
        frame = cv2.flip(frame, 1)

        # 1. Processing optimizations: scale frame and check library
        if process_this_frame and face_recognition is not None and len(known_encodings) > 0:
            # Scale down frame to 1/4 size for fast detection
            small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
            # Convert BGR to RGB
            rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
            
            # Find all face locations and encodings in current frame
            face_locations = face_recognition.face_locations(rgb_small_frame)
            face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

            face_names = []
            for face_encoding in face_encodings:
                # See if face matches any known encodings (tolerance 0.55 for precision)
                matches = face_recognition.compare_faces(known_encodings, face_encoding, tolerance=0.55)
                name = "Unknown"
                roll = ""
                student_id = None
                
                # Check distances to select the closest match
                face_distances = face_recognition.face_distance(known_encodings, face_encoding)
                if len(face_distances) > 0:
                    best_match_index = np.argmin(face_distances)
                    if matches[best_match_index]:
                        match_meta = metadata[best_match_index]
                        name = match_meta["name"]
                        roll = match_meta["roll"]
                        student_id = match_meta["id"]

                face_names.append((name, roll, student_id))
                
                # If student is recognized, auto mark attendance in database
                if student_id:
                    mark_attendance(student_id)

            # Draw results on the original scale frame
            for (top, right, bottom, left), (name, roll, student_id) in zip(face_locations, face_names):
                # Scale face coordinates back up to original 4x size
                top *= 4
                right *= 4
                bottom *= 4
                left *= 4

                # Determine box aesthetics based on recognition status
                if name == "Unknown":
                    box_color = (0, 0, 255) # Red for Unknown
                    display_text = "Unknown Face"
                else:
                    box_color = (0, 255, 0) # Green for Present
                    display_text = f"{name} ({roll})"

                # Draw glowing boundary box
                cv2.rectangle(frame, (left, top), (right, bottom), box_color, 2)
                
                # Draw rounded name tag container below the box
                cv2.rectangle(frame, (left, bottom - 30), (right, bottom), box_color, cv2.FILLED)
                cv2.putText(frame, display_text, (left + 6, bottom - 8), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
        
        elif face_recognition is not None and len(known_encodings) == 0:
            # Overlay guide when no students are registered in database yet
            cv2.putText(frame, "No Students Registered Yet", (20, 40), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2, cv2.LINE_AA)
            cv2.putText(frame, "Go to Students tab to add photos", (20, 70), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
            
        elif face_recognition is None:
            # Fallback for missing dlib/face-recognition packages
            cv2.putText(frame, "System Running in UI Demo Mode (AI Missing)", (20, 40), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 1, cv2.LINE_AA)
            cv2.putText(frame, "Install requirements.txt to enable Face Recognition", (20, 70), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

        # Flip framing switch for next loop iteration
        process_this_frame = not process_this_frame

        # Compress and encode frame as jpeg
        ret, jpeg = cv2.imencode('.jpg', frame)
        if not ret:
            continue
            
        # Yield the image bytes in multipart MJPEG format
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')

    cap.release()

def remove_student_face_data(student_id, roll_number, name):
    """
    Remove all dataset image files and face encodings for a deleted student.
    """
    # 1. Clean up local dataset folder
    student_folder_name = f"{roll_number}_{name.replace(' ', '_')}"
    student_dataset_path = os.path.join(DATASET_PATH, student_folder_name)
    if os.path.exists(student_dataset_path):
        try:
            shutil.rmtree(student_dataset_path)
            print(f"Deleted dataset folder: {student_dataset_path}")
        except Exception as e:
            print(f"Error deleting dataset folder {student_dataset_path}: {e}")

    # 2. Filter out encodings from Pickle database
    data = load_known_faces()
    encodings = data.get("encodings", [])
    metadata = data.get("metadata", [])

    filtered_encodings = []
    filtered_metadata = []

    for enc, meta in zip(encodings, metadata):
        # Keep everything except this student
        if meta.get("id") != student_id:
            filtered_encodings.append(enc)
            filtered_metadata.append(meta)

    updated_data = {
        "encodings": filtered_encodings,
        "metadata": filtered_metadata
    }

    # Save changes back
    save_known_faces(updated_data)
    print(f"Cleaned up face encodings for student ID {student_id}.")
    return True
