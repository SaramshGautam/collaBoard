import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const StudentDashboard = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
        setClassrooms([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchClassrooms = async () => {
      if (!userEmail) return;

      try {
        setLoading(true);
        const db = getFirestore();
        const classroomsRef = collection(db, 'classrooms');
        const querySnapshot = await getDocs(classroomsRef);

        const studentClassrooms = [];
        for (const docSnapshot of querySnapshot.docs) {
          const classroom = docSnapshot.data();
          const studentsRef = collection(db, `classrooms/${docSnapshot.id}/students`);
          const studentsSnapshot = await getDocs(studentsRef);

          // Check if the student exists in the classroom's students subcollection
          const isStudentInClassroom = studentsSnapshot.docs.some(
            (studentDoc) => studentDoc.data().email === userEmail
          );

          if (isStudentInClassroom) {
            studentClassrooms.push({
              id: docSnapshot.id,
              ...classroom,
            });
          }
        }

        setClassrooms(studentClassrooms);
      } catch (error) {
        console.error('Error fetching classrooms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, [userEmail]);

  return (
    <div className="container student-dashboard-container mt-2 pt-2">
      {loading ? (
        <p>Loading...</p>
      ) : userEmail ? (
        <>
          <h1 className="dashboard-title mb-4">
            <i className="bi bi-person-badge"></i> Student's Dashboard
          </h1>

          <div className="assigned-classrooms">
            <h3 className="assigned-classrooms-title mb-3">Assigned Classrooms</h3>
            <ul className="list-group classrooms-list">
              {classrooms.length > 0 ? (
                classrooms.map((classroom) => (
                  <li key={classroom.id} className="list-group-item">
                    <a href={`/classroom/${classroom.id}`} className="text-dark">
                    {classroom.classID}
                  </a>
                    <ul className="projects-list mt-2">
                      {classroom.projects?.map((project, index) => (
                        <li key={index} className="project-item">{project}</li>
                      ))}
                    </ul>
                  </li>
                ))
              ) : (
                <li className="list-group-item text-muted">No classrooms assigned.</li>
              )}
            </ul>
          </div>
        </>
      ) : (
        <p>No user logged in. Please sign in to continue.</p>
      )}
    </div>
  );
};

export default StudentDashboard;
