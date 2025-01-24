import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const AddProject = () => {
  const { className } = useParams();  // Get classroom name from URL params
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [teamFile, setTeamFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    setTeamFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('project_name', projectName);
    formData.append('description', description);
    formData.append('due_date', dueDate);
    if (teamFile) formData.append('team_file', teamFile);

    try {
      // Adjust the URL and method according to your backend API
      await axios.post(`/api/add_project/${className}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate(`/classroom/${className}`); // Redirect to classroom page after successful submission
    } catch (error) {
      console.error('Error adding project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-2">
      <h1 className="mb-4">Add New Project</h1>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="mb-3">
          <label htmlFor="project_name" className="form-label">
            <i className="bi bi-card-text"></i> Project Name
          </label>
          <input
            type="text"
            id="project_name"
            name="project_name"
            className="form-control"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">
            <i className="bi bi-pencil-square"></i> Project Description
          </label>
          <textarea
            id="description"
            name="description"
            className="form-control"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="due_date" className="form-label">
            <i className="bi bi-calendar-event"></i> Due Date
          </label>
          <input
            type="datetime-local"
            id="due_date"
            name="due_date"
            className="form-control"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            min={new Date().toISOString().slice(0, 16)} // Set current date and time as the minimum allowed value
            max="9999-12-31T23:59"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="team_file" className="form-label">
            <i className="bi bi-file-earmark-spreadsheet"></i> Team CSV/Excel File (Optional)
          </label>
          <input
            type="file"
            id="team_file"
            name="team_file"
            className="form-control"
            accept=".csv, .xls, .xlsx"
            onChange={handleFileChange}
          />
        </div>

        <div className="d-flex justify-content-start gap-2">
          <button type="submit" className="btn btn-dark" id="upload-btn" disabled={isSubmitting}>
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
            onClick={() => navigate(`/classroom/${className}`)}
          >
            <i className="bi bi-arrow-left"></i> Back to Classroom
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProject;
