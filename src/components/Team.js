import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const Team = () => {
  const { className, projectName, teamName } = useParams();
  const [teamMembers, setTeamMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const db = getFirestore();
        const teamRef = doc(db, 'classrooms', className, 'Projects', projectName, 'teams', teamName);
        const teamDoc = await getDoc(teamRef);

        if (teamDoc.exists()) {
          setTeamMembers(Object.values(teamDoc.data())); // Extract member names
        } else {
          console.log('No such team exists!');
          setTeamMembers([]);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
        setTeamMembers([]);
      }
    };

    fetchTeamMembers();
  }, [className, projectName, teamName]);

  const handleWhiteboardClick = () => {
    navigate(`/whiteboard/${className}/${projectName}/${teamName}`);
  };

  return (
    <div className="container team-container mt-2 pt-2">
      <h1>Team: {teamName}</h1>
      <h2>Members:</h2>
      {teamMembers.length > 0 ? (
        <ul className="list-group">
          {teamMembers.map((member, index) => (
            <li key={index} className="list-group-item">{member}</li>
          ))}
        </ul>
      ) : (
        <p>No members found for this team.</p>
      )}

      {/* Whiteboard Button */}
      <button className="btn btn-primary mt-3" onClick={handleWhiteboardClick}>
        <i className="bi bi-pencil-square me-2"></i> Whiteboard
      </button>

      {/* Back to Project Button */}
      <Link to={`/classroom/${className}/project/${projectName}`} className="btn btn-secondary back-btn mt-4">
        <i className="bi bi-arrow-left me-2"></i> Back to Project
      </Link>
    </div>
  );
};

export default Team;
