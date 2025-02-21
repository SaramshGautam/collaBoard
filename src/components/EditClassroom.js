import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useFlashMessage } from '../FlashMessageContext';

const EditClassroom = () => {
  const { className } = useParams();
  const navigate = useNavigate();
  const db = getFirestore();
  const addMessage = useFlashMessage();

  const [classroomData, setClassroomData] = useState({
    className: "",
    courseId: "",
    semester: "",
  });

  const [studentFile, setStudentFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false); // State for delete confirmation modal

  useEffect(() => {
    const fetchClassroomDetails = async () => {
      try {
        const docRef = doc(db, "classrooms", className);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setClassroomData({
            className: docSnap.data().class_name,
            courseId: docSnap.data().courseID,
            semester: docSnap.data().semester,
          });
        } else {
          setError("Classroom not found.");
        }
      } catch (err) {
        setError("Failed to fetch classroom details.");
      }
    };
    fetchClassroomDetails();
  }, [className, db]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileExtension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (![".csv", ".xls", ".xlsx"].includes(fileExtension)) {
        setError("Invalid file format. Please upload a CSV or Excel file.");
        setStudentFile(null);
      } else {
        setError("");
        setStudentFile(file);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
  
    if (!classroomData.className || !classroomData.courseId || !classroomData.semester) {
      setError("Please provide all required details.");
      return;
    }
  
    try {
      setIsSubmitting(true);
  
      // Create a FormData object and append all necessary fields
      const formData = new FormData();
      formData.append("role", "teacher");
      // Replace with your current teacher's email (for example, from your auth context)
      formData.append("userEmail", "teacher@example.com");
      formData.append("class_name", classroomData.className);
      formData.append("course_id", classroomData.courseId);
      formData.append("semester", classroomData.semester);
      
      if (studentFile) {
        formData.append("student_file", studentFile);
      }
  
      // Send the request to your Flask endpoint
      const response = await axios.post(
        `http://localhost:5000/editclassroom/${className}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
  
      setIsSubmitting(false);
      addMessage("success", response.data.message);
      navigate(`/classroom/${className}`);
    } catch (err) {
      // Use the error message returned from the backend, if available
      setError(err.response?.data?.error || "Failed to update classroom. Please try again.");
      setIsSubmitting(false);
    }
  };  

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "classrooms", className));
      addMessage("success", `Classroom '${classroomData.className}' deleted successfully!`);
      navigate("/teachers-home");
    } catch (error) {
      setError("Failed to delete classroom. Please try again.");
    }
  };

  return (
    <div className="container mt-4 d-flex justify-content-center">
      <div className="form-container">
        <h1 className="form-title">Edit Classroom</h1>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleUpdate} encType="multipart/form-data">
          <div className="row">
            <div className="col-md-6 form-group">
              <label htmlFor="class_name" className="form-label">Class Name</label>
              <input
                type="text"
                id="class_name"
                className="form-control"
                value={classroomData.className}
                onChange={(e) =>
                  setClassroomData({ ...classroomData, className: e.target.value })
                }
                required
              />
            </div>

            <div className="col-md-6 form-group">
            <label htmlFor="course_id" className="form-label">Course ID</label>
            <input
              type="text"
              id="course_id"
              className="form-control"
              value={classroomData.courseId}
              readOnly
              title="Project name is not editable"
              style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }}
            />
          </div>
          </div>

          <div className="row">
            <div className="col-md-6 form-group">
              <label htmlFor="semester" className="form-label">Semester</label>
              <select
                id="semester"
                className="form-control"
                value={classroomData.semester}
                onChange={(e) =>
                  setClassroomData({ ...classroomData, semester: e.target.value })
                }
                required
              >
                <option value="">Select Semester</option>
                <option value="Spring 2025">Spring 2025</option>
                <option value="Summer 2025">Summer 2025</option>
                <option value="Fall 2025">Fall 2025</option>
              </select>
            </div>

            <div className="col-md-6 form-group">
              <label htmlFor="student_file" className="form-label">
                Update Student File (CSV or Excel)
              </label>
              <input
                type="file"
                id="student_file"
                className="form-control"
                accept=".csv, .xls, .xlsx"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="d-flex justify-content-start gap-3 mt-3">
            <button type="submit" className="btn action-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm"></span> Uploading...
                </>
              ) : (
                <>
                  <i className="bi bi-upload"></i> Update
                </>
              )}
            </button>
            <button type="button" className="btn back-btn" onClick={() => navigate("/teachers-home")}>
              <i className="bi bi-arrow-left"></i> Back to Home
            </button>
            <button type="button" className="btn delete-btn" onClick={() => setShowDeleteModal(true)}>
              Delete Classroom
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the classroom <strong>{classroomData.className}</strong>? This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditClassroom;
