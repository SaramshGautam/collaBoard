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

  // Component for rendering the shape on the canvas
  component(shape) {
    return (
      <HTMLContainer>
        <div
          style={{
            width: shape.props.w,
            height: shape.props.h,
            backgroundColor: "blue",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "24px",
            border: "1px solid black",
            borderRadius: "8px",
          }}
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

// Custom Context Menu
function CustomContextMenu(props) {
  const editor = useEditor();
  const [selectedShape, setSelectedShape] = useState(null);

  // Function to handle right-click (context menu) and ensure selection
  const handleContextMenu = (event) => {
    event.preventDefault();
    console.log("Right-click event triggered.");

    const point = editor.screenToPage({ x: event.clientX, y: event.clientY });
    console.log("Right-clicked canvas coordinates:", point);

    const shape = editor.getShapeAtPoint(point);

    if (shape) {
      console.log("Shape found and selected:", shape.id);
      setSelectedShape(shape);
      editor.select(shape.id);
    } else {
      setSelectedShape(null);
      console.log("No shape found at the clicked point.");
    }
  };

  const handleLikeClick = () => {
    if (!selectedShape) return;

    const shape = editor.getShape(selectedShape.id);
    const { x = 0, y = 0, props = {}, rotation = 0 } = shape;

    // Ensure width and height are numbers
    const width = typeof props.w === "number" ? props.w : 50;
    const radians = (rotation * Math.PI) / 180;

    const topRightX = x + width - 10;
    const topRightY = y - 10;
    // const topRightX = x + width * Math.cos(radians);
    // const topRightY = y - width * Math.sin(radians);

    if (!isNaN(topRightX) && !isNaN(topRightY)) {
      // Create the "Like" shape only if x and y are valid
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
              id="react"
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
              id="react"
              label="Comment 💬"
              icon="code"
              readonlyOk
              onSelect={() => alert("Comment option clicked!")}
              className="menu-item-comment"
            />
          </div>
        </TldrawUiMenuGroup>
        <DefaultContextMenuContent />
      </DefaultContextMenu>
    </div>
  );
}

// Defining custom components for Tldraw
const components = {
  ContextMenu: CustomContextMenu,
};

const MyCustomShapes = [LikeShapeUtil]; // Register the custom shape utility

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
