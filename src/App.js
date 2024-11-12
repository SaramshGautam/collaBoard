import React from "react";
import { Tldraw } from "tldraw";
import { useSyncDemo } from "@tldraw/sync";
import "tldraw/tldraw.css";
import "./App.css";
import CustomContextMenu from "./components/CustomContextMenu";
import Navbar from "./components/navbar/Navbar";

// Define the components object
const components = {
  Navbar: Navbar,
  ContextMenu: CustomContextMenu,
};

export default function App() {
  const store = useSyncDemo({ roomId: "collaBoard-abc123" });

  return (
    <div className="main-container" style={{ position: "fixed", inset: 0 }}>
      <Navbar />
      <Tldraw store={store} components={components} />
    </div>
  );
}
