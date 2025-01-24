import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AddClassroom = () => {
  const navigate = useNavigate();
  const [className, setClassName] = useState("");
  const [studentFile, setStudentFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");  // State to handle errors
  const [role, setRole] = useState(localStorage.getItem('role')); // Get role from localStorage
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail')); // Get role from localStorage

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();  // Get file extension
      if (!['.csv', '.xls', '.xlsx'].includes(fileExtension)) {
        setError("Invalid file format. Please upload a CSV or Excel file.");
        setStudentFile(null);  // Reset the file if invalid format
      } else {
        setError("");  // Clear any error if the file is valid
        setStudentFile(file);
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!className || !studentFile) {
        setError("Please provide a class name and upload a valid file.");
        return;
    }

    const formData = new FormData();
    formData.append("class_name", className);
    formData.append("student_file", studentFile);

    // Append role and user email to the form data
    formData.append("role", role);
    formData.append("userEmail", userEmail);

    try {
        setIsSubmitting(true);
        const response = await axios.post("http://localhost:5000/addclassroom", formData, {
            withCredentials: true, 
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        console.log("Classroom added:", response.data);
        setIsSubmitting(false);
        navigate("/teachers-home");
    } catch (error) {
        console.error("Error uploading classroom:", error.response?.data || error.message);
        setError("Failed to upload classroom. Please try again.");
        setIsSubmitting(false);
    }
};


  return (
    <div className="container mt-2">
      <h1 className="mb-4">Add New Classroom</h1>

      {error && <div className="alert alert-danger">{error}</div>} {/* Display error message */}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="mb-3">
          <label htmlFor="class_name" className="form-label">
            <i className="bi bi-book"></i> Class Name
          </label>
          <input
            type="text"
            id="class_name"
            name="class_name"
            className="form-control"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="student_file" className="form-label">
            <i className="bi bi-file-earmark-spreadsheet"></i> Student File (CSV or Excel)
          </label>
          <input
            type="file"
            id="student_file"
            name="student_file"
            className="form-control"
            accept=".csv, .xls, .xlsx"
            onChange={handleFileChange}
            required
          />
        </div>

        <div className="d-flex justify-content-start gap-2">
          <button type="submit" className="btn btn-dark" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <i className="bi bi-upload"></i> Upload
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => navigate("/teachers-home")}
          >
            <i className="bi bi-arrow-left"></i> Back to Home
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddClassroom;
