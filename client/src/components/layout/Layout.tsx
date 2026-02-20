import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  BrainCircuit, 
  LogOut, 
  Briefcase 
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { organization, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'AI Insights', path: '/ai-insights', icon: BrainCircuit },
  ];

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-100 font-sans overflow-hidden">
      
      <aside className="w-64 bg-[#1e293b] border-r border-[#334155] flex flex-col">
    
        <div className="h-16 flex items-center px-6 border-b border-[#334155]">
          <Briefcase className="w-6 h-6 text-indigo-500 mr-3" />
          <span className="font-bold text-lg tracking-wide truncate">
            {organization?.name || 'RizeOS'}
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-500/10 text-indigo-400 font-medium' 
                    : 'text-slate-400 hover:bg-[#334155]/50 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#334155]">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-slate-300">Logged in as</span>
              <span className="text-xs text-slate-500 truncate">{user?.role || 'User'}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-[#334155] bg-[#1e293b]/50 backdrop-blur-sm flex items-center px-8">
          <h2 className="text-xl font-semibold text-slate-200 capitalize">
            {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
          </h2>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <Outlet /> 
        </div>
      </main>

    </div>
  );
}