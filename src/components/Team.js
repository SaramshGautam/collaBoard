import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

const Team = () => {
  const { className, projectName, teamName } = useParams();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true); // Start loading
        const db = getFirestore();
        const decodedClassName = decodeURIComponent(className);
        const decodedProjectName = decodeURIComponent(projectName);
        const decodedTeamName = decodeURIComponent(teamName);

        // Fetch the project document to confirm the project exists
        const projectRef = doc(
          db,
          'classrooms',
          decodedClassName,
          'Projects',
          decodedProjectName
        );

        const projectSnapshot = await getDoc(projectRef);

        if (projectSnapshot.exists()) {
          // Fetch the team members from the 'teams' subcollection
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
            const members = [];
            const teamData = teamSnapshot.data();
            for (const [LSUID, name] of Object.entries(teamData)) {
              members.push({
                LSUID: LSUID,
                name: name
              });
            }
            setTeamMembers(members);
          } else {
            setError(`No members found in team "${decodedTeamName}"`);
          }
        } else {
          setError(`Project "${decodedProjectName}" not found.`);
        }
      } catch (err) {
        setError('An error occurred while fetching team details.');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchTeamMembers();
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
      ) : teamMembers.length > 0 ? (
        <>
          <h1 className="dashboard-title mb-4">
            <i className="bi bi-person-workspace"></i> Team: {teamName}
          </h1>
          <h3 className="section-title mb-3">Project: {projectName}</h3>
          <h4 className="section-title mb-3">Class: {className}</h4>

          <div className="team-members mb-4">
            <h5 className="mb-3">Team Members</h5>
            <ul className="list-group">
              {teamMembers.map((student, index) => (
                <li key={index} className="list-group-item">
                  <strong>{student.name}</strong> 
                </li>
              ))}
            </ul>
          </div>

          {/* Whiteboard Button */}
          <div className="action-buttons mb-4">
            <button
              onClick={handleWhiteboardClick}
              className="btn btn-dark mb-3"
            >
              <i className="bi bi-tv"></i> Open Whiteboard
            </button>
          </div>

          <div className="action-buttons mb-4">
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => navigate(`/classroom/${className}/project/${projectName}`)}
          >
            <i className="bi bi-arrow-left me-2"></i> Back to Project
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
