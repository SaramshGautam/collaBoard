import React from "react";
import { Link, useLocation } from "react-router-dom";

const Breadcrumbs = () => {
  const location = useLocation();
  const role = localStorage.getItem("role");
  const homeRoute =
    role === "teacher"
      ? "/teachers-home"
      : role === "student"
      ? "/students-home"
      : "/";

  const path = location.pathname;

  // When exactly at the home route, show only "Home"
  if (path === homeRoute) {
    return (
      <nav className="breadcrumb">
        <span>Home</span>
      </nav>
    );
  }

  // Helper to render crumbs with separators
  const renderCrumbs = (crumbs) => (
    <nav className="breadcrumb">
      {crumbs.map((crumb, index) => (
        <span key={index}>
          {index < crumbs.length - 1 ? (
            <Link to={crumb.path}>{crumb.name}</Link>
          ) : (
            <span>{crumb.name}</span>
          )}
          {index < crumbs.length - 1 && (
            <span className="breadcrumb-separator" style={{ margin: "0 10px" }}>
              &gt;
            </span>
          )}
        </span>
      ))}
    </nav>
  );

// Special handling for whiteboard routes:
if (path.startsWith("/whiteboard")) {
  // Expected URL: /whiteboard/:className/:projectName/:teamName
  const segments = path.split("/").filter((x) => x);
  const [ , className, projectName, teamName ] = segments;
  const crumbs = [
    { name: "Home", path: homeRoute },
    { name: decodeURIComponent(className), path: `/classroom/${className}` },
    { name: decodeURIComponent(projectName), path: `/classroom/${className}/project/${projectName}` },
    { name: decodeURIComponent(teamName), path: `/classroom/${className}/project/${projectName}/team/${teamName}` },
    { name: "whiteboard", path }
  ];
  return renderCrumbs(crumbs);
}

  // Handling for classroom routes
  if (path.startsWith("/classroom")) {
    const segments = path.split("/").filter((x) => x);
    // segments example: ["classroom", "class1", ...]
    const className = segments[1];
    let crumbs = [
      { name: "Home", path: homeRoute },
      { name: decodeURIComponent(className), path: `/classroom/${className}` }
    ];

    if (role === "teacher") {
      // Teacher-specific routes
      if (segments.length === 2) {
        return renderCrumbs(crumbs);
      }
      const next = segments[2];

      if (next === "add-project") {
        crumbs.push({
          name: "Add Project",
          path: `/classroom/${className}/add-project`
        });
        return renderCrumbs(crumbs);
      }

      // For routes like /classroom/:className/add-student,
      // display as: Home > className > Manage Students > Add Student
      if (next === "add-student") {
        crumbs.push({
          name: "Manage Students",
          path: `/classroom/${className}/manage-students`
        });
        crumbs.push({
          name: "Add Student",
          path: `/classroom/${className}/add-student`
        });
        return renderCrumbs(crumbs);
      }

      if (next === "edit") {
        crumbs.push({
          name: "Edit Classroom",
          path: `/classroom/${className}/edit`
        });
        return renderCrumbs(crumbs);
      }

      if (next === "manage-students") {
        crumbs.push({
          name: "Manage Students",
          path: `/classroom/${className}/manage-students`
        });
        if (segments.length >= 4) {
          const sub = segments[3];
          if (sub === "add-student") {
            crumbs.push({
              name: "Add Student",
              path: `/classroom/${className}/manage-students/add-student`
            });
          } else if (segments.length >= 5 && segments[4] === "edit") {
            crumbs.push({
              name: "Edit Student",
              path: `/classroom/${className}/manage-students/${sub}/edit`
            });
          }
        }
        return renderCrumbs(crumbs);
      }

      if (next === "project") {
        if (segments.length >= 4) {
          const projectName = segments[3];
          crumbs.push({
            name: decodeURIComponent(projectName),
            path: `/classroom/${className}/project/${projectName}`
          });
          if (segments.length === 4) return renderCrumbs(crumbs);
          const sub = segments[4];
          if (sub === "edit") {
            crumbs.push({
              name: "Edit Project",
              path: `/classroom/${className}/project/${projectName}/edit`
            });
            return renderCrumbs(crumbs);
          }
          if (sub === "manage-teams") {
            crumbs.push({
              name: "Manage Teams",
              path: `/classroom/${className}/project/${projectName}/manage-teams`
            });
            return renderCrumbs(crumbs);
          }
          if (sub === "team") {
            if (segments.length >= 6) {
              // Instead of adding a separate "team" crumb that duplicates the project page,
              // we simply add the team name as the final crumb.
              const teamName = segments[5];
              crumbs.push({
                name: decodeURIComponent(teamName),
                path: `/classroom/${className}/project/${projectName}/team/${teamName}`
              });
              return renderCrumbs(crumbs);
            }
          }
          return renderCrumbs(crumbs);
        }
      }

      // Fallback for teacher if none of the above conditions match.
      let cumulativePath = "";
      const genericCrumbs = [{ name: "Home", path: homeRoute }];
      segments.forEach((segment, index) => {
        cumulativePath += `/${segment}`;
        if (!["classroom", "project"].includes(segment.toLowerCase())) {
          genericCrumbs.push({
            name: decodeURIComponent(segment),
            path: cumulativePath
          });
        }
      });
      return renderCrumbs(genericCrumbs);
    } else {
      // For students (or other roles)
      const unwanted = ["classroom", "project"];
      for (let i = 2; i < segments.length; i++) {
        if (!unwanted.includes(segments[i].toLowerCase())) {
          let cumulativePath = `/${segments.slice(0, i + 1).join("/")}`;
          crumbs.push({
            name: decodeURIComponent(segments[i]),
            path: cumulativePath
          });
        }
      }
      return renderCrumbs(crumbs);
    }
  }

  // Fallback: a generic splitting method for any other paths
  const genericSegments = path.split("/").filter((x) => x);
  let cumulativePath = "";
  const genericCrumbs = [{ name: "Home", path: homeRoute }];
  genericSegments.forEach((segment) => {
    cumulativePath += `/${segment}`;
    genericCrumbs.push({
      name: decodeURIComponent(segment),
      path: cumulativePath
    });
  });
  return renderCrumbs(genericCrumbs);
};

export default Breadcrumbs;
