import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const TeacherHome = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  // Fetch user email when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
        setClassrooms([]); // Clear classrooms if user logs out
      }
      setLoading(false); // Stop loading after auth state is determined
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [auth]);

  // Fetch classrooms when userEmail changes
  useEffect(() => {
    const fetchClassrooms = async () => {
      if (!userEmail) return;

      try {
        setLoading(true); // Start loading
        const db = getFirestore();
        const classroomsRef = collection(db, 'classrooms');
        const querySnapshot = await getDocs(classroomsRef);
        const teacherClassrooms = querySnapshot.docs
          .filter((doc) => doc.data().teacherEmail === userEmail)
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        setClassrooms(teacherClassrooms);
      } catch (error) {
        console.error("Error fetching classrooms:", error);
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchClassrooms();
  }, [userEmail]);

  return (
    <div className="container teacher-dashboard mt-2 pt-2">
      {loading ? (
        <p>Loading...</p>
      ) : userEmail ? (
        <>
          <h1 className="dashboard-title mb-4">
            <i className="bi bi-person-workspace"></i> Teacher's Dashboard
          </h1>

          <div className="action-buttons mb-4">
            <a href="/add-classroom" className="btn btn-dark">
              <i className="bi bi-plus-circle"></i> Add Classroom
            </a>
          </div>

          <h3 className="section-title mb-3">Your Classrooms</h3>
          <ul className="list-group classrooms-list">
            {classrooms.length > 0 ? (
              classrooms.map((classroom) => (
                <li key={classroom.id} className="list-group-item">
                  <a href={`/classroom/${classroom.id}`} className="text-dark">
                    {classroom.classID}
                  </a>
                </li>
              ))
            ) : (
              <li className="list-group-item text-muted">
                No classrooms available.
              </li>
            )}
          </ul>
        </>
      ) : (
        <p>No user logged in. Please sign in to continue.</p>
      )}
    </div>
  );
};

export default TeacherHome;
