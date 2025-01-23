import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
// Importing pages
import LoginPage from "./components/LoginPage"; 
import TeachersHome from "./components/TeachersHome"; 
import StudentsHome from "./components/StudentsHome"; 
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

const CustomToolbar = (props) => {
  const tools = useTools();
  // const isCollectionToolSelected = useIsToolSelected(tools["collection"]);

  return (
    <DefaultToolbar {...props}>
      {/* Group Tool */}
      {/* <TldrawUiMenuItem {...tools["group"]} isSelected={isGroupToolSelected} /> */}

      {/* Collection Tool with Custom Icon */}
      <button
        onClick={() => tools["collection"].onSelect()}
        style={{
          // background: isCollectionToolSelected ? "#e6f7ff" : "transparent", // Highlight when selected
          // border: isCollectionToolSelected ? "2px solid #1890ff" : "none", // Add border when selected
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
        />{" "} */}
      </button>
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
const App = () => {
  const [role, setRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

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
      {/* Login Page */}
      
      <Route
        path="/"
        element={<LoginPage onLogin={googleLogin} />}
      />
      {/* Teacher's Home */}
      <Route
        path="/teachers-home"
        element={
          <>
              <Navbar />
              <TeachersHome onWhiteboardClick={() => navigate("/whiteboard")} />
            </>
        }
      />
      {/* Student's Home */}
      <Route
        path="/students-home"
        element={
          <>
              <Navbar />
              <StudentsHome onWhiteboardClick={() => navigate("/whiteboard")} />
            </>
        }
      />
      {/* Collaborative Whiteboard */}
      <Route path="/whiteboard" element={<CollaborativeWhiteboard />} />
    </Routes>
  );
}

const CollaborativeWhiteboard = () => {
  const store = useSyncDemo({ roomId: "collaBoard-abc123" });
  //const store = useSyncDemo({ roomId: "collaBoard-xyz123" });
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
