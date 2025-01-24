import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

const Project = () => {
  const { className, projectName } = useParams();
  const [projectDetails, setProjectDetails] = useState({});
  const [teams, setTeams] = useState([]);
  const [studentTeamAssigned, setStudentTeamAssigned] = useState(null);
  const [role, setRole] = useState(localStorage.getItem('role')); // Role from local storage
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const db = getFirestore();

        // Fetch project details
        const projectRef = doc(db, 'classrooms', className, 'Projects', projectName);
        const projectDoc = await getDoc(projectRef);

        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          setProjectDetails({
            description: projectData.description || 'No description provided.',
            dueDate: projectData.dueDate?.toDate().toLocaleDateString() || 'No due date set.',
          });
        } else {
          console.log('No such project exists!');
          setProjectDetails({});
        }

        // Fetch teams
        const teamsRef = collection(db, 'classrooms', className, 'Projects', projectName, 'teams');
        const teamsSnapshot = await getDocs(teamsRef);

        const teamsData = {};
        teamsSnapshot.forEach((teamDoc) => {
          teamsData[teamDoc.id] = Object.values(teamDoc.data());
        });

        setTeams(teamsData);

        // Check if the student is part of any team
        if (role === 'student') {
          Object.keys(teamsData).forEach((teamName) => {
            if (Object.keys(teamsData[teamName]).includes(localStorage.getItem('userEmail'))) {
              setStudentTeamAssigned(teamName);
            }
          });
        }
      } catch (error) {
        console.error('Error fetching project details or teams:', error);
      }
    };

    fetchProjectDetails();
  }, [className, projectName, role]);

  const handleWhiteboardClick = (teamName) => {
    navigate(`/whiteboard/${className}/${projectName}/${teamName}`);
  };

  const handleManageTeams = () => {
    navigate(`/classroom/${className}/project/${projectName}/manage-teams`);
  };

  return (
    <div className="container project-container mt-2 pt-2">
      <h1 className="project-title">Project: {projectName}</h1>
      <p><strong>Description:</strong> {projectDetails.description}</p>
      <p><strong>Due Date:</strong> {projectDetails.dueDate}</p>

      {/* Manage Teams Button for Teacher */}
      {role === 'teacher' && (
        <button
          className="btn btn-primary mb-3"
          onClick={handleManageTeams}
        >
          Manage Teams
        </button>
      )}

      <h2 className="teams-header mt-4">List of Teams</h2>
      {Object.keys(teams).length > 0 ? (
        <ul className="list-group teams-list">
          {Object.keys(teams).map((teamName) => (
            <li key={teamName} className="list-group-item team-item">
              <Link to={`/classroom/${className}/project/${projectName}/team/${teamName}`} className="team-link">
                <i className="bi bi-people-fill"></i> {teamName}
              </Link>
              <button
                className="btn btn-primary btn-sm ms-3"
                onClick={() => handleWhiteboardClick(teamName)}
              >
                Whiteboard
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-teams-message">No teams available.</p>
      )}

      <Link to={`/classroom/${className}`} className="btn btn-secondary back-btn mt-4">
        <i className="bi bi-arrow-left me-2"></i> Back to Classroom
      </Link>
    </div>
  );
};

export default Project;
