import React, { useState } from 'react';
import Icon from './Icon';

const DesktopIcon = ({ icon, label, onDoubleClick }) => {
  const [selected, setSelected] = useState(false);

  return (
    <div
      className={`win98-desktop-icon ${selected ? 'selected' : ''}`}
      onClick={() => setSelected(!selected)}
      onDoubleClick={onDoubleClick}
    >
      <Icon type={icon} size={32} />
      <div className="win98-desktop-icon-label">{label}</div>
    </div>
  );
};

const Desktop = ({ icons = [], onIconOpen }) => {
  return (
    <div 
      style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, 80px)',
        gridAutoRows: '80px',
        gap: '8px',
        padding: '16px',
        height: 'calc(100vh - 28px)',
        alignContent: 'start'
      }}
    >
      {icons.map((icon, index) => (
        <DesktopIcon
          key={index}
          icon={icon.icon}
          label={icon.label}
          onDoubleClick={() => onIconOpen(icon.id)}
        />
      ))}
    </div>
  );
};

export default Desktop;
