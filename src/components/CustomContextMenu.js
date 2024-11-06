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

export default function CustomContextMenu(props) {
  const editor = useEditor();
  const [selectedShape, setSelectedShape] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  // const [showCommentsView, setShowCommentsView] = useState(false);
  const [comments, setComments] = useState({});
  const [actionHistory, setActionHistory] = useState([]);
  const [isViewingHistory, setIsViewingHistory] = useState(true);
  const [commentData, setCommentData] = useState({
    userId: "User123",
    timestamp: new Date().toLocaleString(),
    text: "",
  });
  const commentInputRef = useRef(null);

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

    const topRightX = x + (props.w || 50) - 10;
    const topRightY = y - 10;

    editor.createShapes([
      {
        id: `shape:${nanoid()}`,
        type: "geo",
        x: topRightX,
        y: topRightY,
        props: {
          geo: "rectangle",
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

    setShowCommentBox(false); // Close the comment box
    setCommentData({ ...commentData, text: "" }); // Clear the comment input

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
    setCommentData({ ...commentData, text: "" }); // Clear the input fields when closed
  };

  useEffect(() => {
    if (showCommentBox && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [showCommentBox]);

  // const handleViewComments = (shapeId) => {
  //   setSelectedShape(editor.getShape(shapeId));
  //   setShowCommentsView(true);
  // };

  const createCommentIcon = (x, y, shapeId) => {
    editor.createShapes([
      {
        // id: `shape:${shapeId}_${nanoid()}`, // Unique id for easy identification
        id: `shape:${nanoid()}`, // Unique id for easy identification
        // id: `shape:${shapeId}`, // Unique id for easy identification
        type: "geo",
        x: x,
        y: y,
        props: {
          geo: "rectangle",
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

      {/* {selectedShape && <HistoryPanel actionHistory={actionHistory} />} */}
      {selectedShape && (
        <div style={styles.panelContainer}>
          {/* Toggle Buttons */}
          <div style={styles.toggleButtonContainer}>
            <button
              onClick={() => setIsViewingHistory(true)}
              style={
                isViewingHistory ? styles.activeButton : styles.toggleButton
              }
            >
              Action History
            </button>
            <button
              onClick={() => setIsViewingHistory(false)}
              style={
                !isViewingHistory ? styles.activeButton : styles.toggleButton
              }
            >
              Comments
            </button>
          </div>

          {/* Toggleable Panel Content */}
          {isViewingHistory ? (
            <HistoryPanel actionHistory={actionHistory} />
          ) : (
            <CommentPanel comments={comments[selectedShape.id] || []} />
          )}
        </div>
      )}

      {/* Comment Input Box */}
      {showCommentBox && (
        <div style={styles.commentBox}>
          <button onClick={handleClose} style={styles.closeButton}>
            ×
          </button>

          <h4 style={styles.commentBoxTitle}>Add Comment</h4>
          <form onSubmit={handleCommentSubmit}>
            <label style={styles.label}>
              User ID:
              <input
                type="text"
                value={commentData.userId}
                onChange={(e) =>
                  setCommentData({ ...commentData, userId: e.target.value })
                }
                style={styles.input}
              />
            </label>
            <label style={styles.label}>
              Time:
              <input
                type="text"
                value={commentData.timestamp}
                readOnly
                style={styles.input}
              />
            </label>
            <label style={styles.label}>
              Comment:
              <textarea
                ref={commentInputRef}
                value={commentData.text}
                onChange={(e) =>
                  setCommentData({ ...commentData, text: e.target.value })
                }
                style={styles.textarea}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    handleCommentSubmit(e); // Submit on Enter
                  }
                }}
              />
            </label>
            <button type="submit" style={styles.button}>
              Submit
            </button>
            <button
              type="button"
              onClick={handleClear}
              style={styles.clearButton}
            >
              Clear
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function HistoryPanel({ actionHistory }) {
  return (
    <div style={styles.historyPanel}>
      <h4 style={styles.historyTitle}>Action History</h4>
      <ul style={styles.historyList}>
        {actionHistory.map((action, index) => (
          <li key={index} style={styles.historyItem}>
            <strong>{action.userId}</strong> {action.action} at{" "}
            {action.timestamp}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CommentPanel({ comments }) {
  return (
    <div style={styles.commentsPanel}>
      <h4 style={styles.commentsTitle}>Comments</h4>
      <ul style={styles.commentsList}>
        {comments.map((comment, index) => (
          <li key={index} style={styles.commentItem}>
            <strong>{comment.userId}:</strong> {comment.text}
            <div style={styles.timestamp}>{comment.timestamp}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  panelContainer: {
    position: "absolute",
    top: "10px",
    right: "10px",
    width: "250px",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    fontFamily: "Arial, sans-serif",
    color: "#333",
    padding: "10px",
  },
  toggleButtonContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  toggleButton: {
    flex: 1,
    padding: "8px",
    backgroundColor: "#f0f0f0",
    border: "none",
    cursor: "pointer",
    borderRadius: "5px",
    margin: "0 2px",
  },
  activeButton: {
    flex: 1,
    padding: "8px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    borderRadius: "5px",
    margin: "0 2px",
  },
  commentBox: {
    position: "absolute",
    top: "100px",
    left: "100px",
    backgroundColor: "#fff",
    padding: "20px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", // Softer shadow
    borderRadius: "10px",
    zIndex: 1000,
    width: "280px",
    fontFamily: "Arial, sans-serif",
    color: "#333",
  },
  commentsViewBox: {
    position: "absolute",
    top: "150px",
    left: "100px",
    backgroundColor: "#fff",
    padding: "20px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    borderRadius: "10px",
    zIndex: 1000,
    width: "300px",
    fontFamily: "Arial, sans-serif",
    color: "#333",
  },
  closeButton: {
    position: "absolute",
    top: "8px",
    right: "8px",
    background: "transparent",
    border: "none",
    fontSize: "18px",
    color: "#999",
    cursor: "pointer",
    fontWeight: "bold",
    outline: "none",
  },
  commentsViewTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#444",
    marginBottom: "10px",
  },
  commentsList: {
    listStyleType: "none",
    padding: 0,
    maxHeight: "200px",
    overflowY: "auto",
  },
  commentItem: {
    padding: "8px",
    borderBottom: "1px solid #ddd",
  },
  timestamp: {
    fontSize: "12px",
    color: "#888",
    marginTop: "5px",
  },
  commentBoxTitle: {
    marginBottom: "10px",
    fontSize: "18px",
    fontWeight: "600",
    color: "#444",
    borderBottom: "1px solid #ddd",
    paddingBottom: "5px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    marginBottom: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "14px",
    color: "#333",
    outline: "none",
    transition: "border-color 0.2s",
  },
  textarea: {
    width: "100%",
    padding: "8px 10px",
    marginBottom: "15px",
    height: "60px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "14px",
    color: "#333",
    resize: "none",
    outline: "none",
    transition: "border-color 0.2s",
  },
  button: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
    color: "#fff",
    backgroundColor: "#4CAF50",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    marginBottom: "10px",
  },
  clearButton: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
    color: "#fff",
    backgroundColor: "#d9534f",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },

  historyPanel: {
    maxHeight: "300px",
    overflowY: "auto",
  },
  commentsPanel: {
    maxHeight: "300px",
    overflowY: "auto",
  },
  historyList: {
    listStyleType: "none",
    padding: 0,
  },
  historyItem: {
    fontSize: "14px",
    marginBottom: "5px",
  },
  commentsList: {
    listStyleType: "none",
    padding: 0,
  },
  commentItem: {
    fontSize: "14px",
    marginBottom: "5px",
  },
};

// Hover and focus states
styles.input[":focus"] = styles.textarea[":focus"] = {
  borderColor: "#66afe9",
};
styles.button[":hover"] = {
  backgroundColor: "#45a049",
};
styles.clearButton[":hover"] = {
  backgroundColor: "#c9302c",
};
styles.closeButton[":hover"] = {
  color: "#333",
};
