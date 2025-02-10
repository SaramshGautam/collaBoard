import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditStudent = () => {
    const { className, studentId } = useParams(); // Assuming studentId is part of the route
    const navigate = useNavigate();

    const [student, setStudent] = useState({
        firstName: '',
        lastName: '',
        email: '',
        lsuId: '', // Initialize lsuId with an empty string
    });

    // Function to sanitize the email ID properly
    const sanitizeEmail = (email) => {
        return email
            .replace('@', '_at_')
            .replace(/\./g, '_dot_'); // Replace all periods with _dot_
    };

    useEffect(() => {
        const sanitizedStudentId = sanitizeEmail(studentId); // Use updated sanitization

        const fetchStudentData = async () => {
            try {
                console.log(`Fetching data for sanitized student ID: ${sanitizedStudentId}`);
                const response = await axios.get(
                    `http://localhost:5000/api/classroom/${className}/edit_student/${sanitizedStudentId}`
                );
                setStudent(response.data.student);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.error('Student not found.');
                } else if (error.response && error.response.status === 400) {
                    console.error('Invalid email format.');
                } else {
                    console.error('Unexpected error fetching student data:', error);
                }
            }
        };

        fetchStudentData();
    }, [className, studentId]); // Add className and studentId to the dependency array

    const handleChange = (e) => {
        const { name, value } = e.target;
        setStudent((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const sanitizedStudentId = sanitizeEmail(studentId); // Sanitize before sending

        try {
            // Use PUT instead of POST for updating
            await axios.put(
                `http://localhost:5000/api/classroom/${className}/edit_student/${sanitizedStudentId}`,
                student
            );
            navigate(`/classroom/${className}/manage-students`);
        } catch (error) {
            console.error('Error updating student data:', error);
        }
    };

    return (
        <div className="container form-container mt-4">
            <h1 className="form-title fw-bold mb-4 fs-4">
                Edit Student: {student.firstName} {student.lastName}
            </h1>

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="first_name" className="form-label">
                        <i className="bi bi-person-fill"></i> First Name:
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
                        <i className="bi bi-person-fill"></i> Last Name:
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
                <div className="mb-3">
                    <label htmlFor="lsuId" className="form-label">
                        <i className="bi bi-card-list"></i> LSU ID:
                    </label>
                    <input
                        type="text"
                        name="lsuId"
                        id="lsuId"
                        className="form-control"
                        value={student.lsuId || ''} // Add fallback to empty string
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="d-flex justify-content-start gap-3 mt-4">
                    <button type="submit" className="btn form-btn">
                        <i className="bi bi-check-circle"></i> Save Changes
                    </button>
                    <button
                        type="button"
                        className="btn cancel-btn"
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
