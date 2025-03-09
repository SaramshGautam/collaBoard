import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import Breadcrumbs from "../Breadcrumbs";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const role = localStorage.getItem("role");
  const homeRoute =
    role === "teacher"
      ? "/teachers-home"
      : role === "student"
      ? "/students-home"
      : "/";

  const handleProfileClick = () => {
    setIsProfileOpen(prev => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("role");
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".navbar")) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Left Section: Title */}
          <div className="navbar-left">
            <div className="navbar-title-container">
              <div
                className="navbar-title"
                onClick={() => navigate(homeRoute)}
              >
                Creative Assistant
              </div>
            </div>
          </div>

          {/* Center Section: Divider and Breadcrumbs */}
          <div className="navbar-center">
            <div className="divider"></div>
            <div className="navbar-breadcrumbs">
              <Breadcrumbs />
            </div>
          </div>

          {/* Right Section: Menu Icon Dropdown */}
          <div className="navbar-right">
            <ul className="nav-item dropdown">
              <li
                className="nav-link"
                onClick={handleProfileClick}
                style={{ paddingTop: "10px", cursor: "pointer" }}
              >
                <i
                  className="bi bi-list"
                  style={{ fontSize: "24px", color: "white" }}
                ></i>
              </li>
              <ul className={`dropdown-menu ${isProfileOpen ? "show" : ""}`}>
                <li>
                  <a
                    className="dropdown-item"
                    onClick={() => {
                      navigate("/about");
                      setIsProfileOpen(false);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    onClick={() => {
                      navigate("/contact");
                      setIsProfileOpen(false);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    onClick={() => {
                      handleLogout();
                      setIsProfileOpen(false);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                   <i className="bi bi-box-arrow-right me-2"></i> Logout
                  </a>
                </li>
              </ul>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
