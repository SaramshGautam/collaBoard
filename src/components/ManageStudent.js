import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const ManageStudent = () => {
    const navigate = useNavigate();
    const { className } = useParams(); // Extract className from URL
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch students from the backend
    useEffect(() => {
        if (!className) return; // Ensure className exists before making the API request

        const fetchStudents = async (classID) => {
            try {
                const response = await axios.get(`http://localhost:5000/api/classroom/${classID}/manage_students`);
                setStudents(response.data.students);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching students:", error);
                setLoading(false);
            }
        };

        fetchStudents(className); // Pass className as classID
    }, [className]);

    // Handle deleting a student
    const handleDelete = async (lsuId) => {
        try {
            const response = await axios.post(`http://localhost:5000/api/classroom/${className}/delete_student/${lsuId}`);
            alert(response.data.message);
            setStudents((prevStudents) => prevStudents.filter((student) => student.lsuId !== lsuId)); // Update state after deletion
        } catch (error) {
            console.error("Error deleting student:", error);
        }
    };

    return (
        <div className="mt-2 pt-2">
          <h1 className="classroom-heading fw-bold mb-4 fs-4">
            Manage Students for Classroom: <span className="text-dark">{className}</span>
          </h1>
      
          {/* Add Student Button */}
          <button
            className="btn btn-dark mb-3"
            onClick={() => navigate(`/classroom/${className}/add-student`)}
          >
            <i className="bi bi-person-plus"></i> Add New Student
          </button>
      
          {/* Students List */}
          <div className="card border-dark">
            <div className="card-header" style={{ backgroundColor: 'rgb(65, 107, 139)', color: 'white' }}>
              <h2 className="h5">Students List</h2>
            </div>
            <ul className="list-group list-group-flush">
  {loading ? (
    <li className="list-group-item text-center text-muted">
      <i className="bi bi-hourglass-split"></i> Loading students...
    </li>
  ) : students.length > 0 ? (
    students.map((student) => (
      <li
        key={student.lsuId}
        className="list-group-item d-flex justify-content-between align-items-center mb-2"
      >
        <div className="d-flex flex-column">
          {student.lastName}, {student.firstName}
        </div>
        <div className="d-flex align-items-center gap-2">
          {/* Edit Button */}
          <button
  className="btn btn-sm btn-edit"
  onClick={() =>
    navigate(`/classroom/${className}/manage-students/${encodeURIComponent(student.lsuId)}/edit`)
  }
>
  <i className="bi bi-pencil"></i> Edit
</button>

          {/* Delete Button */}
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => handleDelete(student.lsuId)}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      </li>
    ))
  ) : (
    <li className="list-group-item text-center text-muted">
      No students in this classroom.
    </li>
  )}
</ul>


          </div>
      
          {/* Back Button */}
          <button
            className="btn back-btn"
            onClick={() => navigate(`/classroom/${className}`)}
          >
            <i className="bi bi-arrow-left"></i> Back to Classroom
          </button>
        </div>
      );      
};

export default ManageStudent;
