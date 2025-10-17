import React, { useState } from 'react';

const Window = ({ 
  title = "Window", 
  icon, 
  children, 
  onClose,
  width = "600px",
  height = "400px",
  resizable = false,
  className = ""
}) => {
  const [isActive, setIsActive] = useState(true);

  return (
    <div 
      className={`win98-window ${className}`}
      style={{ width, height, minHeight: "150px" }}
      onClick={() => setIsActive(true)}
    >
      {/* Title Bar */}
      <div className={`win98-title-bar ${!isActive ? 'inactive' : ''}`}>
        <div className="win98-title">
          {icon && <img src={icon} alt="" className="win98-title-icon" />}
          <span>{title}</span>
        </div>
        <div className="win98-title-buttons">
          <button className="win98-button-minimize" aria-label="Minimize">
            _
          </button>
          <button className="win98-button-maximize" aria-label="Maximize">
            □
          </button>
          <button 
            className="win98-button-close" 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div style={{ height: "calc(100% - 24px)", overflow: "auto" }} className="win98-scrollbar">
        {children}
      </div>
    </div>
  );
};

export default Window;
