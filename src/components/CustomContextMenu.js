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

export default function CustomContextMenu(props) {
  const editor = useEditor();
  const [selectedShape, setSelectedShape] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comments, setComments] = useState({});
  const [actionHistory, setActionHistory] = useState([]);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [shapeReactions, setShapeReactions] = useState({});
  const [shapeToRibbonMap, setShapeToRibbonMap] = useState({});
  const [groupIds, setGroupIds] = useState({});

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

      // Minimize all other ribbons
      Object.keys(shapeToRibbonMap).forEach((shapeId) => {
        const ribbonId = shapeToRibbonMap[shapeId];
        if (ribbonId && editor.getShape(ribbonId)) {
          editor.updateShapes([
            {
              id: ribbonId,
              props: { w: 50 }, // Minimized width for unselected ribbons
            },
          ]);
        }
      });

      // Maximize the ribbon for the selected shape
      const ribbonId = shapeToRibbonMap[shape.id];
      if (ribbonId && editor.getShape(ribbonId)) {
        editor.updateShapes([
          {
            id: ribbonId,
            props: { w: 200 }, // Maximized width for selected ribbon
          },
        ]);
      }
      console.log("Shape ID:", shape.id);
    } else {
      setSelectedShape(null);
      console.log("No shape found at this point.");
    }
  };

  // const handleReactions = ({
  //   reactionId,
  //   shapeId,
  //   offsetX = -10,
  //   offsetY = 10,
  // }) => {
  //   if (!shapeId) return;

  //   const shape = editor.getShape(shapeId);

  //   if (!shape) {
  //     console.error(`Shape with ID ${shapeId} not found.`);
  //     return;
  //   }

  //   const { x = 0, y = 0, props = {} } = shape;
  //   const ribbonHeight = 20; // Fixed height for the ribbon
  //   const ribbonOffsetX = offsetX; // Horizontal offset for the ribbon
  //   const ribbonOffsetY = offsetY; // Vertical offset for the ribbon

  //   const reaction = reactions.find((r) => r.id === reactionId);

  //   if (!reaction) return;

  //   setShapeReactions((prevReactions) => {
  //     const currentReactions = prevReactions[shapeId] || {};
  //     const updatedReactions = {
  //       ...currentReactions,
  //       [reaction.icon]: (currentReactions[reaction.icon] || 0) + 1,
  //     };

  //     // Serialize reactions as a single-line string of icons
  //     const ribbonIcons = Object.entries(updatedReactions)
  //       .map(([reactionIcon, count]) => `${reactionIcon}:${count} `)
  //       .join(" ");

  //     // Dynamically calculate ribbon width based on the length of the reaction string
  //     const ribbonWidth = Math.max(100, ribbonIcons.length * 15);

  //     const ribbonX = x + (props.w || 50) + ribbonOffsetX;
  //     const ribbonY = y + ribbonOffsetY;

  //     let ribbonId = shapeToRibbonMap[shapeId]; // Check if ribbon exists

  //     if (ribbonId && editor.getShape(ribbonId)) {
  //       // Update the existing ribbon
  //       editor.updateShapes([
  //         {
  //           id: ribbonId,
  //           props: {
  //             text: ribbonIcons,
  //             w: shapeId === selectedShape?.id ? ribbonWidth : 50, // Maximize if selected, minimize otherwise
  //           },
  //         },
  //       ]);
  //     } else {
  //       // Create a new ribbon
  //       ribbonId = `shape:${nanoid()}`;
  //       editor.createShapes([
  //         {
  //           id: ribbonId,
  //           type: "geo",
  //           x: ribbonX,
  //           y: ribbonY,
  //           props: {
  //             geo: "rectangle",
  //             w: shapeId === selectedShape?.id ? ribbonWidth : 50, // Maximize if selected
  //             h: ribbonHeight,
  //             text: ribbonIcons,
  //             color: "yellow",
  //             fill: "solid",
  //             verticalAlign: "middle",
  //           },
  //         },
  //       ]);
  //       setShapeToRibbonMap((prevMap) => ({
  //         ...prevMap,
  //         [shapeId]: ribbonId,
  //       }));
  //     }

  //     // Ensure ribbon and shape are grouped
  //     const groupShapes = [shapeId, ribbonId].filter((id) =>
  //       editor.getShape(id)
  //     );

  //     // Ungroup any existing group if valid
  //     const existingGroupId = groupIds[shapeId];
  //     if (existingGroupId && editor.getShape(existingGroupId)) {
  //       editor.ungroupShapes([existingGroupId]);
  //     }

  //     // Create new group with shape and ribbon
  //     const newGroupId = editor.groupShapes(groupShapes);
  //     setGroupIds((prev) => ({ ...prev, [shapeId]: newGroupId }));

  //     return {
  //       ...prevReactions,
  //       [shapeId]: updatedReactions,
  //     };
  //   });

  //   logAction({ userId: "User123", action: `${reactionId} added` });
  // };

  const handleReactions = ({
    reactionId,
    shapeId,
    offsetX = -10,
    offsetY = 10,
  }) => {
    if (!shapeId) return;

    const shape = editor.getShape(shapeId);

    if (!shape) {
      console.error(`Shape with ID ${shapeId} not found.`);
      return;
    }

    const { x = 0, y = 0, props = {} } = shape;
    const ribbonHeight = 20; // Fixed height for the ribbon
    const ribbonOffsetX = offsetX; // Horizontal offset for the ribbon
    const ribbonOffsetY = offsetY; // Vertical offset for the ribbon

    const reaction = reactions.find((r) => r.id === reactionId);

    if (!reaction) return;

    setShapeReactions((prevReactions) => {
      const currentReactions = prevReactions[shapeId] || {};
      const updatedReactions = {
        ...currentReactions,
        [reaction.icon]: (currentReactions[reaction.icon] || 0) + 1,
      };

      // Serialize reactions as a single-line string of icons
      const ribbonIcons = Object.entries(updatedReactions)
        .map(([reactionIcon, count]) => `${reactionIcon}:${count} `)
        .join(" ");

      // Dynamically calculate ribbon width based on the length of the reaction string
      const ribbonWidth = Math.max(100, ribbonIcons.length * 15);

      const ribbonX = x + (props.w || 50) + ribbonOffsetX;
      const ribbonY = y + ribbonOffsetY;

      let ribbonId = shapeToRibbonMap[shapeId]; // Check if ribbon exists

      if (ribbonId && editor.getShape(ribbonId)) {
        // Update the existing ribbon
        editor.updateShapes([
          {
            id: ribbonId,
            props: {
              text: shapeId === selectedShape?.id ? ribbonIcons : "", // Show text only for selected shape
              w: shapeId === selectedShape?.id ? ribbonWidth : 50, // Maximize if selected, minimize otherwise
            },
          },
        ]);
      } else {
        // Create a new ribbon
        ribbonId = `shape:${nanoid()}`;
        editor.createShapes([
          {
            id: ribbonId,
            type: "geo",
            x: ribbonX,
            y: ribbonY,
            props: {
              geo: "rectangle",
              w: shapeId === selectedShape?.id ? ribbonWidth : 50, // Maximize if selected
              h: ribbonHeight,
              text: shapeId === selectedShape?.id ? ribbonIcons : "", // Hide text for unselected shapes
              color: "yellow",
              fill: "solid",
              verticalAlign: "middle",
            },
          },
        ]);
        setShapeToRibbonMap((prevMap) => ({
          ...prevMap,
          [shapeId]: ribbonId,
        }));
      }

      // Ensure ribbon and shape are grouped
      const groupShapes = [shapeId, ribbonId].filter((id) =>
        editor.getShape(id)
      );

      // Ungroup any existing group if valid
      const existingGroupId = groupIds[shapeId];
      if (existingGroupId && editor.getShape(existingGroupId)) {
        editor.ungroupShapes([existingGroupId]);
      }

      // Create new group with shape and ribbon
      const newGroupId = editor.groupShapes(groupShapes);
      setGroupIds((prev) => ({ ...prev, [shapeId]: newGroupId }));

      return {
        ...prevReactions,
        [shapeId]: updatedReactions,
      };
    });

    logAction({ userId: "User123", action: `${reactionId} added` });
  };

  const handleReactionClick = (reactionId) => {
    if (!selectedShape) return;

    handleReactions({
      reactionId,
      shapeId: selectedShape.id,
      offsetX: -10,
      offsetY: 10,
    });
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

  return (
    <div onContextMenu={handleContextMenu}>
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
            <TldrawUiMenuItem
              id="react"
              label="React 🙂"
              icon="🙂"
              readonlyOk
              className="menu-item-react"
            />
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
              icon="💬"
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
      <CommentBox
        selectedShape={selectedShape}
        addComment={addComment}
        showCommentBox={showCommentBox}
        onClose={() => setShowCommentBox(false)}
      />
    </div>
  );
}
