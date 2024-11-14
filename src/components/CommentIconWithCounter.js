import React, { useEffect } from "react";
import { useEditor } from "tldraw";
import { nanoid } from "nanoid";

export default function CommentIconWithCounter({ shapeId, count }) {
  const editor = useEditor();

  useEffect(() => {
    const iconSize = 18;
    const offset = 15;
    const iconId = `shape:${nanoid()}`;
    const counterId = `shape:${nanoid()}`;

    const updateCommentIconPosition = () => {
      const shape = editor.getShape(shapeId);
      if (!shape) return;

      const { x, y, props } = shape;
      const topRightX = x - offset;
      const topRightY = y - offset;

      // Remove existing icon and counter to prevent duplication
      editor.deleteShapes([iconId, counterId]);

      // Create the comment icon shape
      editor.createShapes([
        {
          id: iconId,
          type: "geo",
          x: topRightX,
          y: topRightY,
          isLocked: true,
          props: {
            geo: "ellipse",
            w: 60,
            h: 30,
            text: "💬", // Comment icon
            color: "black",
            fill: "solid",
            verticalAlign: "middle",
          },
        },
      ]);

      // Create the counter as a separate shape if count > 1
      if (count > 1) {
        editor.createShapes([
          {
            id: counterId,
            type: "text",
            x: x + iconSize,
            y: y - iconSize / 3,
            isLocked: true,
            props: {
              text: count.toString(),
              color: "red",
            },
          },
        ]);
      }
    };

    // Update the comment icon position when the shape moves or changes
    editor.on("shapeChange", updateCommentIconPosition);

    // Initial update to place the icon
    updateCommentIconPosition();

    // Cleanup on component unmount
    return () => {
      editor.deleteShapes([iconId, counterId]);
      editor.off("shapeChange", updateCommentIconPosition);
    };
  }, [editor, shapeId, count]);

  return null;
}

// import React from "react";
// import { useEditor } from "tldraw";
// import { nanoid } from "nanoid";

// export default function CommentIconWithCounter({ count, x, y }) {
//   const editor = useEditor();

//   React.useEffect(() => {
//     const iconSize = 18;
//     const offset = 15;

//     const existingIcon = editor.getShape(`shape:${x}-${y}`);
//     if (existingIcon) {
//       editor.deleteShapes([existingIcon.id]);
//     }

//     editor.createShapes([
//       {
//         id: `shape:${nanoid()}`, // Unique ID for the icon shape
//         type: "geo",
//         x: x - offset,
//         y: y - offset,
//         props: {
//           geo: "ellipse",
//           w: 60,
//           h: 30,
//           text: "💬", // Comment icon
//           color: "black",
//           fill: "solid",
//           verticalAlign: "middle",
//         },
//       },
//     ]);

//     // Create the counter as a separate shape if count > 1
//     if (count > 1) {
//       editor.createShapes([
//         {
//           id: `shape:${nanoid()}`,
//           type: "text",
//           x: x + iconSize,
//           y: y - iconSize / 3,
//           props: {
//             text: count.toString(),
//             color: "red",
//           },
//         },
//       ]);
//     }
//   }, [count, x, y, editor]);

//   return null;
// }
