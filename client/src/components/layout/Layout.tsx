import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CheckSquare, BrainCircuit, 
  LogOut, Menu, X, Wallet, ShieldCheck 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '../ThemeToggle';
import { toast } from 'sonner';

export default function Layout() {
  const { logout, organization } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask to use Web3 features.");
      return;
    }
    
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      toast.success("Wallet connected to RizeOS");
    } catch (err) {
      toast.error("Connection failed.");
    } finally {
      setIsConnecting(false);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'AI Insights', path: '/ai-insights', icon: BrainCircuit },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-primary-foreground w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">RizeOS</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive" 
            onClick={() => { logout(); navigate('/login'); }}
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="text-sm font-semibold truncate hidden sm:block">
              {organization?.name || 'Workspace'} Admin
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* 🚀 WALLET BUTTON */}
            <Button 
              variant={walletAddress ? "outline" : "default"}
              size="sm"
              className="h-9 gap-2"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              <Wallet className="w-4 h-4" />
              {walletAddress 
                ? `${walletAddress.substring(0,6)}...${walletAddress.substring(38)}` 
                : "Connect Wallet"}
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
}