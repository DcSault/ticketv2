import React from 'react';

const Icon = ({ type = "computer", size = 32 }) => {
  const icons = {
    computer: (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
        <rect x="4" y="4" width="24" height="18" fill="#808080" />
        <rect x="6" y="6" width="20" height="14" fill="#00A8A8" />
        <rect x="8" y="8" width="16" height="10" fill="#000080" />
        <rect x="12" y="22" width="8" height="4" fill="#808080" />
        <rect x="8" y="26" width="16" height="2" fill="#808080" />
      </svg>
    ),
    folder: (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
        <rect x="4" y="8" width="24" height="16" fill="#FFFF00" />
        <rect x="4" y="6" width="12" height="4" fill="#FFFF00" />
        <rect x="6" y="10" width="20" height="12" fill="#C0C000" />
      </svg>
    ),
    phone: (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
        <rect x="8" y="4" width="16" height="24" fill="#000000" />
        <rect x="10" y="6" width="12" height="20" fill="#00FF00" />
        <rect x="12" y="8" width="8" height="12" fill="#000000" />
        <circle cx="16" cy="23" r="2" fill="#808080" />
      </svg>
    ),
    document: (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
        <rect x="8" y="4" width="16" height="24" fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
        <rect x="12" y="8" width="8" height="2" fill="#000080" />
        <rect x="12" y="12" width="12" height="2" fill="#000000" />
        <rect x="12" y="16" width="12" height="2" fill="#000000" />
        <rect x="12" y="20" width="8" height="2" fill="#000000" />
      </svg>
    ),
    settings: (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
        <rect x="12" y="4" width="8" height="4" fill="#808080" />
        <rect x="8" y="8" width="16" height="16" fill="#808080" />
        <circle cx="16" cy="16" r="4" fill="#C0C0C0" />
        <rect x="12" y="24" width="8" height="4" fill="#808080" />
        <rect x="4" y="12" width="4" height="8" fill="#808080" />
        <rect x="24" y="12" width="4" height="8" fill="#808080" />
      </svg>
    ),
    chart: (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
        <rect x="4" y="4" width="24" height="24" fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
        <rect x="8" y="20" width="4" height="6" fill="#0000FF" />
        <rect x="14" y="14" width="4" height="12" fill="#FF0000" />
        <rect x="20" y="10" width="4" height="16" fill="#00FF00" />
      </svg>
    ),
    archive: (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
        <rect x="6" y="8" width="20" height="16" fill="#C08040" />
        <rect x="8" y="10" width="16" height="12" fill="#A06020" />
        <rect x="14" y="14" width="4" height="6" fill="#808080" />
        <rect x="4" y="6" width="24" height="4" fill="#806020" />
      </svg>
    ),
    user: (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
        <circle cx="16" cy="12" r="6" fill="#FFE0BD" />
        <rect x="10" y="18" width="12" height="10" fill="#0000FF" />
        <rect x="8" y="20" width="16" height="8" rx="4" fill="#0000FF" />
      </svg>
    ),
    windows: (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
        <rect x="4" y="4" width="12" height="12" fill="#FF0000" />
        <rect x="18" y="4" width="10" height="12" fill="#00FF00" />
        <rect x="4" y="18" width="12" height="10" fill="#0000FF" />
        <rect x="18" y="18" width="10" height="10" fill="#FFFF00" />
      </svg>
    ),
    error: (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
        <circle cx="16" cy="16" r="12" fill="#FF0000" />
        <rect x="14" y="8" width="4" height="10" fill="#FFFFFF" />
        <rect x="14" y="20" width="4" height="4" fill="#FFFFFF" />
      </svg>
    ),
    info: (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
        <circle cx="16" cy="16" r="12" fill="#0000FF" />
        <rect x="14" y="8" width="4" height="4" fill="#FFFFFF" />
        <rect x="14" y="14" width="4" height="10" fill="#FFFFFF" />
      </svg>
    ),
    warning: (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
        <polygon points="16,4 28,28 4,28" fill="#FFFF00" />
        <rect x="14" y="12" width="4" height="8" fill="#000000" />
        <rect x="14" y="22" width="4" height="4" fill="#000000" />
      </svg>
    ),
    success: (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
        <circle cx="16" cy="16" r="12" fill="#00FF00" />
        <polyline points="10,16 14,20 22,12" stroke="#000000" strokeWidth="2" fill="none" />
      </svg>
    )
  };

  return icons[type] || icons.computer;
};

export default Icon;
