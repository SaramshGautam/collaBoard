import React, { useState } from "react";
import { Tldraw } from "tldraw";
import { useSyncDemo } from "@tldraw/sync";
import "tldraw/tldraw.css";
import "./App.css";
import CustomContextMenu from "./components/CustomContextMenu";
import Navbar from "./components/navbar/Navbar";
import ContextToolbarComponent from "./components/ContextToolbarComponent";
import { GroupTool } from "./utils/GroupTool";
import uiOverrides from "./utils/uiOverrides";

const customTools = [GroupTool];

// Define the components object
const components = {
  Navbar: Navbar,
  ContextMenu: CustomContextMenu,
  InFrontOfTheCanvas: ContextToolbarComponent,
};

export default function App() {
  const store = useSyncDemo({ roomId: "collaBoard-abc123" });
  const [shapeReactions, setShapeReactions] = useState({});
  const [selectedShape, setSelectedShape] = useState(null);

  return (
    <div className="main-container" style={{ position: "fixed", inset: 0 }}>
      <Navbar />
      {/* <Tldraw
        store={store}
        components={components}
        tools={customTools}
        overrides={uiOverrides}
      /> */}
      <Tldraw
        store={store}
        tools={customTools}
        overrides={uiOverrides}
        components={{
          ContextMenu: (props) => (
            <CustomContextMenu
              {...props}
              shapeReactions={shapeReactions}
              setShapeReactions={setShapeReactions}
              selectedShape={selectedShape}
              setSelectedShape={setSelectedShape}
            />
          ),
          InFrontOfTheCanvas: (props) => (
            <ContextToolbarComponent
              {...props}
              selectedShape={selectedShape}
              shapeReactions={shapeReactions}
            />
          ),
        }}
      />
    </div>
  );
}
