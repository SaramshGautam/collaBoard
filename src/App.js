import React from "react";
import { Tldraw } from "tldraw";
import { useSyncDemo } from "@tldraw/sync";
import "tldraw/tldraw.css";
import "./App.css";

// Import the custom components
import LikeShapeUtil from "./components/LikeShapeUtil";
import CustomContextMenu from "./components/CustomContextMenu";

// Define the components object
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
