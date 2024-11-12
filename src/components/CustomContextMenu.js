import React, { useState, useEffect, useRef } from "react";
import {
  DefaultContextMenu,
  TldrawUiMenuItem,
  TldrawUiMenuGroup,
  DefaultContextMenuContent,
  useEditor,
} from "tldraw";
import { nanoid } from "nanoid";
import "../App.css";
import HistoryPanel from "./HistoryPanel";
import CommentPanel from "./CommentPanel";
import ToggleButtonGroup from "./ToggleButtonGroup";

export default function CustomContextMenu(props) {
  const editor = useEditor();
  const [selectedShape, setSelectedShape] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comments, setComments] = useState({});
  const [actionHistory, setActionHistory] = useState([]);
  const [isViewingHistory, setIsViewingHistory] = useState(true);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [commentData, setCommentData] = useState({
    userId: "User123",
    timestamp: new Date().toLocaleString(),
    text: "",
  });
  const commentInputRef = useRef(null);

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

  const handleLikeClick = () => {
    if (!selectedShape) return;

    const shape = editor.getShape(selectedShape.id);
    const { x = 0, y = 0, props = {} } = shape;

    const topRightX = x + (props.w || 50) - 20;
    const topRightY = y - 20;

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
          text: "👍",
          color: "blue",
          fill: "solid",
          verticalAlign: "middle",
        },
      },
    ]);
    logAction({ userId: commentData.userId, action: "liked a picture" });
  };

  const handleCommentClick = () => {
    if (!selectedShape) return;
    setShowCommentBox(true);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();

    if (!selectedShape) return;

    const shapeId = selectedShape.id;
    setComments((prevComments) => ({
      ...prevComments,
      [shapeId]: [...(prevComments[shapeId] || []), commentData],
    }));

    setShowCommentBox(false);
    setCommentData({ ...commentData, text: "" });

    const shape = editor.getShape(shapeId);
    const { x, y } = shape;
    createCommentIcon(x - 15, y - 15, shapeId);
    logAction({ userId: commentData.userId, action: "added a comment" });
  };

  const handleClear = () => {
    setCommentData({ ...commentData, text: "" });
  };

  const handleClose = () => {
    setShowCommentBox(false);
    setCommentData({ ...commentData, text: "" });
  };

  useEffect(() => {
    if (showCommentBox && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [showCommentBox]);

  const createCommentIcon = (x, y, shapeId) => {
    editor.createShapes([
      {
        id: `shape:${nanoid()}`,
        type: "geo",
        x: x,
        y: y,
        props: {
          geo: "ellipse",
          w: 60,
          h: 20,
          text: "💬",
          color: "black",
          fill: "solid",
          verticalAlign: "middle",
        },
      },
    ]);
  };

  return (
    <div onContextMenu={handleContextMenu}>
      <DefaultContextMenu {...props}>
        <TldrawUiMenuGroup id="example">
          <div
            style={{
              backgroundColor: "thistle",
              padding: "5px",
              fontWeight: "bold",
            }}
          >
            <TldrawUiMenuItem
              id="like"
              label="Like 👍"
              icon="code"
              readonlyOk
              onSelect={handleLikeClick}
              className="menu-item-like"
            />
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
        {/* Collapsible Panel */}
        {!isPanelCollapsed && (
          <div className="panelContainer">
            <button onClick={togglePanel} className="toggle-collapse-button">
              {isPanelCollapsed ? "<<" : ">>"}
            </button>
            <ToggleButtonGroup
              isViewingHistory={isViewingHistory}
              setIsViewingHistory={setIsViewingHistory}
            />
            {isViewingHistory ? (
              <HistoryPanel actionHistory={actionHistory} />
            ) : (
              <CommentPanel comments={comments[selectedShape?.id] || []} />
            )}
          </div>
        )}

        {/* Button to expand the panel if it's collapsed */}
        {isPanelCollapsed && (
          <div className="toggle-expand-container">
            <button onClick={togglePanel} className="toggle-expand-button">
              {"<<"}
            </button>
            <div className="panel-label">History/Comment Panel</div>
          </div>
        )}
      </div>

      {/* Comment Input Box */}
      {showCommentBox && (
        <div className="commentBox">
          <button onClick={handleClose} className="closeButton">
            ×
          </button>

          <h4 className="commentBoxTitle">Add Comment</h4>
          <form onSubmit={handleCommentSubmit}>
            <label className="label">
              User ID:
              <input
                type="text"
                value={commentData.userId}
                onChange={(e) =>
                  setCommentData({ ...commentData, userId: e.target.value })
                }
                className="input"
              />
            </label>
            <label className="label">
              Time:
              <input
                type="text"
                value={commentData.timestamp}
                readOnly
                className="input"
              />
            </label>
            <label className="label">
              Comment:
              <textarea
                ref={commentInputRef}
                value={commentData.text}
                onChange={(e) =>
                  setCommentData({ ...commentData, text: e.target.value })
                }
                className="textarea"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    handleCommentSubmit(e); // Submit on Enter
                  }
                }}
              />
            </label>
            <button type="submit" className="button">
              Submit
            </button>
            <button type="button" onClick={handleClear} className="clearButton">
              Clear
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
