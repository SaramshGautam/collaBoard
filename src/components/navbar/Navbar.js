import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const role = localStorage.getItem('role'); // Get role from localStorage
  const homeRoute = role === 'teacher' ? '/teachers-home' : role === 'student' ? '/students-home' : '/';

  const handleProfileClick = () => {
    setIsProfileOpen((prev) => !prev); // Toggle profile dropdown visibility
  };

  const handleLogout = () => {
    localStorage.removeItem('role');
    navigate('/'); // Redirect to login page
  };

  // Close profile dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest('.navbar') === null) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="navbar">
      <div className="navbar-left">
        {/* Logo and links */}
        <div className="navbar-title" onClick={() => navigate(homeRoute)}>collaBOARD</div>
        <div className="navbar-links">
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>
      </div>
      <div className="navbar-right">
        {/* Profile icon (Bootstrap icon) */}
        <div className="dropdown">
          <div className="profile-icon" onClick={handleProfileClick}>
            {/* Bootstrap person-circle icon */}
            <i className="bi bi-person" style={{ fontSize: '24px', color: 'white' }}></i>
          </div>
          {/* Profile Dropdown Menu */}
          <div className={`profile-dropdown ${isProfileOpen ? 'show' : ''}`}>
            <a className="dropdown-item" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i> Logout
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
