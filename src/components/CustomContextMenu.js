import React, { useState } from "react";
import {
  DefaultContextMenu,
  TldrawUiMenuGroup,
  DefaultContextMenuContent,
  useEditor,
} from "tldraw";
import { nanoid } from "nanoid";
import "../App.css";
import HistoryCommentPanel from "./HistoryCommentPanel";
import ToggleExpandButton from "./ToggleExpandButton";
import CommentBox from "./CommentBox";
import ReactionTooltip from "./tooltip/ReactionTooltip";
import CommentIconWithCounter from "./CommentIconWithCounter";
import ReactionsMenu from "./ReactionsMenu";
import CommentMenu from "./CommentMenu";

export default function CustomContextMenu(props) {
  const editor = useEditor();
  const [selectedShape, setSelectedShape] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comments, setComments] = useState({});
  const [actionHistory, setActionHistory] = useState([]);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [shapeReactions, setShapeReactions] = useState({});
  // const [shapeToRibbonMap, setShapeToRibbonMap] = useState({});
  // const [groupIds, setGroupIds] = useState({});
  const [hoveredShape, setHoveredShape] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const togglePanel = () => {
    setIsPanelCollapsed(!isPanelCollapsed);
  };

  const logAction = (action) => {
    setActionHistory((prevHistory) => [
      ...prevHistory,
      { ...action, timestamp: new Date().toLocaleString() },
    ]);
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    const point = editor.screenToPage({ x: event.clientX, y: event.clientY });
    const shape = editor.getShapeAtPoint(point);

    if (shape) {
      setSelectedShape(shape);
      editor.select(shape.id);

      console.log("Shape ID:", shape.id);
    }
  };

  const handleCommentClick = () => {
    if (!selectedShape) return;
    setShowCommentBox(true);
  };

  const addComment = (shapeId, commentData) => {
    const commentDataWithTime = {
      ...commentData,
      timestamp: new Date().toLocaleString(),
    };

    setComments((prevComments) => ({
      ...prevComments,
      [shapeId]: [...(prevComments[shapeId] || []), commentDataWithTime],
    }));
  };

  const renderCommentIconWithCounter = (shapeId) => {
    const shapeComments = comments[shapeId] || [];
    if (shapeComments.length === 0) return null;

    const shape = editor.getShape(shapeId);
    if (!shape) return;

    const { x, y } = shape;

    return (
      <CommentIconWithCounter
        shapeId={shapeId}
        count={shapeComments.length}
        x={x}
        y={y}
      />
    );
  };

  return (
    <div onContextMenu={handleContextMenu}>
      {Object.keys(shapeReactions).map((shapeId) => {
        const shape = editor.getShape(shapeId);
        return (
          <div key={shapeId} className="shape-container">
            {/* Render the shape */}
            <div className="shape">{shapeId}</div>
          </div>
        );
      })}
      <ReactionTooltip
        reactions={shapeReactions[hoveredShape?.id] || {}}
        position={tooltipPosition}
        visible={hoveredShape !== null}
      />
      <DefaultContextMenu {...props}>
        <TldrawUiMenuGroup id="reactions">
          <div
            style={{
              backgroundColor: "lightblue",
              padding: "5px",
              fontWeight: "bold",
              position: "relative",
            }}
            className="menu-item-react"
          >
            <ReactionsMenu />
          </div>
          <div
            style={{
              backgroundColor: "#f0f8ff",
              padding: "5px",
              fontWeight: "bold",
            }}
            className="menu-item-comment"
          ></div>
          <CommentMenu
            selectedShape={selectedShape}
            setShowCommentBox={setShowCommentBox}
          />
        </TldrawUiMenuGroup>
        <DefaultContextMenuContent />
      </DefaultContextMenu>
      <div className="panelContainerWrapper">
        {!isPanelCollapsed && (
          <HistoryCommentPanel
            actionHistory={actionHistory}
            comments={comments}
            selectedShape={selectedShape}
            isPanelCollapsed={isPanelCollapsed}
            togglePanel={togglePanel}
          />
        )}
        {isPanelCollapsed && (
          <ToggleExpandButton
            isPanelCollapsed={isPanelCollapsed}
            togglePanel={togglePanel}
          />
        )}
      </div>
      <CommentBox
        selectedShape={selectedShape}
        addComment={addComment}
        showCommentBox={showCommentBox}
        onClose={() => setShowCommentBox(false)}
        logAction={logAction}
      />
      {Object.keys(comments).map((shapeId) => (
        <div key={shapeId} style={{ position: "relative" }}>
          {renderCommentIconWithCounter(shapeId)}
        </div>
      ))}
    </div>
  );
}
