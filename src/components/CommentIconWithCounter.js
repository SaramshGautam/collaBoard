import React from "react";

export default function CommentIconWithCounter({ count, x, y }) {
  const iconSize = 24; // Adjust the size based on the actual icon
  const offset = 10; // Offset to position icon relative to the shape

  const iconContainerStyle = {
    position: "absolute",
    top: y - offset,
    left: x - offset,
    width: `${iconSize + 16}px`, // Adjust size for the ring
    height: `${iconSize + 16}px`,
    borderRadius: "50%",
    border: "3px solid #000", // Creates the ring around the icon
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5", // Background color for the inner circle
    zIndex: 2,
  };

  const counterStyle = {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    backgroundColor: "#f00",
    color: "#fff",
    borderRadius: "50%",
    padding: "2px 5px",
    fontSize: "12px",
    fontWeight: "bold",
  };

  return (
    <div style={iconContainerStyle}>
      <span
        role="img"
        aria-label="comment"
        style={{ fontSize: `${iconSize}px` }}
      >
        💬
      </span>
      {count > 1 && <span style={counterStyle}>{count}</span>}
    </div>
  );
}
