import React, { useState, useEffect } from 'react';
import Icon from './Icon';

const Taskbar = ({ tasks = [], onTaskClick, activeTaskId }) => {
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Start Menu */}
      {showStartMenu && (
        <div className="win98-start-menu">
          <div className="win98-start-menu-header">
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Windows 98</span>
          </div>
          <div className="win98-start-menu-items">
            <div className="win98-start-menu-item">
              <Icon type="phone" size={16} />
              <span>Application</span>
            </div>
            <div className="win98-start-menu-item">
              <Icon type="chart" size={16} />
              <span>Statistiques</span>
            </div>
            <div className="win98-start-menu-item">
              <Icon type="archive" size={16} />
              <span>Archives</span>
            </div>
            <div className="win98-start-menu-item">
              <Icon type="settings" size={16} />
              <span>Administration</span>
            </div>
            <div className="win98-start-menu-separator" />
            <div className="win98-start-menu-item">
              <Icon type="document" size={16} />
              <span>Documents</span>
            </div>
            <div className="win98-start-menu-separator" />
            <div className="win98-start-menu-item">
              <Icon type="user" size={16} />
              <span>Déconnexion</span>
            </div>
            <div className="win98-start-menu-item">
              <Icon type="computer" size={16} />
              <span>Arrêter...</span>
            </div>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="win98-taskbar">
        {/* Start Button */}
        <button 
          className="win98-start-button"
          onClick={() => setShowStartMenu(!showStartMenu)}
        >
          <Icon type="windows" size={16} />
          <span>Démarrer</span>
        </button>

        {/* Task Buttons */}
        {tasks.map((task) => (
          <button
            key={task.id}
            className={`win98-task-button ${activeTaskId === task.id ? 'active' : ''}`}
            onClick={() => onTaskClick(task.id)}
            title={task.title}
          >
            {task.icon && <Icon type={task.icon} size={16} />}
            <span>{task.title}</span>
          </button>
        ))}

        {/* System Tray */}
        <div className="win98-systray">
          <span>{formatTime(time)}</span>
        </div>
      </div>
    </>
  );
};

export default Taskbar;
