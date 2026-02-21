import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ThemeToggle } from '../ThemeToggle';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  BrainCircuit, 
  LogOut, 
  Menu 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils'; 

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Employees', href: '/employees', icon: Users },
  { name: 'AI Insights', href: '/ai-insights', icon: BrainCircuit },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLinks = () => (
    <div className="flex flex-col gap-2 mt-6">
      {navigation.map((item) => {
        const isActive = location.pathname.includes(item.href);
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </div>
  );

  return (
    // Set the outer container to exactly screen height and prevent scrolling
    <div className="flex h-screen w-full bg-background overflow-hidden">
      
      {/* DESKTOP SIDEBAR - h-full ensures it takes up exactly the screen height */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex h-full">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <div className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">R</div>
            RizeOS
          </div>
        </div>
        <div className="flex-1 px-4 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="p-4 border-t shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              {user?.role?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col text-sm">
              <span className="font-medium truncate max-w-[120px]">{user?.role}</span>
              <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA - min-w-0 prevents flex blowout */}
      <div className="flex flex-1 flex-col min-w-0">
        
        {/* TOP HEADER - Fixed height, border bottom */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 justify-between md:justify-end">
          
          {/* MOBILE MENU TRIGGER */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <div className="flex items-center gap-2 font-semibold tracking-tight pb-4 border-b">
                 RizeOS
              </div>
              <NavLinks />
              <div className="mt-auto">
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* RIGHT SIDE ACTIONS */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* PAGE CONTENT INJECTION (Outlet) - overflow-y-auto makes it scroll! */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}