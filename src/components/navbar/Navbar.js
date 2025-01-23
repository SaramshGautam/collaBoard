import React from "react";
import "./Navbar.css";
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const handleProfileClick = () => {
    // Add any functionality you need when the profile button is clicked
    console.log("Profile button clicked");
  };
  const navigate = useNavigate();
    const logout = () => {
      // Clear the role from localStorage
      localStorage.removeItem('role');
      // Redirect to login page
      navigate('/');
    };

  const role = localStorage.getItem('role'); // Get role from localStorage
  const homeRoute = role === 'teacher' ? '/teachers-home' : role === 'student' ? '/students-home' : '/';


  return (
    <div className="navbar">
      <div className="navbar-title">collaBOARD</div>
      <div className="navbar-links">
      <a 
          className="navbar-brand d-flex align-items-center" 
          href={homeRoute} // Set the "Creative Assistant" link to go to home page based on the role
        >
          <i className="bi bi-house-door-fill me-2"></i>Home
        </a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </div>
      <div className="navbar-profile" onClick={handleProfileClick}>
        <img
          src="/path/to/profile-icon.png" // Replace with your profile icon path or icon component
          alt="Profile"
          className="profile-icon"
        />
      </div>
      <div className="d-flex">
          {/* Logout button */}
          <a className="navbar-brand d-flex align-items-center" onClick={logout}>
            <i className="bi bi-box-arrow-right me-2"></i>Logout
          </a>
        </div>
    </div>
  );
};

export default Navbar;
