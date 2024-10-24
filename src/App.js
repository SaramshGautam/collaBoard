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
import "./App.css"; // Import the CSS file
import { useState } from "react";

// Step 2: Custom ShapeUtil Class for the LikeShape
import { HTMLContainer, ShapeUtil } from "tldraw";

class LikeShapeUtil extends ShapeUtil {
  static type = "like"; // Define a unique type for this custom shape

  // Default properties for the shape
  getDefaultProps() {
    return {
      w: 100,
      h: 50,
      text: "👍", // Add the text property with emoji
    };
  }

  // Geometry for the shape (rectangle dimensions)
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
            backgroundColor: "lightblue",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "24px",
            border: "1px solid black",
            borderRadius: "8px",
          }}
        >
          {shape.props.text} {/* Display the "👍" emoji */}
        </div>
      </HTMLContainer>
    );
  }

  // Indicator for the shape when selected (outline)
  indicator(shape) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}

// Custom Context Menu
function CustomContextMenu(props) {
  const editor = useEditor(); // Access the editor instance
  const [selectedShape, setSelectedShape] = useState(null);

  // Function to handle right-click (context menu) and ensure selection
  const handleContextMenu = (event) => {
    event.preventDefault(); // Prevent the default context menu
    console.log("Right-click event triggered.");

    const point = editor.screenToPage({ x: event.clientX, y: event.clientY });
    console.log("Right-clicked canvas coordinates:", point);

    const shape = editor.getShapeAtPoint(point);

    if (shape) {
      console.log("Shape found and selected:", shape.id);
      setSelectedShape(shape.id);
      editor.select(shape.id);
    } else {
      console.log("No shape found at the clicked point.");
    }
  };

  const handleLikeClick = () => {
    const clickPoint = editor.inputs.currentPagePoint; // Get the current click point on the canvas

    // Create the custom "Like" shape with a rectangle and emoji inside
    editor.createShapes([
      {
        id: `shape:${nanoid()}`, // Generate a unique ID starting with "shape:"
        type: "geo", // Use the custom shape type
        x: clickPoint.x,
        y: clickPoint.y,
        props: {
          geo: "cloud",
          w: 50, // Width of the rectangle
          h: 50, // Height of the rectangle
          text: "👍", // Emoji inside the rectangle
          size: "s",
          color: "light-blue",
          fill: "solid",
          // color: "black",
          labelColor: "black",
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
