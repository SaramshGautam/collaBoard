import React, { useState } from 'react';
import axios from 'axios'; // Import axios for sending the form data

const AddStudent = ({ className }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFirstNameChange = (event) => setFirstName(event.target.value);
  const handleLastNameChange = (event) => setLastName(event.target.value);
  const handleEmailChange = (event) => setEmail(event.target.value);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    // Prepare student data to send
    const studentData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
    };

    try {
      // Replace with your backend endpoint for adding students
      await axios.post(`/add-student/${className}`, studentData);
      // Handle successful form submission, e.g., redirect or show success message
    } catch (error) {
      console.error('Error adding student:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-2">
      <h1 className="mb-4"><i className="bi bi-person-plus-fill"></i> Add New Student</h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="first_name" className="form-label"><i className="bi bi-person"></i> First Name</label>
          <input
            type="text"
            name="first_name"
            id="first_name"
            className="form-control"
            required
            value={firstName}
            onChange={handleFirstNameChange}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="last_name" className="form-label"><i className="bi bi-person"></i> Last Name</label>
          <input
            type="text"
            name="last_name"
            id="last_name"
            className="form-control"
            required
            value={lastName}
            onChange={handleLastNameChange}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label"><i className="bi bi-envelope"></i> Email</label>
          <input
            type="email"
            name="email"
            id="email"
            className="form-control"
            required
            value={email}
            onChange={handleEmailChange}
          />
        </div>
        <div className="d-flex justify-content-start gap-2">
          <button type="submit" className="btn btn-dark" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
            ) : (
              <i className="bi bi-plus-circle"></i>
            )}
            <span>{isSubmitting ? 'Adding...' : 'Add Student'}</span>
          </button>
          <a href={`/manage-students/${className}`} className="btn btn-secondary">
            <i className="bi bi-arrow-left"></i> Back to Manage Students
          </a>
        </div>
      </form>
    </div>
  );
};

export default AddStudent;
