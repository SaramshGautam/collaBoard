import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EditProject = () => {
  const { className, projectName } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    projectName: projectName || '',
    description: '',
    dueDate: '',
    teamFile: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = new FormData();
    form.append('project_name', formData.projectName);
    form.append('description', formData.description);
    form.append('due_date', formData.dueDate);
    if (formData.teamFile) {
      form.append('team_file', formData.teamFile);
    }

    // Make an API call to save changes (placeholder logic)
    fetch(`/api/classroom/${className}/project/${projectName}/edit`, {
      method: 'POST',
      body: form,
    })
      .then((response) => {
        if (response.ok) {
          navigate(`/classroom/${className}/project/${projectName}`);
        } else {
          alert('Failed to update project. Please try again.');
        }
      })
      .catch((error) => {
        console.error('Error updating project:', error);
        alert('An error occurred. Please try again.');
      });
  };

  return (
    <div className="container mt-2">
      <h1 className="mb-4">Edit Project</h1>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="mb-3">
          <label htmlFor="projectName" className="form-label">
            <i className="bi bi-card-text"></i> Project Name
          </label>
          <input
            type="text"
            id="projectName"
            name="projectName"
            className="form-control"
            value={formData.projectName}
            onChange={handleChange}
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
            value={formData.description}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <div className="mb-3">
          <label htmlFor="dueDate" className="form-label">
            <i className="bi bi-calendar-event"></i> Due Date
          </label>
          <input
            type="datetime-local"
            id="dueDate"
            name="dueDate"
            className="form-control"
            value={formData.dueDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="teamFile" className="form-label">
            <i className="bi bi-file-earmark-spreadsheet"></i> Upload Team File (CSV/Excel)
          </label>
          <input
            type="file"
            id="teamFile"
            name="teamFile"
            className="form-control"
            onChange={handleChange}
          />
        </div>

        <div className="d-flex justify-content-start gap-2">
          <button type="submit" className="btn btn-dark">
            <i className="bi bi-save"></i> Save Changes
          </button>
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => navigate(`/classroom/${className}/project/${projectName}`)}
          >
            <i className="bi bi-arrow-left me-2"></i> Back to Project
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProject;
