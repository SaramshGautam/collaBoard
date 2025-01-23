import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCs-xerrIr0KpnCTihTX-GowGDAZbRZFvA",
  authDomain: "creative-assistant-j.firebaseapp.com",
  databaseURL: "https://creative-assistant-j-default-rtdb.firebaseio.com",
  projectId: "creative-assistant-j",
  storageBucket: "creative-assistant-j.firebasestorage.app",
  messagingSenderId: "414003942125",
  appId: "1:414003942125:web:d1400f5fa9358683f832e4",
  measurementId: "G-NJWKCE24C4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

const LoginPage = () => {
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const googleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userEmail = user.email;

      // Fetch role from Firebase Firestore
      const userDoc = await getDoc(doc(db, "users", userEmail));
      if (!userDoc.exists()) {
        setMessage('User not found in the database.');
        return;
      }

      const role = userDoc.data().role;

      // Store the role in localStorage
      localStorage.setItem('role', role);

      // Redirect based on role
      if (role === 'teacher') {
        navigate('/teachers-home');
      } else if (role === 'student') {
        navigate('/students-home');
      } else {
        setMessage('Role not assigned. Please contact support.');
      }
    } catch (error) {
      console.error('Google login failed:', error);
      setMessage('Google login failed. Please try again.');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: '#f0f0f0' }}>
      <div className="login-container p-4 bg-white rounded shadow">
        <h2 className="text-center mb-4">Creative Assistant</h2>

        {/* Flash Messages */}
        {message && (
          <div className={`alert ${message.includes('failed') ? 'alert-danger' : 'alert-info'}`} role="alert">
            <strong>{message}</strong>
          </div>
        )}

        {/* Google Login Button */}
        <button className="btn btn-google d-flex align-items-center justify-content-center" onClick={googleLogin}>
          <i className="bi bi-google me-2"></i> Login with Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
