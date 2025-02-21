import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, request, jsonify, session
import os
from datetime import datetime
import pandas as pd
from flask_cors import CORS, cross_origin
from flask import redirect, url_for, flash
from werkzeug.utils import secure_filename
from google.cloud.firestore import SERVER_TIMESTAMP

# Initialize Flask App
app = Flask(__name__)
app.secret_key = 'secret_key' 

# Initialize Firebase
cred = credentials.Certificate("firebase-key.json")
firebase_admin.initialize_app(cred)

# Initialize CORS (this automatically sets CORS headers)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:3000"}})

db = firestore.client()

# Ensure uploads directory exists
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv', 'xls', 'xlsx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/test_cors', methods=['GET'])
def test_cors():
    return jsonify({"message": "CORS is working!"}), 200

def is_authenticated():
    return 'user' in session and 'role' in session  # Check if user is logged in

@app.after_request
def after_request(response):
    # Only add custom headers that are not already handled by Flask-CORS.
    response.headers.add('Cross-Origin-Opener-Policy', 'same-origin')
    response.headers.add('Cross-Origin-Embedder-Policy', 'require-corp')
    return response

@app.route('/')
def home():
    return "Welcome to the home page!"

# Check if file extension is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Create the 'uploads' folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/login', methods=['POST'])
def login():
    role = request.form.get('role')
    user_email = request.form.get('userEmail')

    # Example check (replace with your actual user validation logic)
    if user_email and role:
        session['user'] = user_email
        session['role'] = role

        print(f"Login: Session User: {session.get('user')}, Session Role: {session.get('role')}")
        
        return jsonify({'message': 'Logged in successfully'}), 200
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/addclassroom', methods=['POST'])
def addclassroom():
    role = request.form.get('role')
    user_email = request.form.get('userEmail')
    print(f"Received request from user with role: {role}, email: {user_email}")

    # Ensure user is authenticated (check role)
    if not role or not user_email:
        return jsonify({"error": "Role or user email not provided."}), 400

    if role != 'teacher': 
        return jsonify({"error": "Access forbidden: User is not a teacher"}), 403

    if request.method == 'POST':
        class_name = request.form.get('class_name')
        course_id = request.form.get('course_id') 
        semester = request.form.get('semester') 
        file = request.files.get('student_file')

        if not class_name or not course_id or not semester or not file:
            return jsonify({"error": "Class name, course ID, semester, and file are required."}), 400

        file_ext = os.path.splitext(file.filename)[1].lower()

        # Check for allowed file formats
        if file_ext not in ['.csv', '.xlsx']:
            return jsonify({"error": "Invalid file format. Please upload a CSV or Excel file."}), 400

        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        try:
            # Read file based on its extension
            if file_ext == '.csv':
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)

            # Check if required columns are present
            if not {'firstname', 'lastname', 'email', 'lsu_id'}.issubset(df.columns):
                os.remove(file_path)
                return jsonify({"error": "File must have columns: firstname, lastname, email, lsu_id."}), 400

            # --- NEW: Check if the classroom ID (course_id) is unique ---
            classroom_ref = db.collection('classrooms').document(course_id)
            if classroom_ref.get().exists:
                os.remove(file_path)
                return jsonify({"error": f"Classroom ID '{course_id}' already exists."}), 400
            # ----------------------------------------------------------------

            # (Optional) Check if a classroom with the same name exists for this teacher
            existing_classrooms = db.collection('classrooms')\
                                    .where('teacherEmail', '==', user_email)\
                                    .where('class_name', '==', class_name)\
                                    .get()
            if len(existing_classrooms) > 0:
                os.remove(file_path)
                return jsonify({"error": f"Classroom '{class_name}' already exists."}), 400

            # Create classroom document using course_id as document ID
            classroom_ref.set({
                'courseID': course_id,  
                'semester': semester,   
                'class_name': class_name, 
                'teacherEmail': user_email
            })

            # Add students to Firestore
            for _, row in df.iterrows():
                student_email = row['email']
                lsu_id = str(row['lsu_id'])  # Ensure LSU ID is treated as a string

                student_data = {
                    'firstName': row['firstname'],
                    'lastName': row['lastname'],
                    'email': student_email,
                    'lsuID': lsu_id,
                    'assignedAt': firestore.SERVER_TIMESTAMP
                }

                # Use student_email as the document ID in the 'students' subcollection
                classroom_ref.collection('students').document(student_email).set(student_data)

                # Check if user exists; if not, create a new user document
                user_doc = db.collection('users').document(student_email)
                if not user_doc.get().exists:
                    user_doc.set({
                        'email': student_email,
                        'role': 'student',
                        'name': f"{row['lastname']}, {row['firstname']}",
                        'lsuID': lsu_id,
                        'createdAt': firestore.SERVER_TIMESTAMP
                    })

            os.remove(file_path)  # Remove file after processing
            return jsonify({"message": f'Classroom "{class_name}" created successfully!'}), 200

        except Exception as e:
            os.remove(file_path)  # Ensure the file is removed in case of error
            return jsonify({"error": f"Error processing file: {e}"}), 500

@app.route('/classroom/<class_id>', methods=['GET'])
def classroom_view(class_id):
    if not is_authenticated():
        return jsonify({"error": "Unauthorized access. Please log in."}), 401

    # Fetch the classroom document
    classroom_ref = db.collection('classrooms').document(class_id).get()
    if not classroom_ref.exists:
        return jsonify({"error": "Classroom not found."}), 404

    classroom = classroom_ref.to_dict()
    teacher_email = classroom['teacherEmail']
    student_emails = [
        student.id for student in db.collection('classrooms')
        .document(class_id)
        .collection('students')
        .stream()
    ]

    # Get role and userEmail from the session or request
    user_email = session.get('user', None)
    if user_email is None:
        return jsonify({"error": "User email not found in session."}), 403

    role = 'teacher' if user_email == teacher_email else 'student' if user_email in student_emails else None
    if role is None:
        return jsonify({"error": "Access denied."}), 403

    # Fetch the projects in the classroom
    projects_ref = db.collection('classrooms').document(class_id).collection('Projects').stream()
    projects = [{"id": proj.id, **proj.to_dict()} for proj in projects_ref]

    return jsonify({
        "class_id": class_id, 
        "class_name": classroom['class_name'], 
        "semester": classroom['semester'],  
        "projects": projects,
        "role": role,
    })

@app.route('/editclassroom/<classroom_id>', methods=['POST'])
def editclassroom(classroom_id):
    role = request.form.get('role')
    user_email = request.form.get('userEmail')
    print(f"Received edit request for classroom {classroom_id} from user with role: {role}, email: {user_email}")

    # Ensure authentication
    if not role or not user_email:
        return jsonify({"error": "Role or user email not provided."}), 400
    if role != 'teacher': 
        return jsonify({"error": "Access forbidden: User is not a teacher"}), 403

    # Get reference to the existing classroom document
    classroom_ref = db.collection('classrooms').document(classroom_id)
    classroom_doc = classroom_ref.get()
    if not classroom_doc.exists:
        return jsonify({"error": "Classroom does not exist."}), 404

    # Retrieve form data
    new_class_name = request.form.get('class_name')
    new_course_id = request.form.get('course_id')
    new_semester = request.form.get('semester')
    student_file = request.files.get('student_file')

    if not new_class_name or not new_course_id or not new_semester:
        return jsonify({"error": "Class name, course ID, and semester are required."}), 400

    # Validate duplicate classroom name (exclude current classroom)
    existing_classrooms = db.collection('classrooms') \
        .where('teacherEmail', '==', user_email) \
        .where('class_name', '==', new_class_name) \
        .get()
    for doc in existing_classrooms:
        if doc.id != classroom_id:
            return jsonify({"error": f"Classroom name '{new_class_name}' already exists. Please change."}), 400

    # Validate duplicate course id (exclude current classroom)
    existing_course_docs = db.collection('classrooms') \
        .where('courseID', '==', new_course_id) \
        .get()
    for doc in existing_course_docs:
        if doc.id != classroom_id:
            return jsonify({"error": f"Course ID '{new_course_id}' already exists. Please change."}), 400

    # Update classroom details
    try:
        classroom_ref.update({
            'class_name': new_class_name,
            'courseID': new_course_id,
            'semester': new_semester
        })
    except Exception as e:
        return jsonify({"error": f"Error updating classroom: {e}"}), 500

    # Process student file if provided
    if student_file:
        file_ext = os.path.splitext(student_file.filename)[1].lower()
        if file_ext not in ['.csv', '.xlsx']:
            return jsonify({"error": "Invalid file format. Please upload a CSV or Excel file."}), 400

        file_path = os.path.join(UPLOAD_FOLDER, student_file.filename)
        student_file.save(file_path)
        try:
            # Read the file based on its extension
            if file_ext == '.csv':
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)

            # Ensure required columns are present
            if not {'firstname', 'lastname', 'email', 'lsu_id'}.issubset(df.columns):
                os.remove(file_path)
                return jsonify({"error": "File must have columns: firstname, lastname, email, lsu_id."}), 400

            # Process each student record in the file
            for _, row in df.iterrows():
                student_email = row['email']
                lsu_id = str(row['lsu_id'])  # Convert to string if needed

                student_data = {
                    'firstName': row['firstname'],
                    'lastName': row['lastname'],
                    'email': student_email,
                    'lsuID': lsu_id,
                    'assignedAt': firestore.SERVER_TIMESTAMP
                }

                student_doc_ref = classroom_ref.collection('students').document(student_email)
                if student_doc_ref.get().exists:
                    # Update existing student details
                    student_doc_ref.update(student_data)
                else:
                    # Add new student record
                    student_doc_ref.set(student_data)

                # Ensure user exists in the 'users' collection
                user_doc = db.collection('users').document(student_email)
                if not user_doc.get().exists:
                    user_doc.set({
                        'email': student_email,
                        'role': 'student',
                        'name': f"{row['lastname']}, {row['firstname']}",
                        'lsuID': lsu_id,
                        'createdAt': firestore.SERVER_TIMESTAMP
                    })
            os.remove(file_path)  # Clean up file after processing
        except Exception as e:
            os.remove(file_path)
            return jsonify({"error": f"Error processing student file: {e}"}), 500

    return jsonify({"message": f'Classroom "{new_class_name}" updated successfully!'}), 200

@app.route('/update-students/<classroom_id>', methods=['POST'])
def update_students(classroom_id):
    # Verify classroom exists
    classroom_ref = db.collection('classrooms').document(classroom_id)
    if not classroom_ref.get().exists:
        return jsonify({"error": "Classroom does not exist."}), 404

    student_file = request.files.get('student_file')
    if not student_file:
        return jsonify({"error": "Student file is required."}), 400

    file_ext = os.path.splitext(student_file.filename)[1].lower()
    if file_ext not in ['.csv', '.xlsx']:
        return jsonify({"error": "Invalid file format. Please upload a CSV or Excel file."}), 400

    file_path = os.path.join(UPLOAD_FOLDER, student_file.filename)
    student_file.save(file_path)
    try:
        # Read file based on extension
        if file_ext == '.csv':
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        # Ensure required columns exist
        if not {'firstname', 'lastname', 'email', 'lsu_id'}.issubset(df.columns):
            os.remove(file_path)
            return jsonify({"error": "File must have columns: firstname, lastname, email, lsu_id."}), 400

        # Process each student record
        for _, row in df.iterrows():
            student_email = row['email']
            lsu_id = str(row['lsu_id'])
            student_data = {
                'firstName': row['firstname'],
                'lastName': row['lastname'],
                'email': student_email,
                'lsuID': lsu_id,
                'assignedAt': firestore.SERVER_TIMESTAMP
            }
            student_doc_ref = classroom_ref.collection('students').document(student_email)
            if student_doc_ref.get().exists:
                student_doc_ref.update(student_data)
            else:
                student_doc_ref.set(student_data)

            # Create user document if not exists
            user_doc = db.collection('users').document(student_email)
            if not user_doc.get().exists:
                user_doc.set({
                    'email': student_email,
                    'role': 'student',
                    'name': f"{row['lastname']}, {row['firstname']}",
                    'lsuID': lsu_id,
                    'createdAt': firestore.SERVER_TIMESTAMP
                })
        os.remove(file_path)
        return jsonify({"message": "Student records updated successfully!"}), 200
    except Exception as e:
        os.remove(file_path)
        return jsonify({"error": f"Error processing student file: {e}"}), 500

@app.route('/api/classroom/<courseID>/manage_students', methods=['GET'])
def manage_students(courseID):
    try:
        classroom_ref = db.collection('classrooms').document(courseID).collection('students')
        students = []
        for doc in classroom_ref.stream():
            student_data = doc.to_dict()
            students.append({
                'firstName': student_data.get('firstName'),
                'lastName': student_data.get('lastName'),
                'lsuId': student_data.get('lsuID'),
                'assignedAt': student_data.get('assignedAt'),
                'email': doc.id  # Use Firestore document ID as email
            })
        return jsonify({'students': students}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/classroom/<class_name>/add_student', methods=['POST'])
def add_student(class_name):
    try:
        data = request.get_json()
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        lsu_id = str(data.get('lsu_id'))  

        classroom_ref = db.collection('classrooms').document(class_name)
        
        # **Use email as the document ID instead of LSU ID**
        classroom_ref.collection('students').document(email).set({
            'firstName': first_name,
            'lastName': last_name,
            'email': email,
            'lsuID': lsu_id,
            'assignedAt': firestore.SERVER_TIMESTAMP
        })

        user_doc = db.collection('users').document(email)
        if not user_doc.get().exists:
            user_doc.set({
                'email': email,
                'role': 'student',
                'name': f"{last_name}, {first_name}",
                'lsuID': lsu_id,
                'createdAt': firestore.SERVER_TIMESTAMP
            })

        return jsonify({'message': f'{first_name} {last_name} has been added to the classroom.'}), 200

    except Exception as e:
        return jsonify({'error': f'Error adding student: {str(e)}'}), 500
    
@app.route('/api/classroom/<class_name>/edit_student/<student_email>', methods=['GET', 'PUT'])
def edit_student(class_name, student_email):
    try:
        classroom_ref = db.collection('classrooms').document(class_name).collection('students').document(student_email)

        if request.method == 'GET':
            student_doc = classroom_ref.get()
            if not student_doc.exists:
                return jsonify({'error': 'Student not found.'}), 404

            student_data = student_doc.to_dict()

            # Ensure LSU ID is returned correctly
            student_response = {
                'firstName': student_data.get('firstName', ''),
                'lastName': student_data.get('lastName', ''),
                'email': student_data.get('email', student_email),  # Ensure email is included
                'lsuId': student_data.get('lsuID', '')  # Ensure LSU ID is included
            }

            return jsonify({'student': student_response}), 200

        elif request.method == 'PUT':
            data = request.get_json()
            first_name = data.get('firstName')
            last_name = data.get('lastName')
            lsu_id = data.get('lsuId')  # Ensure LSU ID is updated

            # Update student details
            classroom_ref.update({
                'firstName': first_name,
                'lastName': last_name,
                'lsuID': lsu_id
            })

            # Also update the user record in Firestore (users collection)
            user_doc = db.collection('users').document(student_email)
            user_doc.update({
                'name': f"{last_name}, {first_name}",
                'lsuID': lsu_id
            })

            return jsonify({'message': 'Student information updated successfully.'}), 200

    except Exception as e:
        return jsonify({'error': f'Error updating student: {str(e)}'}), 500

@app.route('/api/classroom/<class_name>/delete_student/<lsu_id>', methods=['POST'])
def delete_student(class_name, lsu_id):
    try:
        classroom_ref = db.collection('classrooms').document(class_name)
        students_ref = classroom_ref.collection('students')

        # Find the student document based on LSU ID
        students_query = students_ref.where("lsuID", "==", lsu_id).stream()

        student_doc = None
        for doc in students_query:
            student_doc = doc
            break  # We only need the first match

        if not student_doc:
            return jsonify({'error': 'Student not found in the classroom'}), 404

        student_data = student_doc.to_dict()
        student_email = student_doc.id  # Firestore stores email as document ID
        student_name = f"{student_data.get('firstName', '')} {student_data.get('lastName', '')}".strip()

        # Delete the student document
        students_ref.document(student_email).delete()

        # Remove student from projects
        projects_ref = classroom_ref.collection('Projects')
        projects = projects_ref.stream()

        for project in projects:
            project_ref = projects_ref.document(project.id)
            teams_ref = project_ref.collection('teams')

            for team in teams_ref.stream():
                team_ref = teams_ref.document(team.id)
                team_data = team_ref.get().to_dict()

                if lsu_id in team_data:
                    team_ref.update({
                        lsu_id: firestore.DELETE_FIELD
                    })

                    if not team_ref.get().to_dict():
                        team_ref.delete()

        return jsonify({'message': f'{student_name} has been successfully removed from the classroom'}), 200

    except Exception as e:
        return jsonify({'error': f'Error deleting student: {str(e)}'}), 500
    
@app.route('/api/add_project/<class_name>', methods=['POST'])
def add_project(class_name):
    try:
        project_name = request.form.get('project_name')
        due_date = request.form.get('due_date')
        description = request.form.get('description')
        team_file = request.files.get('team_file')

        if not project_name or not due_date or not description:
            return jsonify({"message": "Project name, due date, and description are required."}), 400

        # Check for duplicate project name within the same class
        project_ref = db.collection('classrooms').document(class_name).collection('Projects').document(project_name)
        if project_ref.get().exists:
            return jsonify({"message": f"A project with the name '{project_name}' already exists. Please choose a different name."}), 400

        # If no duplicate, create the project
        project_ref.set({
            'projectName': project_name,
            'dueDate': due_date,
            'description': description,
            'createdAt': firestore.SERVER_TIMESTAMP
        })

        teams_created = False
        if team_file and allowed_file(team_file.filename):
            filename = secure_filename(team_file.filename)
            file_path = os.path.join('uploads', filename)
            team_file.save(file_path)

            try:
                # Read file and verify required columns (note: 'lsu_id' is not required here)
                data = pd.read_csv(file_path) if filename.endswith('.csv') else pd.read_excel(file_path)
                required_columns = ['firstname', 'lastname', 'email', 'teamname']
                missing_columns = [col for col in required_columns if col not in data.columns]
                if missing_columns:
                    return jsonify({"message": f"File missing columns: {', '.join(missing_columns)}"}), 400

                # Retrieve class students (keyed by student email)
                class_students = {
                    student.id: student.to_dict()
                    for student in db.collection('classrooms').document(class_name).collection('students').stream()
                }

                for _, row in data.iterrows():
                    student_email = row['email']
                    student_name = f"{row['lastname']}, {row['firstname']}"
                    team_name = row['teamname']

                    # Verify if the student exists in the class using email.
                    if student_email not in class_students:
                        return jsonify({"message": f"Student {student_name} (Email: {student_email}) is not in this class."}), 400

                    team_ref = db.collection('classrooms').document(class_name)\
                                .collection('Projects').document(project_name)\
                                .collection('teams').document(team_name)
                    
                    team_ref.set({
                        student_email: {
                            "name": student_name,
                            "email": student_email
                        }
                    }, merge=True)

                teams_created = True

            except Exception as e:
                return jsonify({"message": f"Error processing team file: {str(e)}"}), 500

        return jsonify({
            "message": "Project added successfully.",
            "teamsCreated": teams_created
        }), 200

    except Exception as e:
        return jsonify({"message": f"An unexpected error occurred: {str(e)}"}), 500
    
@app.route('/api/classroom/<class_name>/project/<project_name>/edit', methods=['POST'])
def edit_project(class_name, project_name):
    try:
        # Normalize the current project name from the URL
        project_name = project_name.strip()
        
        # Get new project details from the request form (normalize project name)
        project_name_new = request.form.get('project_name')
        if project_name_new:
            project_name_new = project_name_new.strip()
        due_date = request.form.get('due_date')
        description = request.form.get('description')
        team_file = request.files.get('team_file')

        # Get the current project document
        project_ref = db.collection('classrooms').document(class_name).collection('Projects').document(project_name)
        project_doc = project_ref.get()
        if not project_doc.exists:
            return jsonify({"message": f"Project '{project_name}' does not exist."}), 404

        current_data = project_doc.to_dict()
        # If any field is missing in the form, use the current value
        if not project_name_new:
            project_name_new = current_data.get('projectName', project_name)
        if not due_date:
            due_date = current_data.get('dueDate')
        if not description:
            description = current_data.get('description')

        # Validate required fields
        if not project_name_new or not due_date or not description:
            return jsonify({"message": "Project name, due date, and description are required."}), 400

        # If the project name is being changed, perform duplicate check
        if project_name_new.lower() != project_name.lower():
            duplicate_ref = db.collection('classrooms').document(class_name).collection('Projects').document(project_name_new)
            if duplicate_ref.get().exists:
                return jsonify({"message": f"A project with the name '{project_name_new}' already exists. Please choose a different name."}), 400

        # Update project details (other fields remain unchanged if not provided)
        project_ref.update({
            'projectName': project_name_new,
            'dueDate': due_date,
            'description': description,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })

        teams_updated = False
        if team_file and allowed_file(team_file.filename):
            filename = secure_filename(team_file.filename)
            file_path = os.path.join('uploads', filename)
            team_file.save(file_path)

            try:
                # Read the team file (CSV/Excel)
                data = pd.read_csv(file_path) if filename.endswith('.csv') else pd.read_excel(file_path)
                required_columns = ['firstname', 'lastname', 'email', 'teamname']
                missing_columns = [col for col in required_columns if col not in data.columns]
                if missing_columns:
                    return jsonify({"message": f"File missing columns: {', '.join(missing_columns)}"}), 400

                # Retrieve classroom students (keys are student emails)
                class_students = {
                    student.id: student.to_dict()
                    for student in db.collection('classrooms').document(class_name).collection('students').stream()
                }

                # Update the team details in the project using email as the key
                for _, row in data.iterrows():
                    student_email = row['email']
                    student_name = f"{row['lastname']}, {row['firstname']}"
                    team_name = row['teamname']

                    # Ensure the student exists in the class using email
                    if student_email not in class_students:
                        return jsonify({"message": f"Student {student_name} (Email: {student_email}) is not in this class."}), 400

                    team_ref = db.collection('classrooms').document(class_name)\
                                .collection('Projects').document(project_name)\
                                .collection('teams').document(team_name)
                    
                    team_ref.set({
                        student_email: {
                            "name": student_name,
                            "email": student_email
                        }
                    }, merge=True)

                teams_updated = True

            except Exception as e:
                return jsonify({"message": f"Error processing team file: {str(e)}"}), 500

        return jsonify({
            "message": "Project updated successfully.",
            "teamsUpdated": teams_updated
        }), 200

    except Exception as e:
        return jsonify({"message": f"An unexpected error occurred: {str(e)}"}), 500

def update_due_dates():
    classrooms = db.collection('classrooms').stream()
    for classroom in classrooms:
        class_id = classroom.id
        projects = db.collection('classrooms').document(class_id).collection('Projects').stream()
        
        for project in projects:
            project_ref = project.reference
            project_data = project.to_dict()
            if 'dueDate' in project_data and isinstance(project_data['dueDate'], str):
                try:
                    due_date = datetime.fromisoformat(project_data['dueDate'])
                    if due_date < datetime.now():
                        # Mark project as overdue or update logic as needed
                        project_ref.update({"status": "overdue"})
                except ValueError as e:
                    print(f"Invalid due date format for project {project.id}: {e}")

@app.route('/api/classroom/<class_name>/project/<project_name>/delete', methods=['DELETE'])
def delete_project(class_name, project_name):
    try:
        # Reference to the project document
        project_ref = db.collection('classrooms').document(class_name).collection('Projects').document(project_name)
        
        # Check if the project exists
        if not project_ref.get().exists:
            return jsonify({'error': 'Project not found'}), 404

        # Delete the project
        project_ref.delete()

        return jsonify({'message': 'Project deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': f'Error deleting project: {str(e)}'}), 500



@app.route('/api/classroom/<class_name>/project/<project_name>/manage_team', methods=['GET', 'POST'])
def manage_team(class_name, project_name):
    if not is_authenticated():
        return jsonify({"error": "Not authenticated"}), 401

    classroom_ref = db.collection('classrooms').document(class_name).get()
    if not classroom_ref.exists or classroom_ref.to_dict()['teacherEmail'] != session['user']:
        return jsonify({"error": "You do not have permission to manage teams."}), 403

    if request.method == 'POST':
        data = request.get_json()
        team_name = data.get('teamName')
        selected_students = data.get('students')

        if not team_name or not selected_students:
            return jsonify({"error": "Team name and at least one student are required."}), 400

        teams_ref = db.collection('classrooms').document(class_name).collection('Projects').document(project_name).collection('teams').stream()
        existing_teams = {team.id: team.to_dict() for team in teams_ref}

        if team_name not in existing_teams:
            return jsonify({"error": f"Team {team_name} does not exist."}), 404

        team_data = {}
        for student_email in selected_students:
            student_ref = db.collection('classrooms').document(class_name).collection('students').document(student_email).get()
            if student_ref.exists:
                student_data = student_ref.to_dict()
                team_data[student_email] = f"{student_data['lastName']}, {student_data['firstName']}"
            else:
                return jsonify({"error": f"Student {student_email} not found."}), 404

        team_ref = db.collection('classrooms').document(class_name).collection('Projects').document(project_name).collection('teams').document(team_name)
        team_ref.set(team_data)

        return jsonify({"message": f'Team "{team_name}" updated successfully!'}), 200

    # Fetch all students and current teams for the project
    all_students = db.collection('classrooms').document(class_name).collection('students').stream()
    teams_ref = db.collection('classrooms').document(class_name).collection('Projects').document(project_name).collection('teams').stream()

    assigned_students = {}
    available_students = []

    for s in all_students:
        student = s.to_dict()
        student_email = s.id
        assigned_students[student_email] = False
        available_students.append({'email': student_email, 'firstName': student['firstName'], 'lastName': student['lastName']})

    teams = []
    for team in teams_ref:
        team_name = team.id
        team_data = team.to_dict()
        students_in_team = [{'email': email, 'name': team_data[email]} for email in team_data]
        teams.append({'teamName': team_name, 'students': students_in_team})
        for student in students_in_team:
            assigned_students[student['email']] = True

    available_students = [s for s in available_students if not assigned_students[s['email']]]

    return jsonify({
        "class_name": class_name,
        "project_name": project_name,
        "students": available_students,
        "teams": teams
    })
@app.route('/save-teams', methods=['POST'])
def save_teams():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data received."}), 400

        teams_client = data.get("teams", [])
        class_name = data.get('class_name')
        project_name = data.get('project_name')

        if not isinstance(teams_client, list):
            return jsonify({"error": "Invalid format for teams. Expected a list."}), 400

        teams_collection_ref = db.collection('classrooms').document(class_name)\
                                    .collection('Projects').document(project_name)\
                                    .collection('teams')

        new_teams_data = {}
        new_team_names = set()

        for team in teams_client:
            team_name = team.get("teamName")
            if not team_name:
                return jsonify({"error": "Team name is missing for one of the teams."}), 400
            new_team_names.add(team_name)
            students = team.get("students", [])
            team_data = {}

            for student_email in students:
                student_ref = db.collection('classrooms').document(class_name)\
                                .collection('students').document(student_email).get()
                if student_ref.exists:
                    student_info = student_ref.to_dict()
                    first_name = student_info.get('firstName') or student_info.get('firstname') or ''
                    last_name = student_info.get('lastName') or student_info.get('lastname') or ''
                    full_name = f"{last_name}, {first_name}".strip()
                    if not full_name or full_name == ",":
                        full_name = student_email
                    
                    # Store as a map under the student's email
                    team_data[student_email] = {
                        "email": student_email,
                        "name": full_name
                    }
                else:
                    return jsonify({"error": f"Student {student_email} does not exist in the classroom."}), 404
            
            new_teams_data[team_name] = team_data

        # Fetch existing teams
        existing_team_docs = teams_collection_ref.stream()
        existing_team_names = {doc.id for doc in existing_team_docs}

        # Update or create teams
        for team_name, team_data in new_teams_data.items():
            teams_collection_ref.document(team_name).set(team_data)

        # Delete removed teams
        teams_to_delete = existing_team_names - new_team_names
        for team_name in teams_to_delete:
            teams_collection_ref.document(team_name).delete()

        return jsonify({"message": "Teams saved successfully!"}), 200

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/student/<email>/project/<class_name>/<project_name>', methods=['GET'])
def get_student_team(email, class_name, project_name):
    try:
        teams_ref = db.collection('classrooms').document(class_name).collection('Projects').document(project_name).collection('teams').stream()

        for team in teams_ref:
            team_data = team.to_dict()

            # If student's email is found in any team, return that team
            if email in team_data:
                return jsonify({"teamName": team.id}), 200

        return jsonify({"message": "Student not assigned to any team"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/student/<email>/projects', methods=['GET'])
def get_student_projects(email):
    try:
        student_teams = []

        # Loop through all classrooms
        classrooms = db.collection('classrooms').stream()
        for classroom in classrooms:
            class_id = classroom.id
            projects = db.collection('classrooms').document(class_id).collection('Projects').stream()

            for project in projects:
                project_id = project.id
                teams_ref = db.collection('classrooms').document(class_id).collection('Projects').document(project_id).collection('teams').stream()

                for team in teams_ref:
                    team_data = team.to_dict()

                    # If the student's email exists in the team, add it to the result
                    if email in team_data:
                        student_teams.append({
                            "class_id": class_id,
                            "project_name": project_id,
                            "team_name": team.id
                        })

        if not student_teams:
            return jsonify({"message": "No teams found for this student."}), 404

        return jsonify({"projects": student_teams}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/contact', methods=['POST'])
def handle_contact():
    data = request.get_json()

    # Log the data to the console (for debugging)
    print(f"New message from {data['name']} ({data['email']}):")
    print(f"Phone: {data['phone']}")
    print(f"Message: {data['message']}")

    # Save the data to Firestore in the contactMessages collection
    contact_ref = db.collection('contactMessages').add({
        'name': data['name'],
        'email': data['email'],
        'phone': data['phone'],
        'message': data['message'],
        'timestamp': SERVER_TIMESTAMP  # Automatically assigns the current time
    })

    # Return a success response
    return jsonify({"message": "Message received successfully!"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
