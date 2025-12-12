import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Ship,
  Wallet,
  UsersRound,
  FileBarChart,
  Settings,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { path: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { path: '/customers', label: 'العملاء', icon: Users },
  { path: '/invoices', label: 'الفواتير', icon: FileText },
  { path: '/agents', label: 'الوكلاء الملاحيين', icon: Ship },
  { path: '/accounts', label: 'إدارة الحسابات', icon: Wallet },
  { path: '/employees', label: 'إدارة الموظفين', icon: UsersRound },
  { path: '/reports', label: 'التقارير', icon: FileBarChart },
  { path: '/settings', label: 'الإعدادات', icon: Settings },
];

export default function Sidebar({ isOpen, isCollapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  return (
    <aside
      className={`fixed right-0 top-0 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out z-40 flex flex-col ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            نظام الجمارك
          </h2>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRight
            className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
              isCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-r-4 border-primary-600 dark:border-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div
          className={`flex items-center gap-3 mb-3 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role === 'admin'
                  ? 'مدير'
                  : user?.role === 'accountant'
                  ? 'محاسب'
                  : 'مشاهد'}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}
