import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useFlashMessage } from '../FlashMessageContext';

const EditProject = () => {
  const { className, projectName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const addMessage = useFlashMessage();

  const initialProjectDetails = location.state?.projectDetails || {
    description: '',
    dueDate: '',
  };

  const [formData, setFormData] = useState({
    projectName: projectName || '',
    description: initialProjectDetails.description,
    dueDate: initialProjectDetails.dueDate ? new Date(initialProjectDetails.dueDate) : new Date(),
    teamFile: null,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: files ? files[0] : value,
    }));
  };

  const handleDateChange = (date) => {
    setFormData((prevData) => ({
      ...prevData,
      dueDate: date,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const form = new FormData();
    form.append('project_name', formData.projectName);
    form.append('description', formData.description);
    form.append('due_date', formData.dueDate.toISOString());
    if (formData.teamFile) {
      form.append('team_file', formData.teamFile);
    }

    fetch(`http://localhost:5000/api/classroom/${className}/project/${projectName}/edit`, {
      method: 'POST',
      body: form,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          addMessage('danger', data.message);
        } else {
          addMessage('success', data.message);
          navigate(`/classroom/${className}/project/${projectName}`);
        }
      })
      .catch((error) => {
        console.error('Error updating project:', error);
        addMessage('danger', 'An error occurred. Please try again.');
      });
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/classroom/${className}/project/${projectName}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        addMessage('success', `Project '${formData.projectName}' deleted successfully!`);
        navigate(`/classroom/${className}`);
      } else {
        addMessage('danger', 'Failed to delete project. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      addMessage('danger', 'An error occurred while deleting the project.');
    }
  };

  return (
    <div className="container form-container mt-4">
      <h1 className="form-title">Edit Project</h1>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="mb-3">
          <label htmlFor="projectName" className="form-label">Project Name</label>
          <input
            type="text"
            id="projectName"
            name="projectName"
            className="form-control"
            value={formData.projectName}
            readOnly
            title="Project name is not editable"
            style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">Project Description</label>
          <textarea
            id="description"
            name="description"
            className="form-control"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        {/* Due Date & Time Picker in the Same Line */}
        <div className="mb-3 d-flex align-items-center">
          <label htmlFor="dueDate" className="form-label me-3">Due Date & Time:</label>
          <DatePicker
            selected={formData.dueDate}
            onChange={handleDateChange}
            showTimeSelect
            dateFormat="Pp"
            className="form-control"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="teamFile" className="form-label">Upload Team File (CSV/Excel) (Optional)</label>
          <input
            type="file"
            id="teamFile"
            name="teamFile"
            className="form-control"
            onChange={handleChange}
          />
        </div>

        <div className="d-flex justify-content-start gap-3">
          <button type="submit" className="btn action-btn">
            <i className="bi bi-upload"></i> Update
          </button>
          <button
            type="button"
            className="btn back-btn" 
            onClick={() => navigate(`/classroom/${className}/project/${projectName}`)}
          >
            <i className="bi bi-arrow-left"></i> Back to Project
          </button>
          <button
            type="button"
            className="btn delete-btn"
            onClick={() => setShowDeleteModal(true)}
          >
            <i className="bi bi-trash"></i> Delete Project
          </button>
        </div>
      </form>

      {showDeleteModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the project <strong>{formData.projectName}</strong>? This action cannot be undone.</p>
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

export default EditProject;
