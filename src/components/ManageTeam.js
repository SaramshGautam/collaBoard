import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { doc, deleteDoc } from 'firebase/firestore';
import { useFlashMessage } from '../FlashMessageContext';  // Import the Flash Message context
import axios from 'axios';

const ManageTeams = () => {
  const { className, projectName } = useParams();
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState('');
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Modal state
  const [teamToDelete, setTeamToDelete] = useState(null); // Store the team to be deleted
  const addMessage = useFlashMessage();  // Get the function to add flash messages


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
          students: Object.entries(doc.data()).map(([email, _]) => {
            const student = studentsList.find(student => student.email === email);
            return {
              email,
              name: student ? student.name : email, 
            };
          }),
        }));        
  
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
    if (!teamName) return;
    
    // Check for duplicate team name (case-insensitive)
    if (teams.some(team => team.teamName.toLowerCase() === teamName.toLowerCase())) {
      addMessage('error', `A team with the name '${teamName}' already exists. Please choose a different name.`);
      return;
    }
    
    // If no duplicate exists, create the team
    setTeams([...teams, { teamName, students: [] }]);
    setTeamName('');
    addMessage('success', `Team '${teamName}' created successfully!`);
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
          addMessage("success", data.message);
        }
      })
      .catch(error => addMessage("error", "An error occurred while saving teams.") );
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
      // Add the student to the selected team
      const updatedTeams = teams.map(team => {
        if (team.teamName === teamName) {
          if (!team.students.some(student => student.email === email)) {
            return { ...team, students: [...team.students, { email, name }] };
          }
        }
        return team;
      });
  
      // Remove the student from the unassigned list
      const updatedStudents = students.filter(student => student.email !== email);
  
      setStudents(updatedStudents);
      setTeams(updatedTeams);
    }
  };

  const handleDeleteTeam = async (teamName) => {
    // Find the team that is being deleted
    const teamToDelete = teams.find(team => team.teamName === teamName);
    const studentsInDeletedTeam = teamToDelete ? teamToDelete.students : [];
  
    // Remove the deleted team from the teams list in state
    const updatedTeams = teams.filter(team => team.teamName !== teamName);
    setTeams(updatedTeams);
  
    // Add the students from the deleted team back to the unassigned list
    const updatedStudents = [...students, ...studentsInDeletedTeam];
    setStudents(updatedStudents);
  
    // Also delete the team from the Firebase database
    const db = getFirestore();
    const teamRef = doc(db, 'classrooms', className, 'Projects', projectName, 'teams', teamName);
  
    try {
      await deleteDoc(teamRef);
      addMessage("success", `Team "${teamName}" deleted successfully!`); 
    } catch (error) {
      console.error("Error deleting team:", error);
      addMessage("error", "Error deleting team.")
    }
  };
   
  const confirmDeleteTeam = async () => {
    try {
      // Call handleDeleteTeam and pass the teamToDelete value
      await handleDeleteTeam(teamToDelete);
  
      // Close the modal
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error confirming delete:", error);
      addMessage("error", "An error occurred while deleting the team.");
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
  
  const cancelDelete = () => {
    setShowDeleteModal(false); // Close the modal if the action is cancelled
  };

  return (
    <div className="manage-teams-wrapper">
      <h1><i className="bi bi-people-fill"></i> Manage Teams</h1>
      <div className="mt-3 d-flex justify-content-between">
        <div className="d-flex">
          <input
            type="text"
            id="team_name"
            className="form-input"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter Team Name"
          />
          <button className="action-btn" onClick={handleCreateTeam}>
            <i className="bi bi-plus-circle"></i> Create Team
          </button>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
{showDeleteModal && (
  <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Confirm Deletion</h5>
          <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete the team <strong>{teamToDelete}</strong>? This action cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={confirmDeleteTeam}>
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  </div>
)}

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
                  {student.name}
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
              <h4 className="team-header">
                {team.teamName}
                <button
                className="btn btn-danger btn-sm ml-2"
                onClick={() => {
                  setTeamToDelete(team.teamName);  // Set the team to delete
                  setShowDeleteModal(true);  // Show the modal
                }}
              >
                Delete Team
              </button>

              </h4>
              <ul className="manage-student-list">
                {team.students.length === 0 ? (
                  <li className="manage-no-students">No students assigned</li>
                ) : (
                  team.students.map((student) => (
                    <li key={student.email} className="manage-student-item">
                   {student.name}

                    <button onClick={() => handleRemoveStudent(student.email, team.teamName)}>
                      <i className="bi bi-x-circle"></i>
                    </button>
                  </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
        <div className="d-flex justify-content-start">
        <button type="button" className="btn action-btn" onClick={handleSaveChanges} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm"></span> Saving...
            </>
          ) : (
            <>
              <i className="bi bi-save"></i> Save Changes
            </>
          )}
        </button>
          <button
            type="button"
            className="btn back-btn" 
            onClick={() => navigate(`/classroom/${className}/project/${projectName}`)}
          >
            <i className="bi bi-arrow-left"></i> Back to Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageTeams;