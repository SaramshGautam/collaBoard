import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useFlashMessage } from '../FlashMessageContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Firebase configuration


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const addMessage = useFlashMessage();

  useEffect(() => {
    document.body.classList.add('login-page');
    return () => {
      document.body.classList.remove('login-page');
    };
  }, []);

  // Google Login
  const googleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      handleUserLogin(user.email, user.displayName);
    } catch (error) {
      console.error('Google login failed:', error);
      addMessage("danger", "Google login failed. Please try again.");
    }
  };

  // Email & Password Login
  const emailPasswordLogin = async () => {
    if (!email || !password) {
      console.log("Missing email or password");
      addMessage("danger", "Please enter both email and password.");
      return;
    }

    try {
      console.log("Attempting login for:", email);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful:", userCredential);

      const user = userCredential.user;
      console.log("User UID:", user.uid);

      handleUserLogin(email, user.displayName);
    } catch (error) {
      console.error("Login error:", error.code, error.message);
      addMessage("danger", "Login failed: " + error.message);
    }
  };

  // Handle user login and navigation
  const handleUserLogin = async (userEmail, userName) => {
    const userDoc = await getDoc(doc(db, "users", userEmail));
    if (!userDoc.exists()) {
      addMessage("danger", "User not found in the database.");
      return;
    }

    const userData = userDoc.data();
    localStorage.setItem('role', userData.role);
    localStorage.setItem('userEmail', userEmail);
    if (userData.lsuID) {
      localStorage.setItem('LSUID', userData.lsuID);
    }

    addMessage("success", `Welcome, ${userName}!`);
    navigate(userData.role === 'teacher' ? '/teachers-home' : '/students-home');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="title">Creative Assistant</h2>

        {/* Email and Password Login 
        <input
          type="email"
          placeholder="Email"
          className="form-control mb-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="form-control mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="login-button" onClick={emailPasswordLogin}>
          Login with Email
        </button>

        <div className="text-center mt-3">OR</div> */}

        {/* Google Login Button */}
        <button className="googlebutton" onClick={googleLogin}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 262">
            <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
            <path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
            <path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"></path>
            <path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
          </svg>
          Login with Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
