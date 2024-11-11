import React from "react";
import "./Navbar.css";

const Navbar = () => {
  const handleProfileClick = () => {
    // Add any functionality you need when the profile button is clicked
    console.log("Profile button clicked");
  };

  return (
    <div className="navbar">
      <div className="navbar-title">collaBOARD</div>
      <div className="navbar-links">
        <a href="#home">Home</a>
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
    </div>
  );
};

export default Navbar;
