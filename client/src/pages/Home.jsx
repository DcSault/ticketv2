import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Desktop, Taskbar } from '../components/win98';

function Home() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [activeTask, setActiveTask] = useState(null);

  const desktopIcons = [
    { id: 'app', icon: 'phone', label: 'Application' },
    { id: 'stats', icon: 'chart', label: 'Statistiques' },
    { id: 'archives', icon: 'archive', label: 'Archives' },
  ];

  if (user?.role === 'global_admin') {
    desktopIcons.push({ id: 'admin', icon: 'settings', label: 'Administration' });
  }

  desktopIcons.push(
    { id: 'computer', icon: 'computer', label: 'Poste de travail' },
    { id: 'docs', icon: 'document', label: 'Mes documents' },
    { id: 'logout', icon: 'user', label: 'Déconnexion' }
  );

  const handleIconOpen = (iconId) => {
    switch (iconId) {
      case 'app':
        navigate('/app');
        break;
      case 'stats':
        navigate('/statistics');
        break;
      case 'archives':
        navigate('/archives');
        break;
      case 'admin':
        navigate('/admin');
        break;
      case 'logout':
        authService.logout();
        break;
      default:
        break;
    }
  };

  const tasks = [
    {
      id: 'desktop',
      title: `Bureau - ${user?.fullName || user?.username}`,
      icon: 'computer'
    }
  ];

  return (
    <div className="win98-body">
      <Desktop icons={desktopIcons} onIconOpen={handleIconOpen} />
      <Taskbar tasks={tasks} onTaskClick={setActiveTask} activeTaskId={activeTask} />
    </div>
  );
}

export default Home;
