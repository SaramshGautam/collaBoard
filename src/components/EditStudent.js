import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EditStudent = () => {
    const { className, studentId } = useParams(); // Assuming studentId is part of the route
    const navigate = useNavigate();

    // Initial student data (replace this with data fetched from an API or context)
    const [student, setStudent] = useState({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setStudent((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Add your update logic here (e.g., API call)
        console.log("Updated student data:", student);

        // Redirect back to the Manage Students page
        navigate(`/classroom/${className}/manage-students`);
    };

    return (
        <div className="container mt-2">
            <h1><i className="bi bi-pencil-fill"></i> Edit Student: {student.firstName} {student.lastName}</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="first_name" className="form-label">
                        <i className="bi bi-person"></i> First Name:
                    </label>
                    <input
                        type="text"
                        name="firstName"
                        id="first_name"
                        className="form-control"
                        value={student.firstName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="last_name" className="form-label">
                        <i className="bi bi-person"></i> Last Name:
                    </label>
                    <input
                        type="text"
                        name="lastName"
                        id="last_name"
                        className="form-control"
                        value={student.lastName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                        <i className="bi bi-envelope"></i> Email:
                    </label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        className="form-control"
                        value={student.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="d-flex justify-content-start gap-2">
                    <button type="submit" className="btn btn-dark">
                        <i className="bi bi-check-circle"></i> Save Changes
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate(`/classroom/${className}/manage-students`)}
                    >
                        <i className="bi bi-arrow-left"></i> Back to Manage Students
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditStudent;
