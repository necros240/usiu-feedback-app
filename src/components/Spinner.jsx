import React from "react";

export default function Spinner({ fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="full-screen-loader">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="spinner-container">
      <div className="spinner"></div>
    </div>
  );
}