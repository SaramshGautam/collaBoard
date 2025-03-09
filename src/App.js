import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate,useLocation } from "react-router-dom";
import { useParams } from 'react-router-dom';

// Importing pages
import LoginPage from "./components/LoginPage"; 
import TeachersHome from "./components/TeachersHome"; 
import StudentsHome from "./components/StudentsHome"; 
import Classroom from './components/Classroom';
import AddProject from './components/AddProject';
import AddStudent from './components/AddStudent';
import AddClassroom from './components/AddClassroom';
import ManageTeams from './components/ManageTeam';
import Project from './components/Project';
import EditProject from './components/EditProject';
import EditStudent from './components/EditStudent';
import ManageStudent from './components/ManageStudent'; 
import EditClassroom from './components/EditClassroom'; 
import Team from './components/Team';
import About from "./components/About"; 
import Contact from "./components/Contact"; 
import "./style.css";

// Firebase imports
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import {
  Tldraw,
  DefaultToolbar,
  TldrawUiMenuItem,
  useTools,
  useIsToolSelected,
  DefaultToolbarContent,
} from "tldraw";
import { useSyncDemo } from "@tldraw/sync";
import "tldraw/tldraw.css";
import "./App.css";
import CustomContextMenu from "./components/CustomContextMenu";
import Navbar from "./components/navbar/Navbar";
import ContextToolbarComponent from "./components/ContextToolbarComponent";
import CustomActionsMenu from "./components/CustomActionsMenu";
// import CircleWithArrowsIcon from "./icons/CircleWithArrowsIcon";
// import { CollectionTool } from "./utils/CollectionTool";
// import { GroupTool } from "./utils/GroupTool";
// import { EllipseTool } from "./utils/EllipseTool";
// const customTools = [GroupTool, EllipseTool];
// const customTools = [EllipseTool, CollectionTool];

// const uiOverrides = {
//   tools(editor, tools) {
//     tools["collection"] = {
//       id: "collection",
//       icon: CircleWithArrowsIcon,
//       label: "Collection Tool",
//       kbd: "c",
//       onSelect: () => {
//         editor.setCurrentTool("collection");
//       },
//     };
//     return tools;
//   },
// };

// Firebase configuration


const CustomToolbar = (props) => {
  const tools = useTools();
  // const isCollectionToolSelected = useIsToolSelected(tools["collection"]);

  return (
    <DefaultToolbar {...props}>
      {/* Group Tool */}
      {/* <TldrawUiMenuItem {...tools["group"]} isSelected={isGroupToolSelected} /> */}

      {/* Collection Tool with Custom Icon 
      <button
        onClick={() => tools["collection"].onSelect()}
        style={{
           background: isCollectionToolSelected ? "#e6f7ff" : "transparent", // Highlight when selected
           border: isCollectionToolSelected ? "2px solid #1890ff" : "none", // Add border when selected
          padding: "8px",
          borderRadius: "4px", // Match the default button style
          cursor: "pointer",
        }}
        title="Collection Tool"
      >
        {/* <CircleWithArrowsIcon
          style={{
            fill: isCollectionToolSelected ? "#1890ff" : "none", // Change icon color when selected
            stroke: isCollectionToolSelected ? "#1890ff" : "black",
          }}
        />{" "} 
      </button>*/}
      <DefaultToolbarContent />
    </DefaultToolbar>
  );
};

const components = {
  Navbar: Navbar,
  ContextMenu: CustomContextMenu,
  InFrontOfTheCanvas: ContextToolbarComponent,
  // Toolbar: DefaultToolbar,
  Toolbar: CustomToolbar,
  ActionsMenu: CustomActionsMenu,
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const googleLogin = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const idToken = await user.getIdToken(); // Get ID token

        // Send the ID token to the backend for validation
        const response = await fetch("http://localhost:5000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken: idToken }),
        });

        const data = await response.json();

        if (data.success) {
            // Handle successful login based on the role
            if (data.role === "teacher") {
                navigate("/teachers-home");
            } else if (data.role === "student") {
                navigate("/students-home");
            }
        } else {
            console.error(data.message);
        }
    } catch (error) {
        console.error("Google login failed:", error);
    }
};

  return (
<Routes>
<Route path="/about" element={<><Navbar /><About/></>} />
<Route path="/contact" element={<><Navbar /><Contact/></>} />
  {/* Login Page */}
  <Route path="/" element={<LoginPage onLogin={googleLogin} />} />
  
  {/* Teacher's Home */}
  <Route path="/teachers-home" element={<><Navbar /><TeachersHome /></>} />
  
  {/* Student's Home */}
  <Route path="/students-home" element={<><Navbar /><StudentsHome /></>} />
  
  {/* Classroom Management */}
  <Route path="/classroom/:className" element={<><Navbar /><Classroom /></>} />
  <Route path="/classroom/:className/add-project" element={<><Navbar /><AddProject /></>} />
  <Route path="/classroom/:className/add-student" element={<><Navbar /><AddStudent /></>} />
  <Route path="/classroom/:className/project/:projectName" element={<><Navbar /><Project /></>} />
  <Route path="/classroom/:className/project/:projectName/edit" element={<><Navbar /><EditProject /></>} />
  <Route path="/classroom/:className/project/:projectName/team/:teamName" element={<><Navbar /><Team /></>} />
  <Route path="/classroom/:className/edit" element={<><Navbar /><EditClassroom /></>} />

  
  {/* Manage Students */}
  <Route path="/classroom/:className/manage-students" element={<><Navbar /><ManageStudent /></>} />
  <Route path="/classroom/:className/manage-students/:studentId/edit" element={<><Navbar /><EditStudent /></>} />
  <Route path="/classroom/:className/manage-students/add-student" element={<><Navbar /><AddStudent /></>} />
  <Route path="/classroom/:className/project/:projectName/manage-teams" element={<><Navbar /><ManageTeams /></>} />

  {/* Add Classroom */}
  <Route path="/add-classroom" element={<><Navbar /><AddClassroom /></>} />
  
  {/* Collaborative Whiteboard */}
  <Route path="/whiteboard/:className/:projectName/:teamName" element={<CollaborativeWhiteboard />} />
</Routes>

  );
}

const CollaborativeWhiteboard = () => {
  const { className, projectName, teamName } = useParams(); // Get params from URL
  const roomId = `collaBoard-${className}-${projectName}-${teamName}`; // Create unique roomId based on class, project, and team
  const store = useSyncDemo({ roomId }); // Use the unique roomId

  const [shapeReactions, setShapeReactions] = useState({});
  const [selectedShape, setSelectedShape] = useState(null);
  const [commentCounts, setCommentCounts] = useState({});

  const handleReactionClick = (shapeId, reactionType) => {
    setShapeReactions((prevReactions) => {
      const currentReactions = prevReactions[shapeId] || {
        Like: 0,
        Dislike: 0,
        Surprised: 0,
        Confused: 0,
      };

      return {
        ...prevReactions,
        [shapeId]: {
          ...currentReactions,
          [reactionType]:
            currentReactions[reactionType] > 0
              ? currentReactions[reactionType] - 1
              : currentReactions[reactionType] + 1, // Increment reaction
        },
      };
    });
  };

  return (
    <div className="main-container" style={{ position: "fixed", inset: 0 }}>
      <Navbar />
      <Tldraw
        store={store}
        // tools={customTools}
        // overrides={uiOverrides}
        components={{
          ContextMenu: (props) => (
            <CustomContextMenu
              {...props}
              shapeReactions={shapeReactions}
              setShapeReactions={setShapeReactions}
              selectedShape={selectedShape}
              setSelectedShape={setSelectedShape}
              commentCounts={commentCounts}
              setCommentCounts={setCommentCounts}
            />
          ),
          InFrontOfTheCanvas: (props) => (
            <ContextToolbarComponent
              {...props}
              selectedShape={selectedShape}
              shapeReactions={shapeReactions}
              commentCounts={commentCounts}
              onReactionClick={handleReactionClick}
            />
          ),
          Toolbar: CustomToolbar,
          ActionsMenu: (props) => <CustomActionsMenu {...props} />,
        }}
      />
    </div>
  );
};
export default App;
