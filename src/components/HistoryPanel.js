import React from "react";
import "../App.css";

export default function HistoryPanel({ actionHistory }) {
  return (
    <div className="historyPanel">
      <h4 className="historyTitle">Action History</h4>
      <ul className="historyList">
        {actionHistory.map((action, index) => (
          <li key={index} className="historyItem">
            <strong>{action.userId}</strong> {action.action} at{" "}
            {action.timestamp}
          </li>
        ))}
      </ul>
    </div>
  );
}
