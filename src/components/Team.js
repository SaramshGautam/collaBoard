import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

import { getAuth } from 'firebase/auth';

const Team = () => {
  const { className, projectName, teamName } = useParams();
  const [teamMembers, setTeamMembers] = useState([]);
  const [lastAccessTimes, setLastAccessTimes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    console.log("Class Name:", className);
    console.log("Project Name:", projectName);
    console.log("Team Name:", teamName);
  
    const fetchUserRole = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserRole(userSnap.data().role);
        }
      }
    };
  
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        const decodedClassName = decodeURIComponent(className);
        const decodedProjectName = decodeURIComponent(projectName);
        const decodedTeamName = decodeURIComponent(teamName);
  
        console.log("Decoded Class Name:", decodedClassName);
        console.log("Decoded Project Name:", decodedProjectName);
        console.log("Decoded Team Name:", decodedTeamName);
  
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
          const lastAccessData = {};
          const teamData = teamSnapshot.data();
  
          for (const [email, userData] of Object.entries(teamData)) {
            if (userData && userData.name) {
              members.push({
                name: userData.name,
                email: email,
              });
              if (userData.lastAccessed) {
                lastAccessData[email] = userData.lastAccessed;
              }
            }
          }
          setTeamMembers(members);
          setLastAccessTimes(lastAccessData);
        } else {
          setError(`No members found in team "${decodedTeamName}"`);
        }
      } catch (err) {
        setError("An error occurred while fetching team details.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserRole();
    fetchTeamMembers();
  }, [className, projectName, teamName]);
  

  const handleWhiteboardClick = async () => {
    if (userRole === 'student' && auth.currentUser) {
      const studentEmail = auth.currentUser.email;
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

      try {
        // Fetch team document to get the student's email key
        const teamSnapshot = await getDoc(teamRef);
        if (teamSnapshot.exists()) {
          let teamData = teamSnapshot.data();

          if (teamData.hasOwnProperty(studentEmail)) {
            await setDoc(teamRef, {
              [studentEmail]: {
                ...teamData[studentEmail],
                lastAccessed: new Date().toISOString(),
              },
            }, { merge: true });
          } else {
            console.error("Student email not found in team data");
          }
        }
      } catch (error) {
        console.error("Error updating last accessed time:", error);
      }
    }
    navigate(`/whiteboard/${className}/${projectName}/${teamName}`);
  };

  return (
  <div className="team-page">
    {loading ? (
      <p>Loading...</p>
    ) : error ? (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    ) : (
      <>
        <h1 className="project-title">Project: {projectName}</h1>
        <p><strong>Team: {teamName}</strong></p>

        <section className="team-members-card mb-4">
          {teamMembers.length > 0 ? (
            <ul className="member-list">
              <li className="member-item">
                <div className="member-row">
                  <span className="member-title">Team Members</span>
                  {/* Render the Last Accessed column only for teachers */}
                  {userRole !== 'student' && <span className="last-access-header">Last Accessed</span>}
                </div>
              </li>
              {teamMembers.map((member, idx) => (
                <li key={idx} className="member-item">
                  <div className="member-row">
                    <span className="member-name">{member.name}</span>
                    {/* Conditionally render last access time only if not a student */}
                    {userRole !== 'student' && (
                      <span className="last-access-time">
                        {lastAccessTimes[member.email]
                          ? new Date(lastAccessTimes[member.email]).toLocaleString()
                          : '-'}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No members in this team.</p>
          )}
        </section>

        <section className="action-buttons mb-4">
          <button onClick={handleWhiteboardClick} className="btn action-btn">
            <i className="bi bi-tv"></i> Open Whiteboard
          </button>
        </section>

        <section className="action-buttons mb-4">
          <button
            type="button"
            className="btn back-btn"
            onClick={() => navigate(`/classroom/${className}/project/${projectName}`)}
          >
            <i className="bi bi-arrow-left me-2"></i> Back to Project
          </button>
        </section>
      </>
    )}
  </div>
);

};

export default Team;
