import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const Classroom = () => {
  const { className } = useParams(); // Get the class name from URL params
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [role, setRole] = useState(localStorage.getItem('role')); // Get role from localStorage
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail')); // Get role from localStorage
  const db = getFirestore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassroomData = async () => {
      try {
        // Get projects for the classroom
        const projectsRef = collection(db, 'classrooms', className, 'Projects'); // Use 'Projects' with correct case
        const querySnapshot = await getDocs(projectsRef);
        const projectsData = querySnapshot.docs.map(doc => doc.data().projectName);
    
        console.log("User Role:", role);
        console.log("User Email:", userEmail);
        console.log("Fetched Projects Data:", projectsData);
    
        setProjects(projectsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching classroom data:", error);
      }
    };
  
    fetchClassroomData();
  }, [className, db]);
  
  const handleAddProject = () => {
    navigate(`/classroom/${className}/add-project`);
  };
  
  const handleManageStudents = () => {
    navigate(`/classroom/${className}/manage-students`);
  };
  
  const handleProjectClick = (projectName) => {
    navigate(`/classroom/${className}/project/${projectName}`);
  };
  
  const handleBackToDashboard = () => {
    if (role === 'teacher') {
      navigate('/teachers-home');
    } else if (role === 'student') {
      navigate('/students-home');
    }
  };

  return (
    <div className="container mt-2 pt-2">
      <h1 className="mb-4">Classroom: <span className="text-dark">{className}</span></h1>

      {role === 'teacher' && (
        <div className="d-flex gap-3 mb-4">
          <button className="btn btn-dark" onClick={handleAddProject}>
            <i className="bi bi-folder-plus me-2"></i> Add Project
          </button>
          <button className="btn btn-dark" onClick={handleManageStudents}>
            <i className="bi bi-people me-2"></i> Manage Students
          </button>
        </div>
      )}

      <h2 className="section-title mb-3"><i className="bi bi-folder2"></i> Projects</h2>
      {loading ? (
        <p>Loading projects...</p>
      ) : (
        <ul className="list-group">
          {projects.length > 0 ? (
            projects.map((projectName, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                <button className="text-dark d-flex align-items-center" onClick={() => handleProjectClick(projectName)}>
                  <i className="bi bi-file-earmark-text me-2"></i> {projectName}
                </button>
              </li>
            ))
          ) : (
            <li className="list-group-item text-muted">No projects available.</li>
          )}
        </ul>
      )}

      <button className="btn btn-dark mt-3" onClick={handleBackToDashboard}>
        <i className="bi bi-arrow-left"></i> Back to Dashboard
      </button>
    </div>
  );
};

export default Classroom;
