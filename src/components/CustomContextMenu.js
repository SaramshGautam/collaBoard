import React, { useState, useEffect } from "react";
import {
  DefaultContextMenu,
  TldrawUiMenuGroup,
  DefaultContextMenuContent,
  useEditor,
} from "tldraw";
// import { nanoid } from "nanoid";
import "../App.css";
//import HistoryCommentPanel from "./HistoryCommentPanel";
import ToggleExpandButton from "./ToggleExpandButton";
import ReactionTooltip from "./tooltip/ReactionTooltip";
import ReactionsMenu from "./ReactionsMenu";

import CommentIconWithCounter from "./CommentIconWithCounter";
import CommentBox from "./CommentBox";
import CommentMenu from "./CommentMenu";

export default function CustomContextMenu({
  shapeReactions,
  setShapeReactions,
  selectedShape,
  setSelectedShape,
  commentCounts,
  setCommentCounts,
  ...props
}) {
  const editor = useEditor();
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comments, setComments] = useState({});
  const [actionHistory, setActionHistory] = useState([]);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const unsubscribe = editor.store.listen(({ changes }) => {
      if (changes.selectedIds) {
        const selectedIds = editor.getSelectedShapeIds();
        if (selectedIds.length === 0) {
          setSelectedShape(null);
        } else {
          const shape = editor.getShape(selectedIds[0]);
          if (shape) {
            setSelectedShape(shape);

            const geometry = editor.getShapeGeometry(shape);
            if (geometry) {
              const bounds = geometry.bounds;
              const adjustedPosition = {
                x: bounds.minX + bounds.width / 2,
                y: bounds.minY - 10,
              };
              setTooltipPosition(adjustedPosition);
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [editor, setSelectedShape]);

  const handleReactionSelect = (id, reactionType) => {
    if (!selectedShape) return;

    setShapeReactions((prevReactions) => {
      const currentReactions = prevReactions[selectedShape.id] || {
        Like: 0,
        Dislike: 0,
        Confused: 0,
        Surprised: 0,
      };

      const updatedReactions = {
        ...currentReactions,
        [reactionType]: currentReactions[reactionType] + 1,
      };

      return {
        ...prevReactions,
        [selectedShape.id]: updatedReactions,
      };
    });

    console.log("--- Updated Shape Reactions ---", shapeReactions);
  };

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

  const addComment = (shapeId, commentData) => {
    console.log("Adding comment for shapeId:", shapeId);

    const commentDataWithTime = {
      ...commentData,
      timestamp: new Date().toLocaleString(),
    };

    setComments((prevComments) => {
      const updatedComments = {
        ...prevComments,
        [shapeId]: [...(prevComments[shapeId] || []), commentDataWithTime],
      };
      return updatedComments;
    });

    setCommentCounts((prevCounts) => {
      const updatedCounts = {
        ...prevCounts,
        [shapeId]: (prevCounts[shapeId] || 0) + 1,
      };
      return updatedCounts;
    });
  };

  const renderCommentIconWithCounter = (shapeId) => {
    const shapeComments = comments[shapeId] || [];
    if (shapeComments.length === 0) return null;

    const shape = editor.getShape(shapeId);
    if (!shape) {
      console.error("[ERROR] Shape not found for ID:", shapeId);
      return null;
    }

    const position = editor.screenToPage({ x: shape.x, y: shape.y });

    return (
      <CommentIconWithCounter
        shapeId={shapeId}
        count={shapeComments.length}
        x={position.x}
        y={position.y}
      />
    );
  };

  return (
    <div onContextMenu={handleContextMenu}>
      {Object.keys(shapeReactions).map((shapeId) => {
        // const shape = editor.getShape(shapeId);
        return (
          <div key={shapeId} className="shape-container">
            <div className="shape">{shapeId}</div>
          </div>
        );
      })}
      {selectedShape && (
        <ReactionTooltip
          reactions={shapeReactions[selectedShape.id] || {}}
          position={tooltipPosition}
          visible={!!selectedShape}
        />
      )}
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
            <ReactionsMenu
              onReactionSelect={(reactionType) => {
                if (selectedShape) {
                  handleReactionSelect(selectedShape.id, reactionType);
                }
              }}
            />
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
      {/* Toggle Button positioned at the bottom-left corner of the panel 
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
      </div>*/}
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
