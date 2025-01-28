import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

const Project = () => {
  const { className, projectName } = useParams();
  const [projectDetails, setProjectDetails] = useState({});
  const [teams, setTeams] = useState([]);
  const [studentTeamAssigned, setStudentTeamAssigned] = useState(null);
  const [role, setRole] = useState(localStorage.getItem('role')); // Role from local storage
  const [LSUID, setLSUID] = useState(localStorage.getItem('LSUID')); // LSUID from local storage
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjectDetails = async () => {
      console.log('Fetching project details and teams...');
      try {
        const db = getFirestore();
   
        // Fetch project details
        const projectRef = doc(db, 'classrooms', className, 'Projects', projectName);
        const projectDoc = await getDoc(projectRef);
        console.log('Project document:', projectDoc);
   
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          const dueDate = projectData.dueDate
            ? (projectData.dueDate.toDate
                ? projectData.dueDate.toDate().toLocaleDateString()
                : new Date(projectData.dueDate).toLocaleDateString())
            : 'No due date set.';
          setProjectDetails({
            description: projectData.description || 'No description provided.',
            dueDate,
          });
          console.log('Project details fetched:', projectData);
        }
   
        // Fetch teams
        const teamsRef = collection(db, 'classrooms', className, 'Projects', projectName, 'teams');
        const teamsSnapshot = await getDocs(teamsRef);
        console.log('Teams snapshot:', teamsSnapshot);
   
        const teamsData = [];
        teamsSnapshot.forEach((teamDoc) => {
          const teamMembers = Object.keys(teamDoc.data());
          teamsData.push({
            name: teamDoc.id,
            members: teamMembers, // Storing LSUIDs as members
          });
        });
   
        setTeams(teamsData);
        console.log('Teams data:', teamsData);
   
        // Check student team assignment
        if (role === 'student') {
          const studentLSUID = localStorage.getItem('LSUID');  // Get LSUID from localStorage
          console.log('Student LSUID:', studentLSUID);
   
          // Modify the logic to check LSUID instead of name or email
          const assignedTeam = teamsData.find((team) =>
            team.members.includes(studentLSUID)  // Check if LSUID exists in the team's member list
          );
   
          setStudentTeamAssigned(assignedTeam ? assignedTeam.name : null);
          console.log('Assigned team for student:', assignedTeam ? assignedTeam.name : 'None');
        }
      } catch (error) {
        console.error('Error fetching project details or teams:', error);
      }
    };
   
    fetchProjectDetails();
  }, [className, projectName, role]);
  

  const handleWhiteboardClick = (teamName) => {
    console.log(`Navigating to whiteboard for team: ${teamName}`);
    navigate(`/whiteboard/${className}/${projectName}/${teamName}`);
  };

  const handleManageTeams = () => {
    console.log('Navigating to manage teams page...');
    navigate(`/classroom/${className}/project/${projectName}/manage-teams`);
  };

  const handleEditProjectClick = () => {
    console.log('Navigating to edit project page...');
    navigate(`/classroom/${className}/project/${projectName}/edit`, {
      state: { projectDetails }  // Passing the fetched project details here
    });
  };

  return (
    <div className="container project-container mt-2 pt-2">
      <h1 className="project-title">Project: {projectName}</h1>
      <p><strong>Description:</strong> {projectDetails.description}</p>
      <p><strong>Due Date:</strong> {projectDetails.dueDate}</p>

      {/* Edit Project Button for Teacher */}
      {role === 'teacher' && (
        <button
          className="btn btn-dark mt-3 me-3"  // 'me-3' adds margin to the right of the button
          onClick={handleEditProjectClick}
        >
          <i className="bi bi-pencil-fill me-2"></i> Edit Project
        </button>
      )}

      {/* Manage Teams Button for Teacher */}
      {role === 'teacher' && (
        <button
          className="btn btn-dark mt-3"
          onClick={handleManageTeams}
        >
          <i className="bi bi-people me-2"></i> Manage Teams
        </button>
      )}

      <h2 className="teams-header mt-4">List of Teams</h2>
      {teams.length > 0 ? (
        <ul className="list-group teams-list">
          {role === 'student' ? (
            // If the user is a student, show only their assigned team
            studentTeamAssigned ? (
              <li key={studentTeamAssigned} className="list-group-item team-item">
                <span className="team-name text-dark">
                  <i className="bi bi-people-fill"></i> {studentTeamAssigned} {/* Team name as plain text */}
                </span>
                <Link to={`/classroom/${className}/project/${projectName}/team/${studentTeamAssigned}`} className="team-link text-dark ms-2">
                  View Team {/* "View Team" as a clickable link */}
                </Link>
                <button
                  className="btn btn-dark btn-sm ms-3"
                  onClick={() => handleWhiteboardClick(studentTeamAssigned)}
                >
                  <i className="bi bi-tv"></i> Open Whiteboard
                </button>
              </li>
            ) : (
              <p className="no-team-message">You are not assigned to any team.</p>
            )
          ) : (
            // If the user is a teacher, show the list of all teams
            teams.map((team) => (
              <li key={team.name} className="list-group-item team-item">
                <span className="team-name text-dark">
                  <i className="bi bi-people-fill"></i> {team.name} {/* Team name as plain text */}
                </span>
                <Link to={`/classroom/${className}/project/${projectName}/team/${team.name}`} className="team-link text-dark ms-2">
                  View Team {/* "View Team" as a clickable link */}
                </Link>
                <button
                  className="btn btn-dark btn-sm ms-3"
                  onClick={() => handleWhiteboardClick(team.name)}
                >
                  <i className="bi bi-tv"></i> Open Whiteboard
                </button>
              </li>
            ))
          )}
        </ul>
      ) : (
        <p className="no-teams-message">No teams available.</p>
      )}

      <Link to={`/classroom/${className}`} className="btn btn-dark mt-3">
        <i className="bi bi-arrow-left me-2"></i> Back to Classroom
      </Link>
    </div>
  );
};

export default Project;
