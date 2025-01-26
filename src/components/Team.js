import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

const Team = () => {
  const { className, projectName, teamName } = useParams();
  const [teamDetails, setTeamDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [role, setRole] = useState(localStorage.getItem('role')); // Role from local storage
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        setLoading(true); // Start loading
        const db = getFirestore();
        const decodedClassName = decodeURIComponent(className);
        const decodedProjectName = decodeURIComponent(projectName);
        const decodedTeamName = decodeURIComponent(teamName);

        const teamRef = doc(
          db,
          'classrooms',
          decodedClassName,
          'Projects',
          decodedProjectName,
          'teams',
          decodedTeamName
        );

        const teamSnapshot = await getDoc(teamRef);

        if (teamSnapshot.exists()) {
          setTeamDetails(teamSnapshot.data());
        } else {
          setError(`No team found with the name "${decodedTeamName}"`);
        }
      } catch (err) {
        setError("An error occurred while fetching team details.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchTeamDetails();
  }, [className, projectName, teamName]);

  const handleWhiteboardClick = () => {
    navigate(`/whiteboard/${className}/${projectName}/${teamName}`);
  };

  return (
    <div className="container mt-2 pt-2">
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : teamDetails ? (
        <>
          <h1 className="dashboard-title mb-4">
            <i className="bi bi-person-workspace"></i> Team: {teamName}
          </h1>
          <h3 className="section-title mb-3">Project: {projectName}</h3>
          <h4 className="section-title mb-3">Class: {className}</h4>

          <div className="team-members mb-4">
            <h5 className="mb-3">Team Members</h5>
            <ul className="list-group">
              {Object.entries(teamDetails).map(([email, student]) => (
                <li key={email} className="list-group-item">
                  <strong>{student.name}</strong> ({student.email})
                </li>
              ))}
            </ul>
          </div>

          {/* Whiteboard Button */}
          <div className="action-buttons mb-4">
            <button
              onClick={handleWhiteboardClick}
              className="btn btn-primary"
            >
              <i className="bi bi-file-earmark-white"></i> Open Whiteboard
            </button>
          </div>

          <div className="action-buttons mb-4">
            <button onClick={() => navigate(`/classroom/${className}`)} className="btn btn-dark">
              <i className="bi bi-arrow-left-circle"></i> Back to Classroom
            </button>
          </div>
        </>
      ) : (
        <p>No team data available.</p>
      )}
    </div>
  );
};

export default Team;
