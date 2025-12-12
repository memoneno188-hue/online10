import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleCollapse}
      />

      <div
        className={`transition-all duration-200 ${
          isSidebarOpen
            ? isSidebarCollapsed
              ? 'mr-[72px]'
              : 'mr-64'
            : 'mr-0'
        }`}
      >
        <Header onToggleSidebar={toggleSidebar} />

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
