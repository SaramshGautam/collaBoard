import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const ManageTeams = () => {
  const { className, projectName } = useParams();
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState('');
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchTeamsAndStudents = async () => {
      try {
        const db = getFirestore();
  
        // Fetch students
        const studentsRef = collection(db, 'classrooms', className, 'students');
        const studentsSnapshot = await getDocs(studentsRef);
        const studentsList = studentsSnapshot.docs.map(doc => ({
          email: doc.id,
          name: `${doc.data()?.firstName || ''} ${doc.data()?.lastName || ''}`.trim() || doc.id,
        }));
        console.log('Fetched students:', studentsList);
  
        // Fetch teams
        const teamsRef = collection(db, 'classrooms', className, 'Projects', projectName, 'teams');
        const teamsSnapshot = await getDocs(teamsRef);
        const teamsList = teamsSnapshot.docs.map(doc => ({
          teamName: doc.id,
          students: Object.entries(doc.data()).map(([email, name]) => ({
            email,
            name: typeof name === 'string' ? name : email, // Ensure name is a string
          })),
        }));
        console.log('Fetched teams:', teamsList);
  
        // Get a list of all assigned students by email
        const assignedEmails = teamsList.flatMap(team => team.students.map(student => student.email));
  
        // Filter unassigned students
        const unassignedStudents = studentsList.filter(student => !assignedEmails.includes(student.email));
  
        setStudents(unassignedStudents);
        setTeams(teamsList);
      } catch (error) {
        console.error('Error fetching teams or students:', error);
      }
    };
  
    fetchTeamsAndStudents();
  }, [className, projectName]);  

  const handleCreateTeam = () => {
    if (teamName && !teams.some(team => team.teamName === teamName)) {
      setTeams([...teams, { teamName, students: [] }]);
      setTeamName('');
    }
  };

  const handleSaveChanges = () => {
    const teamsData = teams.map(team => ({
      teamName: team.teamName,
      students: team.students.map(student => student.email),
    }));

    fetch('http://localhost:5000/save-teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teams: teamsData,
        class_name: className,
        project_name: projectName,
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
        } else {
          alert(data.message);
        }
      })
      .catch(error => alert('An error occurred while saving teams.'));
  };

  const handleDragStart = (event, student) => {
    event.dataTransfer.setData('email', student.email);
    event.dataTransfer.setData('name', student.name);
  };

  const handleDrop = (event, teamName) => {
    event.preventDefault();
    const email = event.dataTransfer.getData('email');
    const name = event.dataTransfer.getData('name');
  
    if (email && name) {
      const updatedTeams = teams.map(team => {
        if (team.teamName === teamName) {
          if (!team.students.some(student => student.email === email)) {
            return { ...team, students: [...team.students, { email, name }] };
          }
        }
        return team;
      });
      setTeams(updatedTeams);
    }
  };
  

  const handleRemoveStudent = (email, teamName) => {
    const updatedTeams = teams.map(team => {
      if (team.teamName === teamName) {
        return {
          ...team,
          students: team.students.filter(student => student.email !== email),
        };
      }
      return team;
    });

    const studentToRemove = teams
      .flatMap(team => team.students)
      .find(student => student.email === email);
  
    if (studentToRemove) {
      setStudents(prevStudents => {
        if (!prevStudents.some(student => student.email === email)) {
          return [...prevStudents, studentToRemove];
        }
        return prevStudents;
      });
    }
  
    setTeams(updatedTeams);
  };

  return (
    <div className="manage-teams-wrapper">
      <h1><i className="bi bi-people-fill"></i> Manage Teams</h1>

      <div className="mt-3">
        <input
          type="text"
          id="team_name"
          className="form-input"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Enter Team Name"
        />
        <button className="btn btn-dark" onClick={handleCreateTeam}>
          <i className="bi bi-plus-circle"></i> Create Team
        </button>
      </div>

      <div className="manage-teams-container">
        <div className="manage-unassigned-students">
          <h4>Unassigned Students</h4>
          <ul className="manage-student-list">
            {students.length === 0 ? (
              <li className="manage-no-students">All students assigned</li>
            ) : (
              students.map((student) => (
                <li
                  key={student.email}
                  className="manage-student-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, student)}
                >
                  {student.name ? student.name : student.email}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="manage-teams-list">
          {teams.map((team) => (
            <div
              key={team.teamName}
              className="manage-team-list"
              onDrop={(e) => handleDrop(e, team.teamName)}
              onDragOver={(e) => e.preventDefault()}
            >
              <h4>{team.teamName}</h4>
              <ul className="manage-student-list">
                {team.students.length === 0 ? (
                  <li className="manage-no-students">No students assigned</li>
                ) : (
                  team.students.map((student) => (
                    <li key={student.email} className="manage-student-item">
                      {student.name ? student.name : student.email}
                      <button
                        className="btn btn-danger btn-sm ml-2"
                        onClick={() => handleRemoveStudent(student.email, team.teamName)}
                      >
                        Remove
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-dark" onClick={handleSaveChanges}>
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
  );
};

export default ManageTeams;
