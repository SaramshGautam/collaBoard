import React from "react";
import { TldrawUiIcon, track, useEditor } from "tldraw";
import "tldraw/tldraw.css";

const SIZES = [
  { value: "Like", icon: "check-circle" },
  { value: "Dislike", icon: "cross-circle" },
  { value: "Surprised", icon: "warning-triangle" },
  { value: "Confused", icon: "question-mark-circle" },
];

const ContextToolbarComponent = track(
  ({ selectedShape, shapeReactions, commentCounts }) => {
    const editor = useEditor();
    const tooltipWidth = 200;

    // Get the bounding box of the selected shapes in canvas (page) coordinates, accounting for rotation.
    const selectionRotatedPageBounds = editor.getSelectionRotatedPageBounds();
    if (!selectionRotatedPageBounds || !selectedShape) return null;

    //Calculating the center of the selected bounds
    const centerX =
      selectionRotatedPageBounds.minX + selectionRotatedPageBounds.width / 2;
    const centerY = selectionRotatedPageBounds.minY;

    const viewportCenter = editor.pageToViewport({ x: centerX, y: centerY });

    const selectedId = selectedShape.id;
    const selectedShapeReactions = shapeReactions[selectedId] || {};
    const selectedShapeCommentCount = commentCounts[selectedId] || 0;

    console.log("Selected shape comment count:", selectedShapeCommentCount);

    return (
      <div
        style={{
          position: "absolute",
          pointerEvents: "all",
          top: viewportCenter.y - 42,
          left: viewportCenter.x - tooltipWidth / 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)",
            background: "var(--color-panel)",
            padding: "10px",
          }}
        >
          {/* Comment Section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <TldrawUiIcon icon="tool-note" />
            <span style={{ fontSize: "12px" }}>
              {selectedShapeCommentCount}
            </span>
          </div>

          {/* Vertical Separator */}
          <div
            style={{
              width: "1px",
              height: "20px",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              margin: "0 5px", // Adjust spacing around the separator
            }}
          ></div>

          {/* Reactions Section */}
          <div style={{ display: "flex", gap: "10px" }}>
            {SIZES.map(({ value, icon }) => (
              <div
                key={value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  background: "#f9f9f9",
                }}
              >
                <TldrawUiIcon icon={icon} />
                <span style={{ fontSize: "12px" }}>
                  {selectedShapeReactions[value] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

export default ContextToolbarComponent;
