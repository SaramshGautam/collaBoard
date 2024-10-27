import {
  Tldraw,
  TLComponents,
  DefaultContextMenu,
  TldrawUiMenuItem,
  DefaultContextMenuContent,
  TldrawUiMenuGroup,
  stopEventPropagation,
  useEditor,
} from "tldraw";
import { nanoid } from "nanoid";
import { useSyncDemo } from "@tldraw/sync";
import "tldraw/tldraw.css";
import "./App.css";
import { useState } from "react";
import { HTMLContainer, ShapeUtil } from "tldraw";

class LikeShapeUtil extends ShapeUtil {
  static type = "like";

  getDefaultProps() {
    return {
      w: 50,
      h: 50,
      text: "👍",
    };
  }

  getGeometry(shape) {
    return {
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    };
  }

  component(shape) {
    return (
      <HTMLContainer>
        <div
          style={{
            width: shape.props.w,
            height: shape.props.h,
            background: "linear-gradient(135deg, #e66465, #9198e5)",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "28px",
            fontWeight: "bold",
            color: "#fff",
            borderRadius: "50%",
            border: "2px solid #333",
            padding: "8px",
            transition: "transform 0.2s, background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {shape.props.text}
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}

function CustomContextMenu(props) {
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
    const { x = 0, y = 0, props = {}, rotation = 0 } = shape;

    const width = typeof props.w === "number" ? props.w : 50;
    const topRightX = x + width - 10;
    const topRightY = y - 10;

    if (!isNaN(topRightX) && !isNaN(topRightY)) {
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
            size: "s",
            fill: "solid",
            verticalAlign: "middle",
          },
        },
      ]);
    } else {
      console.error(
        "Invalid coordinates for Like shape:",
        topRightX,
        topRightY
      );
    }
  };

  const handleCommentClick = () => {
    if (!selectedShape) return;

    const shape = editor.getShape(selectedShape.id);
    const { x = 0, y = 0 } = shape;

    // Top-left position for the comment icon
    const iconX = x - 15; // Shift to the left of the shape
    const iconY = y - 15; // Shift above the shape

    if (!isNaN(iconX) && !isNaN(iconY)) {
      editor.createShapes([
        {
          id: `shape:${nanoid()}`,
          type: "geo",
          x: iconX,
          y: iconY,
          props: {
            geo: "rectangle",
            w: 50, // Smaller icon width
            h: 50, // Smaller icon height
            text: "💬", // Comment icon
            color: "black",
            fill: "solid",
            verticalAlign: "middle",
          },
        },
      ]);
    } else {
      console.error("Invalid coordinates for Comment icon:", iconX, iconY);
    }
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

const components = {
  ContextMenu: CustomContextMenu,
};

const MyCustomShapes = [LikeShapeUtil];

export default function App() {
  const store = useSyncDemo({ roomId: "collaBoard-abc123" });

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw
        store={store}
        shapeUtils={MyCustomShapes}
        components={components}
      />
    </div>
  );
}
