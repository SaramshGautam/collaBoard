import React, { createContext, useState, useContext } from "react";

const FlashMessageContext = createContext();

export const FlashMessageProvider = ({ children }) => {
  const [message, setMessage] = useState(null);

  const addMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000); // Message auto-dismisses after 3 seconds
  };

  return (
    <FlashMessageContext.Provider value={addMessage}>
      {children}
      {message && (
        <div
          className={`flash-message flash-message-${message.type} position-fixed end-0 m-3`}
          role="alert"
          style={{
            top: "70px",
            zIndex: 1050,
            padding: "8px 16px", // Sleek padding
            borderRadius: "10px", // Rounded corners
            boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)", // Subtle shadow
            fontFamily: "Arial, sans-serif", // Modern font
            fontSize: "14px", // Clean font size
            minWidth: "250px", // Ensuring a consistent width
          }}
        >
          {message.text}
        </div>
      )}
    </FlashMessageContext.Provider>
  );
};

export const useFlashMessage = () => {
  return useContext(FlashMessageContext);
};
