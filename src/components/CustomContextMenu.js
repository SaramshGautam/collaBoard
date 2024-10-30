import React, { useState } from "react";
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

    const shape = editor.getShape(selectedShape.id);
    const { x = 0, y = 0 } = shape;

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
    </div>
  );
}
