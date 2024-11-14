import React, { useState } from "react";
import {
  DefaultContextMenu,
  TldrawUiMenuItem,
  TldrawUiMenuGroup,
  DefaultContextMenuContent,
  useEditor,
} from "tldraw";
import { nanoid } from "nanoid";
import "../App.css";
import HistoryCommentPanel from "./HistoryCommentPanel";
import ToggleExpandButton from "./ToggleExpandButton";
import CommentBox from "./CommentBox";
import CommentIconWithCounter from "./CommentIconWithCounter";

export default function CustomContextMenu(props) {
  const editor = useEditor();
  const [selectedShape, setSelectedShape] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comments, setComments] = useState({});
  const [actionHistory, setActionHistory] = useState([]);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const reactions = [
    { id: "like", label: "Like", icon: "👍" },
    { id: "dislike", label: "Dislike", icon: "👎" },
    { id: "confused", label: "Confused", icon: "❓" },
    { id: "surprised", label: "Surprised", icon: "❗️" },
  ];

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
    } else {
      setSelectedShape(null);
      console.log("No shape found at this point.");
    }
  };

  const handleReactionClick = (reactionId) => {
    if (!selectedShape) return;

    const shape = editor.getShape(selectedShape.id);
    const { x = 0, y = 0, props = {} } = shape;

    const topRightX = x + (props.w || 50) - 30;
    const topRightY = y - 30;

    const reactionIcon =
      reactions.find((reaction) => reaction.id === reactionId)?.icon || "🙂";

    editor.createShapes([
      {
        id: `shape:${nanoid()}`,
        type: "geo",
        x: topRightX,
        y: topRightY,
        props: {
          geo: "ellipse",
          w: 60,
          h: 30,
          text: reactionIcon,
          color: "yellow",
          fill: "solid",
          verticalAlign: "middle",
        },
      },
    ]);

    logAction({ userId: "User123", action: `${reactionId} a picture` });
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
        key={shapeId}
        count={shapeComments.length}
        x={x}
        y={y}
      />
    );
  };

  return (
    <div onContextMenu={handleContextMenu}>
      <DefaultContextMenu {...props}>
        <TldrawUiMenuGroup id="reactions">
          <div
            style={{
              backgroundColor: "lightblue",
              padding: "5px",
              fontWeight: "bold",
              position: "relative", // Ensure submenu positions itself relative to this item
            }}
            className="menu-item-react" // CSS class for hover effect
          >
            <TldrawUiMenuItem
              id="react"
              label="React 🙂"
              icon="🙂"
              readonlyOk
              className="menu-item-react"
            />

            {/* Submenu that appears on hover */}
            <div className="submenu">
              {reactions.map((reaction) => (
                <div
                  key={reaction.id}
                  className="submenu-item"
                  onClick={() => handleReactionClick(reaction.id)}
                >
                  {reaction.icon} {reaction.label}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#f0f8ff",
              padding: "5px",
              fontWeight: "bold",
            }}
          >
            <TldrawUiMenuItem
              id="comment"
              label="Comment 💬"
              icon="code"
              readonlyOk
              onSelect={handleCommentClick}
              className="menu-item-comment"
            />
          </div>
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

      {/* Comment Input Box */}
      <CommentBox
        selectedShape={selectedShape}
        addComment={addComment}
        showCommentBox={showCommentBox}
        onClose={() => setShowCommentBox(false)}
        logAction={logAction}
      />

      {Object.keys(comments).map((shapeId) => (
        <React.Fragment key={shapeId}>
          {renderCommentIconWithCounter(shapeId)}
        </React.Fragment>
      ))}
    </div>
  );
}
