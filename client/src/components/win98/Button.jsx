import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  disabled = false,
  isDefault = false,
  type = "button",
  className = ""
}) => {
  return (
    <button
      type={type}
      className={`win98-button ${isDefault ? 'win98-button-default' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
