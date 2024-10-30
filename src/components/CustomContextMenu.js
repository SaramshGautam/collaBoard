import React, { useState, useEffect, useRef } from "react";
import {
  DefaultContextMenu,
  TldrawUiMenuItem,
  TldrawUiMenuGroup,
  DefaultContextMenuContent,
  useEditor,
} from "tldraw";
import { nanoid } from "nanoid";

export default function CustomContextMenu(props) {
  const editor = useEditor();
  const [selectedShape, setSelectedShape] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentData, setCommentData] = useState({
    userId: "User123", // Set your ID or fetch dynamically
    timestamp: new Date().toLocaleString(),
    text: "",
  });
  const commentInputRef = useRef(null);

  const handleContextMenu = (event) => {
    event.preventDefault();
    const point = editor.screenToPage({ x: event.clientX, y: event.clientY });
    const shape = editor.getShapeAtPoint(point);

    if (shape) {
      setSelectedShape(shape);
      editor.select(shape.id);
    } else {
      setSelectedShape(null);
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
          w: 50,
          h: 50,
          text: "👍",
          color: "blue",
          fill: "solid",
          verticalAlign: "middle",
        },
      },
    ]);
  };

  const handleCommentClick = () => {
    if (!selectedShape) return;
    setShowCommentBox(true); // Show the comment input box
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    if (!selectedShape) return;

    const shape = editor.getShape(selectedShape.id);
    const { x = 0, y = 0 } = shape;

    // Top-left position for the comment icon
    const iconX = x - 15;
    const iconY = y - 15;

    editor.createShapes([
      {
        id: `shape:${nanoid()}`,
        type: "geo",
        x: iconX,
        y: iconY,
        props: {
          geo: "rectangle",
          w: 50,
          h: 50,
          text: "💬",
          color: "black",
          fill: "solid",
          verticalAlign: "middle",
        },
      },
    ]);

    setShowCommentBox(false); // Close the comment box
    setCommentData({ ...commentData, text: "" }); // Clear the comment input
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

const styles = {
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
