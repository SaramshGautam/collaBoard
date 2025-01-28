import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, request, jsonify, session
import os
from datetime import datetime
import pandas as pd
from flask_cors import CORS
from flask import jsonify, request, redirect, url_for, flash
from werkzeug.utils import secure_filename
from google.cloud.firestore import SERVER_TIMESTAMP


# Initialize Flask App
app = Flask(__name__)
app.secret_key = 'secret_key' 

# Initialize Firebase
cred = credentials.Certificate("firebase-key.json")
firebase_admin.initialize_app(cred)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:3000"}})

db = firestore.client()

# Ensure uploads directory exists
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv', 'xls', 'xlsx'}  # You can add other file extensions here
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route('/test_cors', methods=['GET'])
def test_cors():
    return jsonify({"message": "CORS is working!"}), 200
    
def is_authenticated():
    return 'user' in session and 'role' in session  # Check if user is logged in

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Credentials', 'true')  
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
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

    if role != 'teacher':  # Check if the role is 'teacher'
        return jsonify({"error": "Access forbidden: User is not a teacher"}), 403

    # Process the file and classroom creation
    if request.method == 'POST':
        class_name = request.form.get('class_name')
        file = request.files.get('student_file')

        if not class_name or not file:
            return jsonify({"error": "Class name and file are required."}), 400

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
                return jsonify({"error": "File must have columns: firstname, lastname, email, lsu_id."}), 400

            # Create or update classroom document
            classroom_ref = db.collection('classrooms').document(class_name)
            classroom_ref.set({'classID': class_name, 'teacherEmail': user_email})  # Use the provided user_email

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

                # Use LSU ID as the document ID
                classroom_ref.collection('students').document(lsu_id).set(student_data)

                # Check if user exists, if not, create a new one
                user_doc = db.collection('users').document(lsu_id)
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

@app.route('/classroom/<class_name>', methods=['GET'])
def classroom_view(class_name):
    if not is_authenticated():
        return jsonify({"error": "Unauthorized access. Please log in."}), 401

    # Fetch the classroom document
    classroom_ref = db.collection('classrooms').document(class_name).get()
    if not classroom_ref.exists:
        return jsonify({"error": "Classroom not found."}), 404

    classroom = classroom_ref.to_dict()
    teacher_email = classroom['teacherEmail']
    student_emails = [
        student.id for student in db.collection('classrooms')
        .document(class_name)
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
    projects_ref = db.collection('classrooms').document(class_name).collection('Projects').stream()
    projects = [{"id": proj.id, **proj.to_dict()} for proj in projects_ref]

    return jsonify({
        "class_name": class_name,
        "projects": projects,
        "role": role,
    })
@app.route('/api/classroom/<classID>/manage_students', methods=['GET'])
def manage_students(classID):
    try:
        classroom_ref = db.collection('classrooms').document(classID).collection('students')
        students = []
        for doc in classroom_ref.stream():
            student_data = doc.to_dict()
            students.append({
                'firstName': student_data.get('firstName'),
                'lastName': student_data.get('lastName'),
                'lsuId': student_data.get('lsuID'),  # Lowercase "d" for consistency
                'assignedAt': student_data.get('assignedAt')
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
        classroom_ref.collection('students').document(lsu_id).set({
            'firstName': first_name,
            'lastName': last_name,
            'email': email,
            'lsuID': lsu_id,
            'assignedAt': firestore.SERVER_TIMESTAMP
        })

        user_doc = db.collection('users').document(lsu_id)
        if not user_doc.get().exists:
            user_doc.set({
                'role': 'student',
                'name': f"{last_name}, {first_name}",
                'lsuID': lsu_id,
                'createdAt': firestore.SERVER_TIMESTAMP
            })

        return jsonify({'message': f'{first_name} {last_name} has been added to the classroom.'}), 200

    except Exception as e:
        return jsonify({'error': f'Error adding student: {str(e)}'}), 500

@app.route('/api/classroom/<class_name>/edit_student/<lsu_id>', methods=['GET', 'PUT'])
def edit_student(class_name, lsu_id):
    try:
        lsu_id = str(lsu_id)  # Treat LSU ID as string
        student_ref = db.collection('classrooms').document(class_name).collection('students').document(lsu_id)

        if request.method == 'GET':
            # Fetching student data
            student_doc = student_ref.get()

            if not student_doc.exists:
                return jsonify({'error': 'Student not found.'}), 404

            student = student_doc.to_dict()

            # Ensure lsuId is included in the returned student data
            student['lsuId'] = lsu_id  # Make sure lsuId is included
            return jsonify({'student': student}), 200

        elif request.method == 'PUT':
            # Editing student data
            data = request.get_json()
            first_name = data.get('firstName')
            last_name = data.get('lastName')

            student_ref.update({
                'firstName': first_name,
                'lastName': last_name
            })

            # Optionally, update user data
            user_doc = db.collection('users').document(lsu_id)
            user_doc.update({
                'name': f"{last_name}, {first_name}"
            })

            return jsonify({'message': 'Student information updated successfully.'}), 200

    except Exception as e:
        return jsonify({'error': f'Error updating student: {str(e)}'}), 500


@app.route('/api/classroom/<class_name>/delete_student/<lsu_id>', methods=['POST'])
def delete_student(class_name, lsu_id):
    try:
        classroom_ref = db.collection('classrooms').document(class_name)
        student_ref = classroom_ref.collection('students').document(lsu_id)

        if not student_ref.get().exists:
            return jsonify({'error': 'Student not found in the classroom'}), 404

        student_ref.delete()

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

                    # If no students are left in the team, delete the team
                    if not team_ref.get().to_dict():
                        team_ref.delete()

        return jsonify({'message': 'Student has been successfully removed from the classroom'}), 200

    except Exception as e:
        return jsonify({'error': f'Error deleting student: {str(e)}'}), 500

@app.route('/api/add_project/<class_name>', methods=['POST'])
def add_project(class_name):
    try:
        # Parse incoming data
        project_name = request.form.get('project_name')
        due_date = request.form.get('due_date')
        description = request.form.get('description')
        team_file = request.files.get('team_file')

        if not project_name or not due_date or not description:
            return jsonify({"message": "Project name, due date, and description are required."}), 400

        # Add project to the database
        project_ref = db.collection('classrooms').document(class_name).collection('Projects').document(project_name)
        project_ref.set({
            'projectName': project_name,
            'dueDate': due_date,
            'description': description,
            'createdAt': firestore.SERVER_TIMESTAMP
        })

        # Handle team file
        teams_created = False
        if team_file and allowed_file(team_file.filename):
            filename = secure_filename(team_file.filename)
            file_path = os.path.join('uploads', filename)
            team_file.save(file_path)
            try:
                # Read the file (CSV or Excel)
                data = pd.read_csv(file_path) if filename.endswith('.csv') else pd.read_excel(file_path)
                required_columns = ['firstname', 'lastname', 'email', 'lsu_id', 'teamname']

                # Validate required columns
                missing_columns = [col for col in required_columns if col not in data.columns]
                if missing_columns:
                    return jsonify({"message": f"File missing columns: {', '.join(missing_columns)}"}), 400

                # Fetch all LSU IDs in the classroom
                class_students = [
                    student.id for student in db.collection('classrooms').document(class_name).collection('students').stream()
                ]

                # Process each row and add team info
                for _, row in data.iterrows():
                    lsu_id = str(row['lsu_id'])  # Get LSU ID
                    student_email = row['email']
                    student_name = f"{row['lastname']}, {row['firstname']}"
                    team_name = row['teamname']

                    if lsu_id not in class_students:
                        return jsonify({"message": f"Student {student_name} is not part of this class."}), 400

                    # Add student to the respective team
                    team_ref = db.collection('classrooms').document(class_name).collection('Projects').document(project_name).collection('teams').document(team_name)
                    team_ref.set({
                        lsu_id: {
                            "name": student_name,
                            "email": student_email,
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
        data = request.get_json()  # Move this line here to properly initialize 'data'
        if not data:
            return jsonify({"error": "No data received."}), 400

        teams = data.get("teams", [])
        class_name = data.get('class_name')
        project_name = data.get('project_name')

        if not isinstance(teams, list):
            return jsonify({"error": "Invalid format for teams. Expected a list."}), 400

        teams_collection_ref = db.collection('classrooms').document(class_name).collection('Projects').document(project_name).collection('teams')

        existing_teams = teams_collection_ref.stream()
        existing_team_data = {team.id: team.to_dict() for team in existing_teams}

        processed_students = set()

        for team in teams:
            team_name = team.get("teamName")
            students = team.get("students", [])

            if not team_name:
                return jsonify({"error": "Team name is missing for one of the teams."}), 400

            if students is None:
                students = []

            team_data = {}
            for student_email in students:
                if student_email in processed_students:
                    continue

                processed_students.add(student_email)

                student_ref = db.collection('classrooms').document(class_name).collection('students').document(student_email).get()
                if student_ref.exists:
                    student_info = student_ref.to_dict()
                    team_data[student_email] = f"{student_info['lastName']}, {student_info['firstName']}"

                    for old_team_name, old_team_data in existing_team_data.items():
                        if student_email in old_team_data:
                            del existing_team_data[old_team_name][student_email]

                            if existing_team_data[old_team_name]:
                                teams_collection_ref.document(old_team_name).set(existing_team_data[old_team_name])
                            else:
                                # Delete empty teams
                                teams_collection_ref.document(old_team_name).delete()
                                print(f"Deleted empty team document: '{old_team_name}'")
                else:
                    return jsonify({"error": f"Student {student_email} does not exist in the classroom."}), 404

            teams_collection_ref.document(team_name).set(team_data)

        return jsonify({"message": "Teams saved successfully!"}), 200

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
