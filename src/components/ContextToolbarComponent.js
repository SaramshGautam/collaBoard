// import {
//   DefaultSizeStyle,
//   Tldraw,
//   TldrawUiIcon,
//   TLEditorComponents,
//   track,
//   useEditor,
// } from "tldraw";
// import "tldraw/tldraw.css";

// const SIZES = [
//   { value: "like", icon: "check-circle" },
//   { value: "dislike", icon: "cross-circle" },
//   { value: "confused", icon: "question-mark-circle" },
//   { value: "surprised", icon: "warning-triangle" },
// ];

// const ContextToolbarComponent = track((selectedShape,shapeReactions) => {
//   const editor = useEditor();
//   const showToolbar = editor.isIn("select.idle");
//   if (!showToolbar) return null;

//   const selectionRotatedPageBounds = editor.getSelectionRotatedPageBounds();
//   if (!selectionRotatedPageBounds) return null;

//   const size = editor.getSharedStyles().get(DefaultSizeStyle);
//   if (!size) return null;
//   const currentSize = size.type === "shared" ? size.value : undefined;

//   const pageCoordinates = editor.pageToViewport(
//     selectionRotatedPageBounds.point
//   );

//   return (
//     <div
//       style={{
//         position: "absolute",
//         pointerEvents: "all",
//         top: pageCoordinates.y - 42,
//         left: pageCoordinates.x,
//         width: selectionRotatedPageBounds.width * editor.getZoomLevel(),
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//       }}
//       onPointerDown={(e) => e.stopPropagation()}
//     >
//       <div
//         style={{
//           borderRadius: 8,
//           display: "flex",
//           boxShadow: "0 0 0 1px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)",
//           background: "var(--color-panel)",
//           width: "fit-content",
//           alignItems: "center",
//         }}
//       >
//         {SIZES.map(({ value, icon }) => {
//           const isActive = value === currentSize;
//           console.log("--- shape Reaction 0 --- ", shapeReactions);
//           const isReacted = shapeReactions[0] === value;
//           return (
//             <div
//               key={value}
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 height: 32,
//                 width: 32,
//                 background: isActive ? "var(--color-muted-2)" : "transparent",
//               }}
//               onClick={() =>
//                 editor.setStyleForSelectedShapes(DefaultSizeStyle, value)
//               }
//             >
//               <TldrawUiIcon icon={icon} />
//               {isReacted && (
//                 <div
//                   style={{
//                     position: "absolute",
//                     top: 4,
//                     right: 4,
//                     height: 8,
//                     width: 8,
//                     borderRadius: "50%",
//                     background: "red",
//                   }}
//                 />
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// });

// export default ContextToolbarComponent;

import React from "react";
import { TldrawUiIcon, track, useEditor } from "tldraw";
import "tldraw/tldraw.css";

const SIZES = [
  { value: "Like", icon: "check-circle" },
  { value: "Dislike", icon: "cross-circle" },
  { value: "Confused", icon: "question-mark-circle" },
  { value: "Surprised", icon: "warning-triangle" },
];

const ContextToolbarComponent = track(({ selectedShape, shapeReactions }) => {
  const editor = useEditor();
  const selectionRotatedPageBounds = editor.getSelectionRotatedPageBounds();
  if (!selectionRotatedPageBounds) return null;

  // Ensure there is a selected shape
  if (!selectedShape) return null;

  // Get the shape ID
  const selectedId = selectedShape.id;

  // Fetch reactions for the selected shape from shapeReactions
  const selectedShapeReactions = shapeReactions[selectedId];

  // Log reactions for debugging
  console.log("Selected Shape Reactions:", selectedShapeReactions);

  // Ensure there are reactions for the selected shape
  if (!selectedShapeReactions) return null;

  return (
    <div
      style={{
        position: "absolute",
        pointerEvents: "all",
        top: selectedShape.y - 42, // Adjust based on shape's position
        width: selectionRotatedPageBounds.width * editor.getZoomLevel(),
        left: selectedShape.x, // Adjust based on shape's position
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
          flexDirection: "column",
          alignItems: "center",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)",
          background: "var(--color-panel)",
          padding: "10px",
        }}
      >
        {/* Display Reaction Counts */}
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
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
              <span
                style={{
                  fontSize: "12px",
                }}
              >
                {selectedShapeReactions[value] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default ContextToolbarComponent;
