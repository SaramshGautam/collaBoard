import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useFlashMessage } from '../FlashMessageContext';

const ManageStudent = () => {
  const navigate = useNavigate();
  const { className } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const addMessage = useFlashMessage();

  // State for modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Fetch students from the backend
  useEffect(() => {
    if (!className) return;

    const fetchStudents = async (courseID) => {
      try {
        const response = await axios.get(`http://localhost:5000/api/classroom/${courseID}/manage_students`);

        console.log("Fetched Students:", response.data.students);

        // Ensure each student object has an LSU ID and email
        const updatedStudents = response.data.students.map((student) => ({
          ...student,
          email: student.email || student.id,
          lsuId: student.lsuId || "",
        }));

        setStudents(updatedStudents);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students:", error);
        setLoading(false);
        addMessage("danger", "Failed to fetch students.");
      }
    };

    fetchStudents(className);
  }, [className, addMessage]);

  // Function to handle deletion
  const handleDelete = async (lsuId) => {
    if (!lsuId) {
      console.error("Error: LSU ID is undefined");
      addMessage("danger", "Unable to delete student: Missing LSU ID.");
      return;
    }

    try {
      console.log("Sending delete request for LSU ID:", lsuId);

      const response = await axios.post(
        `http://localhost:5000/api/classroom/${className}/delete_student/${lsuId}`
      );

      addMessage("success", response.data.message);

      // Remove the deleted student from state
      setStudents((prevStudents) => prevStudents.filter((student) => student.lsuId !== lsuId));
    } catch (error) {
      console.error("Error deleting student:", error);
      const errorMsg =
        (error.response && error.response.data && error.response.data.error) ||
        "Error deleting student.";
      addMessage("danger", errorMsg);
    }
  };

  // Confirm deletion from the modal
  const confirmDeleteStudent = async () => {
    if (studentToDelete) {
      await handleDelete(studentToDelete.lsuId);
      setShowDeleteModal(false);
      setStudentToDelete(null);
    }
  };

  return (
    <div className="mt-2 pt-2">
      <h1 className="classroom-heading fw-bold mb-4 fs-4">
        Manage Students for Classroom: <span className="text-dark">{className}</span>
      </h1>

      {/* Add Student Button with bottom margin */}
      <button
        className="btn action-btn mb-3"
        onClick={() => navigate(`/classroom/${className}/add-student`)}
      >
        <i className="bi bi-person-plus"></i> Add New Student
      </button>

      {/* Students List */}
      <div className="card border-dark mb-3">
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
                      navigate(
                        `/classroom/${className}/manage-students/${encodeURIComponent(student.email)}/edit`
                      )
                    }
                  >
                    <i className="bi bi-pencil"></i> Edit
                  </button>

                  {/* Delete Button opens the confirmation modal */}
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      setStudentToDelete(student);
                      setShowDeleteModal(true);
                    }}
                  >
                    <i className="bi bi-x-circle text-danger"></i>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete student{' '}
                  <strong>
                    {studentToDelete
                      ? `${studentToDelete.lastName}, ${studentToDelete.firstName}`
                      : ''}
                  </strong>
                  ? This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmDeleteStudent}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back Button with top margin */}
      <button className="btn back-btn mt-3" onClick={() => navigate(`/classroom/${className}`)}>
        <i className="bi bi-arrow-left"></i> Back to Classroom
      </button>
    </div>
  );
};

export default ManageStudent;
