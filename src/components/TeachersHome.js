import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const TeacherHome = () => {
  const [classrooms, setClassrooms] = useState({ groupedClassrooms: {}, sortedSemesters: [] });
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);
  const [teacherNames, setTeacherNames] = useState({});
  const [flashMessage, setFlashMessage] = useState("");
  const [flashMessageType, setFlashMessageType] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
        setClassrooms({ groupedClassrooms: {}, sortedSemesters: [] });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const sortSemesters = (semesters) => {
    const semesterOrder = {
      "Fall": 1,
      "Summer": 2,
      "Spring": 3,
    };

    return semesters.sort((a, b) => {
      const yearA = parseInt(a.split(" ")[1]);
      const yearB = parseInt(b.split(" ")[1]);
      const semesterA = a.split(" ")[0];
      const semesterB = b.split(" ")[0];

      if (yearA !== yearB) {
        return yearB - yearA;  
      }
      return semesterOrder[semesterA] - semesterOrder[semesterB];
    });
  };

  useEffect(() => {
    const fetchClassrooms = async () => {
      if (!userEmail) return;
      try {
        setLoading(true);
        const db = getFirestore();
        const classroomsRef = collection(db, 'classrooms');
        const querySnapshot = await getDocs(classroomsRef);
        const teacherClassrooms = querySnapshot.docs
          .filter((doc) => doc.data().teacherEmail === userEmail)
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

        const groupedClassrooms = teacherClassrooms.reduce((acc, classroom) => {
          const { semester } = classroom;
          if (!acc[semester]) {
            acc[semester] = [];
          }
          acc[semester].push(classroom);
          return acc;
        }, {});

        const sortedSemesters = sortSemesters(Object.keys(groupedClassrooms));

        setClassrooms({ groupedClassrooms, sortedSemesters });

        const teacherNamesObj = {};
        for (const classroom of teacherClassrooms) {
          const teacherDoc = await getDoc(doc(db, 'users', classroom.teacherEmail));
          if (teacherDoc.exists()) {
            teacherNamesObj[classroom.teacherEmail] = teacherDoc.data().name;
          }
        }
        setTeacherNames(teacherNamesObj);
      } catch (error) {
        console.error("Error fetching classrooms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClassrooms();
  }, [userEmail]);

  useEffect(() => {
    const message = localStorage.getItem("flashMessage");
    const messageType = localStorage.getItem("flashMessageType");
    if (message) {
      setFlashMessage(message);
      setFlashMessageType(messageType);
      setShowAlert(true);
      localStorage.removeItem("flashMessage");
      localStorage.removeItem("flashMessageType");
      setTimeout(() => setShowAlert(false), 4000);
    }
  }, []);

  return (
    <div className="teacher-dashboard mt-4">
      {loading ? (
        <p>Loading...</p>
      ) : userEmail ? (
        <>
          <h1 className="dashboard-title center-title mb-4">
            <i className="bi bi-person-workspace"></i> Teacher's Dashboard
          </h1>

          {showAlert && (
            <div className={`alert-wrapper ${flashMessage ? 'fade-in' : 'fade-out'}`}>
              <div className={`alert ${flashMessageType === 'error' ? 'error' : ''}`}>
                {flashMessage}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAlert(false)}
                >
                  &times;
                </button>
              </div>
            </div>
          )}

          <div className="classrooms-list">
            {classrooms.sortedSemesters.length > 0 ? (
              classrooms.sortedSemesters.map((semester, semesterIndex) => (
                <div key={semester} className="semester-section">
                  <h4 className={semester === "Fall 2025" ? "fall-2025" : ""}>{semester}</h4>
                  <div className="row">
                    {classrooms.groupedClassrooms[semester].map((classroom) => (
                      <div key={classroom.id} className="col-md-4 mb-2">
                        <div
                          className="classroom-card"
                          onClick={() => navigate(`/classroom/${classroom.courseID}`)}
                        >
                          <div className="card-body">
                            <h5 className="card-title">
                              {classroom.courseID} - {classroom.class_name}
                            </h5>
                            <p className="card-text">
                              Instructor: {teacherNames[classroom.teacherEmail] || 'Loading...'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Add Classroom Card at the end of the first semester */}
                    {semesterIndex === 0 && (
                      <div className="col-md-4 mb-2">
                        <div
                          className="classroom-card"
                          onClick={() => navigate('/add-classroom')}
                        >
                          <div className="card-body d-flex align-items-center justify-content-center">
                            <h5 className="card-title text-center" style={{ fontWeight: 'normal' }}>
                              <i className="bi bi-plus-circle"></i> Add Classroom
                            </h5>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              // When no classrooms exist, show only the Add Classroom card
              <div className="row">
                <div className="col-md-4 mb-2">
                  <div
                    className="classroom-card"
                    onClick={() => navigate('/add-classroom')}
                  >
                    <div className="card-body d-flex align-items-center justify-content-center">
                      <h5 className="card-title text-center" style={{ fontWeight: 'normal' }}>
                        <i className="bi bi-plus-circle"></i> Add Classroom
                      </h5>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <p>No user logged in. Please sign in to continue.</p>
      )}
    </div>
  );
};

export default TeacherHome;
