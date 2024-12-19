import React, { useState } from "react";
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
import CircleWithArrowsIcon from "./icons/CircleWithArrowsIcon";
import { CollectionTool } from "./utils/CollectionTool";
// import { GroupTool } from "./utils/GroupTool";
import { EllipseTool } from "./utils/EllipseTool";
// const customTools = [GroupTool, EllipseTool];
const customTools = [EllipseTool, CollectionTool];

const uiOverrides = {
  tools(editor, tools) {
    tools["collection"] = {
      id: "collection",
      icon: CircleWithArrowsIcon,
      label: "Collection Tool",
      kbd: "c",
      onSelect: () => {
        editor.setCurrentTool("collection");
      },
    };
    return tools;
  },
};

const CustomToolbar = (props) => {
  const tools = useTools();
  const isCollectionToolSelected = useIsToolSelected(tools["collection"]);

  return (
    <DefaultToolbar {...props}>
      {/* Group Tool */}
      {/* <TldrawUiMenuItem {...tools["group"]} isSelected={isGroupToolSelected} /> */}

      {/* Collection Tool with Custom Icon */}
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
        <CircleWithArrowsIcon
          style={{
            fill: isCollectionToolSelected ? "#1890ff" : "none", // Change icon color when selected
            stroke: isCollectionToolSelected ? "#1890ff" : "black",
          }}
        />{" "}
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

export default function App() {
  const store = useSyncDemo({ roomId: "collaBoard-abc123" });
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
        tools={customTools}
        overrides={uiOverrides}
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
}
