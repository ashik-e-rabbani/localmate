import React from "react";

interface LoadingSpinnerProps {
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = "Processing ...",
}) => {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <span className="loading-text">{text}</span>
    </div>
  );
};
